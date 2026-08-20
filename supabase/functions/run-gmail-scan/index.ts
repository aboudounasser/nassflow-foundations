import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Méthode non autorisée." }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const clientId = Deno.env.get("GOOGLE_CLIENT_ID")!;
  const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET")!;
  const openaiKey = Deno.env.get("OPENAI_API_KEY")!;

  // ─── 1. Identifier l'appelant par son jeton ────────────────
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return json({ error: "Authentification requise." }, 401);

  const asUser = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: userError } = await asUser.auth.getUser();
  if (userError || !userData.user) return json({ error: "Session invalide." }, 401);

  let organizationId = "";
  let integrationId = "";
  try {
    const body = await req.json();
    organizationId = String(body.organizationId ?? "");
    integrationId = String(body.integrationId ?? "");
  } catch {
    return json({ error: "Requête invalide." }, 400);
  }
  if (!organizationId || !integrationId) {
    return json({ error: "Paramètres manquants." }, 400);
  }

  // ─── 2. Le rôle est vérifié en base, pas cru sur parole ────
  const { data: roleData } = await asUser.rpc("current_user_role", {
    org_id: organizationId,
  });
  if (!["owner", "admin"].includes(String(roleData))) {
    return json({ error: "Vous n'avez pas le droit de lancer une analyse." }, 403);
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // ─── 3. L'intégration DOIT appartenir à cette organisation ─
  //    vault_read_secret ne vérifie aucune appartenance : c'est ici
  //    que se joue l'isolation.
  const { data: integration, error: intError } = await admin
    .from("integrations")
    .select("id, organization_id, account_email, vault_secret_id, status")
    .eq("id", integrationId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (intError || !integration) {
    return json({ error: "Intégration introuvable." }, 404);
  }
  if (integration.status !== "active") {
    return json({ error: "Cette connexion Gmail n'est plus active." }, 409);
  }

  // ─── 4. Ouvrir le run ──────────────────────────────────────
  const { data: run, error: runError } = await admin
    .from("runs")
    .insert({
      organization_id: organizationId,
      integration_id: integrationId,
      status: "running",
      triggered_by: userData.user.id,
    })
    .select("id")
    .single();

  if (runError || !run) return json({ error: "Impossible de démarrer l'analyse." }, 500);
  const runId = run.id;

  // ─── 4bis. Ouvrir la mission liée ──────────────────────────
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

  const fail = async (message: string) => {
    await admin
      .from("runs")
      .update({
        status: "failed",
        finished_at: new Date().toISOString(),
        error_message: message,
      })
      .eq("id", runId);
    await closeMission("failed");
    return json({ error: message, runId }, 500);
  };

  try {
    // ─── 5. Jeton d'accès Google ─────────────────────────────
    const { data: refreshToken, error: vaultError } = await admin.rpc(
      "vault_read_secret",
      { secret_id: integration.vault_secret_id },
    );
    if (vaultError || !refreshToken) return await fail("Jeton Gmail introuvable.");

    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: String(refreshToken),
        grant_type: "refresh_token",
      }),
    });
    if (!tokenRes.ok) {
      console.error("rafraîchissement refusé", await tokenRes.text());
      await admin.from("integrations").update({ status: "error" }).eq("id", integrationId);
      return await fail("L'accès Gmail a expiré. Reconnectez le compte.");
    }
    const accessToken = (await tokenRes.json()).access_token as string;

    // ─── 6. Lister les messages ──────────────────────────────
    const listRes = await fetch(
      "https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=50&q=in:inbox",
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    if (!listRes.ok) return await fail("Lecture de la boîte impossible.");
    const ids = ((await listRes.json()).messages ?? []) as { id: string }[];

    // ─── 6bis. Écarter ce qui a déjà été traité ──────────────
    // Sans cela, chaque exécution réanalyse les mêmes messages :
    // le même prospect réapparaît indéfiniment et on paie deux fois.
    const { data: seenRows, error: seenError } = await admin
      .from("seen_messages")
      .select("message_id")
      .eq("integration_id", integrationId)
      .in("message_id", ids.map((m) => m.id));

    if (seenError) return await fail(seenError.message);
    const seen = new Set((seenRows ?? []).map((r) => r.message_id));

    let scanned = 0;
    let skipped = 0;
    let analyzed = 0;
    const candidates: {
      id: string;
      subject: string;
      from: string;
      date: string;
      body: string;
    }[] = [];
    // Messages traités lors de CE run, retenus ou non.
    const processed: { id: string; wasProspect: boolean }[] = [];

    for (const { id } of ids) {
      scanned++;

      if (seen.has(id)) {
        skipped++;
        continue;
      }

      const msgRes = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=full`,
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      if (!msgRes.ok) continue;
      const msg = await msgRes.json();
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

    // ─── 7. Analyse ──────────────────────────────────────────
    // Accumulé en MILLIÈMES de centime : un appel coûte ~0,0025
    // centime. Arrondir à chaque message multipliait le total par 400.
    let costMillicents = 0;
    const results: any[] = [];

    for (const c of candidates) {
      analyzed++;
      const aiRes = await fetch("https://api.openai.com/v1/chat/completions", {
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
      });

      if (!aiRes.ok) {
        console.error("appel modèle refusé", await aiRes.text());
        // Non marqué comme vu : on retentera au prochain passage.
        continue;
      }
      const aiData = await aiRes.json();

      // gpt-4o-mini : 0,15 $/M en entrée, 0,60 $/M en sortie.
      const usage = aiData.usage ?? {};
      costMillicents +=
        (usage.prompt_tokens ?? 0) * 0.0015 +
        (usage.completion_tokens ?? 0) * 0.006;

      let parsed: any;
      try {
        parsed = JSON.parse(aiData.choices?.[0]?.message?.content ?? "{}");
      } catch {
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
      if (insertError) return await fail(insertError.message);
    }

    // ─── 8. Mémoriser les messages traités ───────────────────
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

    return json(
      {
        runId,
        emailsScanned: scanned,
        emailsSkipped: skipped,
        emailsAnalyzed: analyzed,
        prospectsFound: results.length,
        costCents,
      },
      200,
    );
  } catch (e) {
    console.error("échec inattendu", e);
    return await fail(e instanceof Error ? e.message : "Erreur inattendue.");
  }
});