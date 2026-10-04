/**
 * Cœur de l'analyse d'une boîte Gmail, partagé par les points d'entrée
 * (`run-gmail-scan` aujourd'hui, l'analyse planifiée demain).
 *
 * Ce module ne connaît ni HTTP ni l'appelant : l'authentification et la
 * vérification du rôle restent à la charge du point d'entrée. Il reçoit un
 * client `service_role` et rend un verdict que le point d'entrée traduit en
 * réponse.
 */
import type { SupabaseClient } from "jsr:@supabase/supabase-js@2.117.2";

export interface ScanConfig {
  googleClientId: string;
  googleClientSecret: string;
  openaiKey: string;
}

export function loadScanConfig(): ScanConfig {
  return {
    googleClientId: Deno.env.get("GOOGLE_CLIENT_ID")!,
    googleClientSecret: Deno.env.get("GOOGLE_CLIENT_SECRET")!,
    openaiKey: Deno.env.get("OPENAI_API_KEY")!,
  };
}

export interface ScanRequest {
  organizationId: string;
  integrationId: string;
  /** Utilisateur à l'origine du run. */
  triggeredBy: string | null;
}

export interface ScanSummary {
  runId: string;
  emailsScanned: number;
  emailsSkipped: number;
  emailsAnalyzed: number;
  /**
   * Messages abandonnés en cours de route : lecture Gmail ou appel au modèle
   * en échec (repris au prochain passage), réponse du modèle illisible
   * (marquée vue, jamais repayée). Renvoyé seulement : la colonne
   * `runs.emails_failed` n'existe pas encore.
   */
  emailsFailed: number;
  prospectsFound: number;
  costCents: number;
}

/**
 * Messages destinés à l'utilisateur. Ils sont écrits dans `runs.error_message`
 * et affichés tels quels sur la fiche mission : jamais de détail technique ici,
 * il part dans les journaux de la fonction.
 */
const GMAIL_ACCESS_EXPIRED = "L'accès Gmail a expiré. Reconnectez le compte.";
const GOOGLE_UNAVAILABLE = "Google n'a pas pu être joint. Réessayez dans quelques minutes.";
const UNEXPECTED_ERROR = "L'analyse a échoué à cause d'une erreur inattendue. Réessayez plus tard.";

/**
 * Une erreur PostgreSQL n'atteint l'utilisateur que si elle a été rédigée pour
 * lui : un `raise exception` de trigger ou de fonction (SQLSTATE `P0001`) passe
 * intact, tout le reste (droits, contraintes, réseau) devient un message neutre.
 */
function userFacingDbError(error: { code?: string; message: string }): string {
  return error.code === "P0001" ? error.message : UNEXPECTED_ERROR;
}

/**
 * Code d'erreur OAuth renvoyé par Google (`{"error": "invalid_grant", …}`).
 * Seul `invalid_grant` signifie que le jeton ne servira plus jamais (révoqué,
 * ou expiré : 7 jours tant que l'application Google est en mode « Test »).
 */
function googleOAuthError(body: string): string | null {
  try {
    const parsed = JSON.parse(body);
    return typeof parsed?.error === "string" ? parsed.error : null;
  } catch {
    return null;
  }
}

/**
 * - `rejected` : refusé avant toute écriture (aucun run créé) ;
 * - `failed` : le run a été ouvert puis clos en échec ;
 * - `succeeded` : le run a abouti.
 */
export type ScanOutcome =
  | { kind: "rejected"; status: number; error: string }
  | { kind: "failed"; runId: string; error: string }
  | { kind: "succeeded"; summary: ScanSummary };

/** Écarte ce qui est manifestement automatique. Filtre sur la FORME,
 *  jamais sur le contenu : un prospect peut écrire « bonjour, une
 *  question » sans aucun mot-clé commercial. */
function looksAutomated(headers: Record<string, string>): boolean {
  const from = (headers["from"] ?? "").toLowerCase();
  if (/no-?reply|newsletter|notification|mailer-daemon|do-?not-?reply/.test(from)) {
    return true;
  }
  if (headers["list-unsubscribe"] || headers["list-id"] || headers["precedence"]) {
    return true;
  }
  return false;
}

