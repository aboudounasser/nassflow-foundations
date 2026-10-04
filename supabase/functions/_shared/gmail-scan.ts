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
  /** Utilisateur à l'origine du run ; `null` pour une analyse planifiée. */
  triggeredBy: string | null;
  /** Écrit dans `runs.trigger_source`, contraint côté base. */
  triggerSource: "manual" | "schedule";
}

export interface ScanSummary {
  runId: string;
  emailsScanned: number;
  emailsSkipped: number;
  emailsAnalyzed: number;
  /**
   * Messages abandonnés en cours de route : lecture Gmail ou appel au modèle
   * en échec (repris au prochain passage), réponse du modèle illisible
   * (marquée vue, jamais repayée). Écrit dans `runs.emails_failed`.
   */
  emailsFailed: number;
  prospectsFound: number;
  /** Arrondi au centime : conservé pour la compatibilité de la réponse. */
  costCents: number;
  /** Coût réel, en millièmes de centime (`runs.ai_cost_millicents`). */
  costMillicents: number;
  /** `budget` : arrêt avant la fin, budget IA quotidien de la boîte atteint. */
  stopReason: "budget" | null;
  /**
   * Messages de la fenêtre restant à traiter (`runs.backlog_remaining`) :
   * au-delà des 50 de ce passage, non analysés faute de budget, ou en échec
   * réessayable. Borne basse si la liste a été tronquée à 10 pages.
   */
  backlogRemaining: number;
}

/** Plafond de messages ouverts par analyse, inchangé depuis la première version. */
export const MAX_MESSAGES_PER_RUN = 50;
/** Gmail rend au plus 500 identifiants par page : 5 000 au total. */
const LIST_PAGE_SIZE = 500;
export const MAX_LIST_PAGES = 10;
/** Sans repère (première analyse), la fenêtre remonte à sept jours. */
export const FIRST_PASS_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
/**
 * Marge sous le repère : couvre les messages horodatés juste avant le début de
 * l'analyse précédente mais arrivés après. Les doublons sont écartés par
 * `seen_messages`.
 */
export const WATERMARK_OVERLAP_MS = 60 * 60 * 1000;
/** Identifiants par requête `in(...)` sur seen_messages : l'URL reste courte. */
const SEEN_LOOKUP_CHUNK = 200;
/** Miroirs des valeurs par défaut de `scan_schedules` (migration 20261004140000). */
export const DEFAULT_DAILY_BUDGET_MILLICENTS = 10000;
const DEFAULT_TIMEZONE = "Europe/Paris";

/**
 * Messages destinés à l'utilisateur. Ils sont écrits dans `runs.error_message`
 * et affichés tels quels sur la fiche mission : jamais de détail technique ici,
 * il part dans les journaux de la fonction.
 */
const GMAIL_ACCESS_EXPIRED = "L'accès Gmail a expiré. Reconnectez le compte.";
const GOOGLE_UNAVAILABLE = "Google n'a pas pu être joint. Réessayez dans quelques minutes.";
const GOOGLE_ACCOUNT_RESTRICTED =
  "Votre compte Google est restreint ou l'accès à NASSFLOW est bloqué par l'administrateur " +
  "Google Workspace. Vérifiez votre abonnement Workspace et les autorisations des " +
  "applications tierces.";
const SERVER_OAUTH_MISCONFIGURED = "Problème de configuration NASSFLOW, contactez le support.";
const GOOGLE_REFUSED =
  "Google a refusé de renouveler l'accès à la boîte Gmail. Réessayez plus tard ; si le " +
  "problème persiste, contactez le support.";
const UNEXPECTED_ERROR = "L'analyse a échoué à cause d'une erreur inattendue. Réessayez plus tard.";
const SCAN_ALREADY_RUNNING = "Une analyse est déjà en cours pour cette boîte.";

/**
 * Décalage d'un fuseau à un instant donné, en millisecondes (Paris : +2 h en
 * été, +1 h en hiver).
 */
function timezoneOffsetMs(at: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(at);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  return asUtc - Math.floor(at.getTime() / 1000) * 1000;
}

/**
 * Minuit local du jour de `now` dans `timeZone`, en instant absolu. Le budget
 * quotidien se remet à zéro à ce moment-là.
 *
 * Deux passes : le décalage à minuit peut différer de celui de `now` le jour
 * d'un changement d'heure (le 25 octobre 2026 à midi, Paris est à +1 h, mais
 * minuit était encore à +2 h).
 */
export function startOfLocalDay(now: Date, timeZone: string): Date {
  const local = new Date(now.getTime() + timezoneOffsetMs(now, timeZone));
  const midnightAsUtc = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate());
  const first = midnightAsUtc - timezoneOffsetMs(now, timeZone);
  return new Date(midnightAsUtc - timezoneOffsetMs(new Date(first), timeZone));
}

/** Début de la fenêtre lue : repère moins la marge, ou sept jours sans repère. */
export function listWindowStart(watermark: string | null, now: Date): Date {
  if (watermark) {
    const at = new Date(watermark).getTime();
    if (Number.isFinite(at)) return new Date(at - WATERMARK_OVERLAP_MS);
  }
  return new Date(now.getTime() - FIRST_PASS_WINDOW_MS);
}

/**
 * Une erreur PostgreSQL n'atteint l'utilisateur que si elle a été rédigée pour
 * lui : un `raise exception` de trigger ou de fonction (SQLSTATE `P0001`) passe
 * intact, tout le reste (droits, contraintes, réseau) devient un message neutre.
 */
function userFacingDbError(error: { code?: string; message: string }): string {
  return error.code === "P0001" ? error.message : UNEXPECTED_ERROR;
}

/**
 * Issue d'un rafraîchissement de jeton refusé par Google.
 *
 * - `expired` : `invalid_grant`, le jeton ne servira plus jamais (révoqué, ou
 *   expiré au bout de 7 jours tant que l'application Google est en mode
 *   « Test »). Seul cas qui désactive l'intégration.
 * - `restricted` : compte Google restreint ou application bloquée par
 *   l'administrateur Workspace (abonnement suspendu, règle d'accès). Le jeton
 *   reste valide et le blocage peut se lever seul : l'intégration reste active.
 * - `server_config` : identifiants OAuth de NASSFLOW refusés. Rien que
 *   l'utilisateur puisse corriger.
 * - `unavailable` : panne de Google (5xx, limitation de débit).
 * - `refused` : tout autre refus, sans cause identifiable.
 */
export type TokenFailure = "expired" | "restricted" | "server_config" | "unavailable" | "refused";

export interface GoogleOAuthErrorBody {
  error: string | null;
  description: string | null;
  uri: string | null;
}

/** Codes OAuth qui désignent une restriction du compte ou de l'administrateur Workspace. */
const RESTRICTION_ERRORS = new Set(["access_not_configured", "admin_policy_enforced", "org_internal"]);

/**
 * Indices de restriction dans `error_description` ou `error_uri`, pour les codes
 * moins explicites (`unauthorized_client` avec « Account Restricted », lien
 * `access.workspace.google.com/ServiceNotAllowed`…).
 */
const RESTRICTION_HINT =
  /restrict|suspend|disabled|admin|workspace|policy|not ?allowed|servicenotallowed|access\.workspace\.google\.com/i;

export function parseGoogleOAuthError(body: string): GoogleOAuthErrorBody {
  try {
    const parsed = JSON.parse(body);
    const field = (key: string) => (typeof parsed?.[key] === "string" ? parsed[key] : null);
    return { error: field("error"), description: field("error_description"), uri: field("error_uri") };
  } catch {
    return { error: null, description: null, uri: null };
  }
}