function headerMap(payload: any): Record<string, string> {
  const out: Record<string, string> = {};
  for (const h of payload?.headers ?? []) {
    out[String(h.name).toLowerCase()] = String(h.value ?? "");
  }
  return out;
}

function extractBody(payload: any, depth = 0): string {
  if (depth > 4) return "";
  if (payload?.mimeType === "text/plain" && payload?.body?.data) {
    try {
      return atob(payload.body.data.replace(/-/g, "+").replace(/_/g, "/"));
    } catch {
      return "";
    }
  }
  for (const part of payload?.parts ?? []) {
    const found = extractBody(part, depth + 1);
    if (found) return found;
  }
  return "";
}

interface Candidate {
  id: string;
  subject: string;
  from: string;
  date: string;
  body: string;
}

/** Requête de classification d'un message, envoyée à `gpt-4o-mini`. */
function classificationRequest(openaiKey: string, c: Candidate): RequestInit {
  return {
    method: "POST",
    headers: {
      Authorization: `Bearer ${openaiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "Tu analyses un e-mail professionnel reçu par une entreprise française. " +
            "Détermine s'il s'agit d'une demande commerciale entrante : quelqu'un " +
            "qui exprime un besoin, demande un devis, un renseignement, ou manifeste " +
            "un intérêt pour une offre. Ce n'est PAS le cas d'une facture, d'une " +
            "candidature, d'un message interne, d'une publicité reçue, ou d'un " +
            "échange administratif. Réponds en JSON strict : " +
            '{"isProspect": boolean, "confidence": 0-100, "reasoning": "une phrase ' +
            'en français expliquant ta décision", "name": string|null, ' +
            '"company": string|null, "email": string|null, "phone": string|null, ' +
            '"request": "ce que la personne demande, en une phrase"|null}',
        },
        {
          role: "user",
          content: `De : ${c.from}\nObjet : ${c.subject}\n\n${c.body}`,
        },
      ],
    }),
  };
}

export async function runGmailScan(
  admin: SupabaseClient,
  config: ScanConfig,
  request: ScanRequest,
): Promise<ScanOutcome> {
  const { organizationId, integrationId, triggeredBy } = request;

  // ─── 1. L'intégration DOIT appartenir à cette organisation ─
  //    vault_read_secret ne vérifie aucune appartenance : c'est ici
  //    que se joue l'isolation.
  const { data: integration, error: intError } = await admin
    .from("integrations")
    .select("id, organization_id, account_email, vault_secret_id, status")
    .eq("id", integrationId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (intError || !integration) {
    return { kind: "rejected", status: 404, error: "Intégration introuvable." };
  }
  if (integration.status !== "active") {
    return { kind: "rejected", status: 409, error: "Cette connexion Gmail n'est plus active." };
  }

  // ─── 2. Ouvrir le run ──────────────────────────────────────
  const { data: run, error: runError } = await admin
    .from("runs")
    .insert({
      organization_id: organizationId,
      integration_id: integrationId,
      status: "running",
      triggered_by: triggeredBy,
    })
    .select("id")
    .single();

  if (runError || !run) {
    return { kind: "rejected", status: 500, error: "Impossible de démarrer l'analyse." };
  }
  const runId: string = run.id;

  // ─── 2bis. Ouvrir la mission liée ──────────────────────────
  // Non bloquant : un échec ici ne doit pas empêcher l'analyse
  // elle-même de se dérouler, seulement priver le Mission Center
  // de visibilité sur ce run précis.
  let missionId: string | null = null;
  const { data: mission, error: missionError } = await admin
    .from("missions")
    .insert({
      organization_id: organizationId,
      run_id: runId,
      title: `Analyse Gmail — ${new Date().toLocaleDateString("fr-FR")}`,
      objective: "Identifier les demandes commerciales entrantes dans la boîte Gmail connectée.",
      status: "running",
    })
    .select("id")
    .single();
  if (missionError) {
    console.error("mission non créée", missionError.message);
  } else {
    missionId = mission.id;
  }

  const closeMission = async (status: "completed" | "failed") => {
    if (!missionId) return;
    await admin
      .from("missions")
      .update({
        status,
        progress: 100,
        completed_at: new Date().toISOString(),
      })
      .eq("id", missionId);
  };

  const fail = async (message: string): Promise<ScanOutcome> => {
    await admin
      .from("runs")
      .update({
        status: "failed",
        finished_at: new Date().toISOString(),
        error_message: message,
      })
      .eq("id", runId);
    await closeMission("failed");
    return { kind: "failed", runId, error: message };
  };

  try {
    // ─── 3. Jeton d'accès Google ─────────────────────────────
    const { data: refreshToken, error: vaultError } = await admin.rpc(
      "vault_read_secret",
      { secret_id: integration.vault_secret_id },
    );
    if (vaultError || !refreshToken) return await fail("Jeton Gmail introuvable.");

    let tokenRes: Response;
    try {
      tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: config.googleClientId,
          client_secret: config.googleClientSecret,
          refresh_token: String(refreshToken),
          grant_type: "refresh_token",
        }),
      });
    } catch (e) {
      console.error("Google injoignable", e);
      return await fail(GOOGLE_UNAVAILABLE);
    }
    if (!tokenRes.ok) {
      const detail = await tokenRes.text();
      console.error("rafraîchissement refusé", tokenRes.status, detail);
      // Seul un jeton définitivement perdu désactive l'intégration. Une panne
      // de Google (5xx) ou un défaut de configuration serveur laisse la
      // connexion active : l'utilisateur n'a rien à reconnecter.
      if (googleOAuthError(detail) === "invalid_grant") {
        await admin.from("integrations").update({ status: "error" }).eq("id", integrationId);
        return await fail(GMAIL_ACCESS_EXPIRED);
      }
      return await fail(GOOGLE_UNAVAILABLE);
    }
    const accessToken = (await tokenRes.json()).access_token as string;

    // ─── 4. Lister les messages ──────────────────────────────
    let listRes: Response;
    try {
      listRes = await fetch(
        "https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=50&q=in:inbox",
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
    } catch (e) {
      console.error("Gmail injoignable", e);
      return await fail(GOOGLE_UNAVAILABLE);
    }
    if (!listRes.ok) {
      console.error("liste des messages refusée", listRes.status, await listRes.text());
      return await fail("Lecture de la boîte impossible.");
    }
    const ids = ((await listRes.json()).messages ?? []) as { id: string }[];

    // ─── 4bis. Écarter ce qui a déjà été traité ──────────────
    // Sans cela, chaque exécution réanalyse les mêmes messages :
    // le même prospect réapparaît indéfiniment et on paie deux fois.
    const { data: seenRows, error: seenError } = await admin
      .from("seen_messages")
      .select("message_id")
      .eq("integration_id", integrationId)
      .in("message_id", ids.map((m) => m.id));

    if (seenError) {
      console.error("lecture seen_messages refusée", seenError.message);
      return await fail(userFacingDbError(seenError));
    }
    const seen = new Set((seenRows ?? []).map((r) => r.message_id));

    let scanned = 0;
    let skipped = 0;
    let analyzed = 0;
    let failed = 0;
    const candidates: Candidate[] = [];
    // Messages traités lors de CE run, retenus ou non.
    const processed: { id: string; wasProspect: boolean }[] = [];

    for (const { id } of ids) {
      scanned++;

      if (seen.has(id)) {
        skipped++;
        continue;
      }

      // Un message illisible (quota, panne passagère) n'interrompt pas le run :
      // il est compté en échec et, non marqué comme vu, repris au prochain passage.
      let msg: any;
      try {
        const msgRes = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=full`,
          { headers: { Authorization: `Bearer ${accessToken}` } },
        );
        if (!msgRes.ok) {
          console.error("message illisible", id, msgRes.status);
          failed++;
          continue;
        }
        msg = await msgRes.json();
      } catch (e) {
        console.error("message illisible", id, e);
        failed++;
        continue;
      }
      const headers = headerMap(msg.payload);

      if (looksAutomated(headers)) {
        // Marqué comme vu : inutile de le relire au prochain passage.
        processed.push({ id, wasProspect: false });
        continue;
      }

      const body = extractBody(msg.payload).slice(0, 2000);
      if (!body.trim()) {
        processed.push({ id, wasProspect: false });
        continue;
      }

      candidates.push({
        id,
        subject: headers["subject"] ?? "",
        from: headers["from"] ?? "",
        date: headers["date"] ?? "",
        body,
      });
    }

    // ─── 5. Analyse ──────────────────────────────────────────
    // Accumulé en MILLIÈMES de centime : un appel coûte ~0,0025
    // centime. Arrondir à chaque message multipliait le total par 400.
    let costMillicents = 0;
    const results: any[] = [];

    for (const c of candidates) {
      analyzed++;
      // Panne ou refus du modèle : rien n'a été facturé, le message n'est pas
      // marqué comme vu et sera repris au prochain passage.
      let aiData: any;
      try {
        const aiRes = await fetch(
          "https://api.openai.com/v1/chat/completions",
          classificationRequest(config.openaiKey, c),
        );
        if (!aiRes.ok) {
          console.error("appel modèle refusé", aiRes.status, await aiRes.text());
          failed++;
          continue;
        }
        aiData = await aiRes.json();
      } catch (e) {
        console.error("modèle injoignable", e);
        failed++;
        continue;
      }

      // gpt-4o-mini : 0,15 $/M en entrée, 0,60 $/M en sortie.
      const usage = aiData.usage ?? {};
      costMillicents +=
        (usage.prompt_tokens ?? 0) * 0.0015 +
        (usage.completion_tokens ?? 0) * 0.006;

      let parsed: any = null;
      try {
        parsed = JSON.parse(aiData.choices?.[0]?.message?.content ?? "{}");
      } catch {
        parsed = null;
      }
      if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
        // L'appel est déjà payé : le message est marqué comme vu pour ne
        // jamais le repayer. Le reposer au modèle donnerait la même réponse.
        console.error("réponse du modèle illisible", c.id);
        failed++;
        processed.push({ id: c.id, wasProspect: false });
        continue;
      }

      // Seuil bas et volontaire : on montre ce que le modèle a pensé,
      // l'utilisateur tranche.
      const retained = Boolean(parsed.isProspect) && (parsed.confidence ?? 0) >= 50;
      processed.push({ id: c.id, wasProspect: retained });

      if (!retained) continue;

      results.push({
        run_id: runId,
        organization_id: organizationId,
        source_message_id: c.id,
        source_subject: c.subject,
        source_from: c.from,
        source_date: c.date ? new Date(c.date).toISOString() : null,
        extracted: {
          name: parsed.name ?? null,
          company: parsed.company ?? null,
          email: parsed.email ?? null,
          phone: parsed.phone ?? null,
          request: parsed.request ?? null,
        },
        confidence: Math.min(100, Math.max(0, parsed.confidence ?? 0)),
        reasoning: parsed.reasoning ?? null,
      });
    }

    if (results.length > 0) {
      const { error: insertError } = await admin.from("run_results").insert(results);
      if (insertError) {
        console.error("insertion run_results refusée", insertError.message);
        return await fail(userFacingDbError(insertError));
      }
    }

    // ─── 6. Mémoriser les messages traités ───────────────────
    // Écrit APRÈS les résultats : si l'insertion précédente échoue,
    // le message reste à traiter plutôt que d'être perdu.
    if (processed.length > 0) {
      const { error: seenInsertError } = await admin.from("seen_messages").upsert(
        processed.map((p) => ({
          organization_id: organizationId,
          integration_id: integrationId,
          message_id: p.id,
          first_run_id: runId,
          was_prospect: p.wasProspect,
        })),
        { onConflict: "integration_id,message_id", ignoreDuplicates: true },
      );
      if (seenInsertError) console.error("mémorisation partielle", seenInsertError.message);
    }

    const costCents = Math.round(costMillicents / 1000);
    if (failed > 0) console.warn("messages en échec", { runId, failed });

    await admin
      .from("runs")
      .update({
        status: "succeeded",
        finished_at: new Date().toISOString(),
        emails_scanned: scanned,
        emails_analyzed: analyzed,
        prospects_found: results.length,
        ai_cost_cents: costCents,
      })
      .eq("id", runId);
    await closeMission("completed");

    return {
      kind: "succeeded",
      summary: {
        runId,
        emailsScanned: scanned,
        emailsSkipped: skipped,
        emailsAnalyzed: analyzed,
        emailsFailed: failed,
        prospectsFound: results.length,
        costCents,
      },
    };
  } catch (e) {
    console.error("échec inattendu", e);
    return await fail(UNEXPECTED_ERROR);
  }
}