export function classifyTokenFailure(status: number, body: GoogleOAuthErrorBody): TokenFailure {
  if (status >= 500 || status === 429) return "unavailable";
  if (body.error === "invalid_grant") return "expired";
  if (body.error && RESTRICTION_ERRORS.has(body.error)) return "restricted";
  // Avant les indices : la description d'un client OAuth désactivé
  // (« The OAuth client was disabled ») ne doit pas passer pour une
  // restriction du compte de l'utilisateur.
  if (body.error === "invalid_client" || body.error === "deleted_client") return "server_config";
  const hint = `${body.description ?? ""} ${body.uri ?? ""}`;
  // Tout 4xx (les 5xx et 429 sont écartés plus haut) : Google répond 400, 401
  // ou 403 selon le code, sans que le statut seul dise s'il s'agit d'une restriction.
  if (RESTRICTION_HINT.test(hint)) return "restricted";
  if (body.error === "unauthorized_client") return "server_config";
  return "refused";
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
  const { organizationId, integrationId, triggeredBy, triggerSource } = request;

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
      trigger_source: triggerSource,
    })
    .select("id")
    .single();

  // 23505 : l'index unique `runs_one_running_per_integration` refuse un second
  // run 'running' sur la même boîte, qu'il soit manuel ou planifié.
  if (runError?.code === "23505") {
    return { kind: "rejected", status: 409, error: SCAN_ALREADY_RUNNING };
  }
  if (runError || !run) {
    if (runError) console.error("ouverture du run refusée", runError.message);
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

  // Déclarés avant toute étape qui peut échouer : un run en échec garde la
  // trace de ce qu'il a déjà dépensé et des messages déjà abandonnés.
  // Coût accumulé en MILLIÈMES de centime : un appel coûte ~0,0025 centime.
  // Arrondir à chaque message multipliait le total par 400.
  let costMillicents = 0;
  let failed = 0;

  const fail = async (message: string): Promise<ScanOutcome> => {
    await admin
      .from("runs")
      .update({
        status: "failed",
        finished_at: new Date().toISOString(),
        error_message: message,
        ai_cost_millicents: Math.round(costMillicents),
        emails_failed: failed,
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
      const raw = await tokenRes.text();
      const googleError = parseGoogleOAuthError(raw);
      const failure = classifyTokenFailure(tokenRes.status, googleError);
      console.error("rafraîchissement refusé", {
        failure,
        status: tokenRes.status,
        ...googleError,
        // Corps brut seulement s'il n'est pas un JSON OAuth (page HTML d'un 502…).
        ...(googleError.error ? {} : { raw: raw.slice(0, 500) }),
      });
      // Seul un jeton définitivement perdu désactive l'intégration : une
      // restriction de compte, un défaut de configuration serveur ou une panne
      // de Google laissent la connexion active, il n'y a rien à reconnecter.
      switch (failure) {
        case "expired":
          await admin.from("integrations").update({ status: "error" }).eq("id", integrationId);
          return await fail(GMAIL_ACCESS_EXPIRED);
        case "restricted":
          console.error("compte Google restreint ou bloqué par l'administrateur Workspace", {
            integrationId,
          });
          return await fail(GOOGLE_ACCOUNT_RESTRICTED);
        case "server_config":
          console.error("configuration OAuth serveur : identifiants Google refusés", {
            error: googleError.error,
          });
          return await fail(SERVER_OAUTH_MISCONFIGURED);
        case "unavailable":
          return await fail(GOOGLE_UNAVAILABLE);
        case "refused":
          return await fail(GOOGLE_REFUSED);
      }
    }
    const accessToken = (await tokenRes.json()).access_token as string;

    // ─── 4. Réglages de la boîte et budget du jour ──────────
    // La ligne scan_schedules existe pour toute boîte Gmail (trigger et
    // rattrapage de l'étape 4) ; son absence reste tolérée : fenêtre de sept
    // jours, budget par défaut, et aucun repère enregistré.
    const scanStartedAt = new Date();
    const { data: schedule, error: scheduleError } = await admin
      .from("scan_schedules")
      .select("inbox_watermark, timezone, daily_ai_budget_millicents")
      .eq("integration_id", integrationId)
      .maybeSingle();
    if (scheduleError) {
      console.error("lecture scan_schedules refusée", scheduleError.message);
      return await fail(userFacingDbError(scheduleError));
    }
    const timeZone: string = schedule?.timezone ?? DEFAULT_TIMEZONE;
    const dailyBudget: number = schedule?.daily_ai_budget_millicents ?? DEFAULT_DAILY_BUDGET_MILLICENTS;

    // Dépense du jour sur CETTE boîte, analyses manuelles et planifiées
    // confondues. Un coût jamais mesuré (NULL) ne compte pas.
    const { data: todayRuns, error: spentError } = await admin
      .from("runs")
      .select("ai_cost_millicents")
      .eq("integration_id", integrationId)
      .gte("started_at", startOfLocalDay(scanStartedAt, timeZone).toISOString());
    if (spentError) {
      // Sans connaître la dépense, on ne dépense pas.
      console.error("lecture de la dépense du jour refusée", spentError.message);
      return await fail(userFacingDbError(spentError));
    }
    const spentBefore = (todayRuns ?? []).reduce(
      (sum: number, r: { ai_cost_millicents: number | null }) => sum + (r.ai_cost_millicents ?? 0),
      0,
    );

    // ─── 5. Lister la fenêtre, page par page ─────────────────
    // Gmail rend les messages du plus récent au plus ancien.
    const windowStart = listWindowStart(schedule?.inbox_watermark ?? null, scanStartedAt);
    const query = `in:inbox after:${Math.floor(windowStart.getTime() / 1000)}`;
    const ids: string[] = [];
    let pageToken: string | null = null;
    let pages = 0;
    do {
      const url = new URL("https://gmail.googleapis.com/gmail/v1/users/me/messages");
      url.searchParams.set("q", query);
      url.searchParams.set("maxResults", String(LIST_PAGE_SIZE));
      if (pageToken) url.searchParams.set("pageToken", pageToken);

      let listRes: Response;
      try {
        listRes = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
      } catch (e) {
        console.error("Gmail injoignable", e);
        return await fail(GOOGLE_UNAVAILABLE);
      }
      if (!listRes.ok) {
        console.error("liste des messages refusée", listRes.status, await listRes.text());
        return await fail("Lecture de la boîte impossible.");
      }
      const page = await listRes.json();
      for (const m of (page.messages ?? []) as { id: string }[]) ids.push(m.id);
      pageToken = typeof page.nextPageToken === "string" ? page.nextPageToken : null;
      pages++;
    } while (pageToken && pages < MAX_LIST_PAGES);
    // Liste tronquée : des messages plus anciens n'ont pas été vus, le repère
    // ne doit pas les dépasser.
    const truncated = pageToken !== null;

    // ─── 5bis. Écarter ce qui a déjà été traité ──────────────
    // Sans cela, chaque exécution réanalyse les mêmes messages :
    // le même prospect réapparaît indéfiniment et on paie deux fois.
    const seen = new Set<string>();
    for (let i = 0; i < ids.length; i += SEEN_LOOKUP_CHUNK) {
      const { data: seenRows, error: seenError } = await admin
        .from("seen_messages")
        .select("message_id")
        .eq("integration_id", integrationId)
        .in("message_id", ids.slice(i, i + SEEN_LOOKUP_CHUNK));
      if (seenError) {
        console.error("lecture seen_messages refusée", seenError.message);
        return await fail(userFacingDbError(seenError));
      }
      for (const r of seenRows ?? []) seen.add(r.message_id);
    }

    const unseen = ids.filter((id) => !seen.has(id));
    const skipped = ids.length - unseen.length;
    // Les plus récents d'abord ; le reste attend le passage suivant.
    const toOpen = unseen.slice(0, MAX_MESSAGES_PER_RUN);
    const beyondLimit = unseen.length - toOpen.length;

    let scanned = 0;
    let analyzed = 0;
    // Échecs repris au prochain passage (non marqués vus), à la différence
    // d'une réponse illisible du modèle, marquée vue.
    let retryable = 0;
    const candidates: Candidate[] = [];
    // Messages traités lors de CE run, retenus ou non.
    const processed: { id: string; wasProspect: boolean }[] = [];

    for (const id of toOpen) {
      scanned++;

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
          retryable++;
          continue;
        }
        msg = await msgRes.json();
      } catch (e) {
        console.error("message illisible", id, e);
        failed++;
        retryable++;
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

    // ─── 6. Analyse, sous budget ─────────────────────────────
    const results: any[] = [];
    let stopReason: "budget" | null = null;
    let notAnalyzed = 0;

    for (const [index, c] of candidates.entries()) {
      // Vérifié AVANT chaque appel : le dépassement possible se limite au
      // dernier appel autorisé, de l'ordre de 2 millicentimes.
      if (spentBefore + costMillicents >= dailyBudget) {
        stopReason = "budget";
        // Non marqués vus : ils seront analysés quand le budget le permettra.
        notAnalyzed = candidates.length - index;
        break;
      }

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
          retryable++;
          continue;
        }
        aiData = await aiRes.json();
      } catch (e) {
        console.error("modèle injoignable", e);
        failed++;
        retryable++;
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

    // ─── 7. Mémoriser les messages traités ───────────────────
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

    // ─── 8. Repère ───────────────────────────────────────────
    // N'avance que si TOUT ce que la fenêtre contenait a été traité : rien
    // au-delà des 50, rien bloqué par le budget, aucun échec à reprendre,
    // liste complète. Sinon, un message laissé derrière sortirait de la
    // fenêtre et ne serait jamais lu.
    const backlogRemaining = beyondLimit + notAnalyzed + retryable;
    let watermarkAdvanced = false;
    if (schedule && backlogRemaining === 0 && !truncated) {
      const { error: watermarkError } = await admin
        .from("scan_schedules")
        .update({ inbox_watermark: scanStartedAt.toISOString() })
        .eq("integration_id", integrationId);
      if (watermarkError) {
        // Sans gravité : la fenêtre suivante sera simplement plus large.
        console.error("repère non enregistré", watermarkError.message);
      } else {
        watermarkAdvanced = true;
      }
    }

    const costCents = Math.round(costMillicents / 1000);
    console.log("analyse terminée", {
      runId,
      windowStart: windowStart.toISOString(),
      listed: ids.length,
      pages,
      truncated,
      skipped,
      opened: scanned,
      analyzed,
      failed,
      backlogRemaining,
      stopReason,
      spentBefore,
      dailyBudget,
      watermarkAdvanced,
    });

    await admin
      .from("runs")
      .update({
        status: "succeeded",
        finished_at: new Date().toISOString(),
        emails_scanned: scanned,
        emails_analyzed: analyzed,
        prospects_found: results.length,
        ai_cost_cents: costCents,
        ai_cost_millicents: Math.round(costMillicents),
        emails_failed: failed,
        stop_reason: stopReason,
        backlog_remaining: backlogRemaining,
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
        costMillicents: Math.round(costMillicents),
        stopReason,
        backlogRemaining,
      },
    };
  } catch (e) {
    console.error("échec inattendu", e);
    return await fail(UNEXPECTED_ERROR);
  }
}
