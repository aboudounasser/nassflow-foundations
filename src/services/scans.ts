/**
 * Service Layer des analyses de boîte e-mail.
 *
 * Deux moitiés bien séparées, comme pour le raccordement OAuth :
 * - le déclenchement, confié à l'Edge Function `run-gmail-scan` (c'est elle qui
 *   vérifie que l'appelant est owner ou admin, qu'elle seule détient le jeton
 *   Google et que la connexion est toujours active) ;
 * - la lecture des tables `runs` et `run_results`, en RLS, réservée aux owner
 *   et admin.
 *
 * Aucune écriture n'est possible depuis le navigateur.
 */
import { FunctionsHttpError } from "@supabase/supabase-js";

import type {
  CrmAction,
  CrmPushOutcome,
  ExtractedProspect,
  Run,
  RunResult,
  RunStatus,
  ScanSummary,
} from "@/lib/scans/types";
import { supabase } from "@/lib/supabase/client";
import type { Json } from "@/lib/supabase/database.types";
import type { Scope } from "@/lib/tenancy/types";

const SCAN_FALLBACK_ERROR = "L'analyse n'a pas pu être lancée. Réessayez plus tard.";
const CRM_FALLBACK_ERROR = "L'envoi vers le CRM n'a pas abouti. Réessayez plus tard.";

/** Une exécution récente suffit à la première brique ; l'historique viendra plus tard. */
const RUNS_LIMIT = 20;

/**
 * Plafond de la liste cumulative des prospects. Il porte sur les lignes
 * `run_results`, donc avant regroupement : le groupe le plus ancien affiché
 * peut être tronqué. Préféré à une limite en nombre de runs, qui obligerait à
 * deux allers-retours.
 */
const PROSPECTS_LIMIT = 50;

/**
 * Plafond du bloc « À valider » de l'accueil. Il porte sur les seuls prospects
 * en attente, filtrés en base : un stock ancien jamais envoyé reste donc
 * visible, quel que soit le nombre de prospects déjà traités depuis.
 */
const PENDING_LIMIT = 20;

function errorFromBody(body: unknown): string | null {
  if (typeof body !== "object" || body === null) return null;
  const message = (body as { error?: unknown }).error;
  return typeof message === "string" && message.length > 0 ? message : null;
}

/**
 * Un statut absent de l'énumération est traité comme un échec, jamais comme une
 * réussite : mieux vaut signaler à tort qu'annoncer des résultats qui
 * n'existent pas.
 */
const KNOWN_STATUSES: RunStatus[] = ["running", "succeeded", "failed"];

function toRunStatus(value: string): RunStatus {
  return KNOWN_STATUSES.includes(value as RunStatus) ? (value as RunStatus) : "failed";
}

/**
 * `crm_action` est une chaîne contrainte côté base : elle est rétrécie ici, et
 * une valeur inconnue vaut « envoi effectué, sort indéterminé » plutôt qu'une
 * erreur — le contact est chez HubSpot dans tous les cas.
 */
const KNOWN_CRM_ACTIONS: CrmAction[] = ["created", "updated"];

function toCrmAction(value: unknown): CrmAction | null {
  return typeof value === "string" && KNOWN_CRM_ACTIONS.includes(value as CrmAction)
    ? (value as CrmAction)
    : null;
}

/** Les compteurs sont nuls tant que l'Edge Function n'a pas conclu. */
function toCount(value: number | null): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function toNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

/**
 * Date de début de l'analyse jointe. La ligne vient de PostgREST : elle est
 * validée comme le reste plutôt qu'acceptée en confiance, et une jointure
 * inattendue dégrade en chaîne vide — `formatScanDateTime` la rend « — ».
 */
function toStartedAt(value: unknown): string {
  if (typeof value !== "object" || value === null) return "";
  const started = (value as { started_at?: unknown }).started_at;
  return typeof started === "string" ? started : "";
}

/** Champ de `extracted` : tout ce qui n'est pas une chaîne non vide vaut absent. */
function toOptionalString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

/**
 * Rétrécit le `jsonb` de la base vers la forme applicative. Le contenu vient du
 * modèle : il est traité comme une donnée extérieure, chaque champ étant validé
 * séparément plutôt que le bloc accepté en confiance.
 */
function toExtracted(value: Json): ExtractedProspect {
  const raw = (
    typeof value === "object" && value !== null && !Array.isArray(value) ? value : {}
  ) as Record<string, unknown>;
  return {
    name: toOptionalString(raw["name"]),
    company: toOptionalString(raw["company"]),
    email: toOptionalString(raw["email"]),
    phone: toOptionalString(raw["phone"]),
    request: toOptionalString(raw["request"]),
  };
}

/**
 * Lance une analyse de la boîte raccordée et attend son verdict.
 *
 * L'appel dure 30 à 60 secondes : 50 messages lus un par un, puis un appel au
 * modèle par candidat. L'appelant doit prévoir l'attente — il n'y a pas de
 * suivi de progression intermédiaire.
 *
 * Les corps 403 (droits), 404 (intégration étrangère à l'organisation) et 409
 * (connexion Gmail inactive) portent le message métier ; supabase-js ne
 * l'expose pas dans `error.message` — même extraction que `deleteAccount()`.
 */
export async function startGmailScan(scope: Scope, integrationId: string): Promise<ScanSummary> {
  const { data, error } = await supabase.functions.invoke("run-gmail-scan", {
    method: "POST",
    body: { organizationId: scope.organizationId, integrationId },
  });

  if (error) {
    if (error instanceof FunctionsHttpError) {
      const body: unknown = await error.context.json().catch(() => null);
      throw new Error(errorFromBody(body) ?? SCAN_FALLBACK_ERROR);
    }
    throw new Error(error.message);
  }

  const payload = data as {
    runId?: unknown;
    emailsScanned?: unknown;
    emailsAnalyzed?: unknown;
    prospectsFound?: unknown;
    costCents?: unknown;
    error?: unknown;
  } | null;

  const inlineError = errorFromBody(payload);
  if (inlineError) throw new Error(inlineError);

  const runId = payload?.runId;
  if (typeof runId !== "string" || runId.length === 0) {
    throw new Error("Réponse inattendue du serveur : identifiant d'exécution manquant.");
  }

  return {
    runId,
    emailsScanned: toNumber(payload?.emailsScanned) ?? 0,
    emailsAnalyzed: toNumber(payload?.emailsAnalyzed) ?? 0,
    prospectsFound: toNumber(payload?.prospectsFound) ?? 0,
    costCents: toNumber(payload?.costCents) ?? 0,
  };
}

/**
 * Exécutions de l'organisation, les plus récentes d'abord.
 * La RLS réserve la lecture aux owner et admin : pour les autres rôles, la
 * requête aboutit sur une liste vide plutôt que sur une erreur.
 */
export async function listRuns(scope: Scope): Promise<Run[]> {
  const { data, error } = await supabase
    .from("runs")
    .select(
      "id, integration_id, status, started_at, finished_at, emails_scanned, emails_analyzed, prospects_found, ai_cost_cents, error_message, triggered_by",
    )
    .eq("organization_id", scope.organizationId)
    .order("started_at", { ascending: false })
    .limit(RUNS_LIMIT);

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => ({
    id: row.id,
    integrationId: row.integration_id,
    status: toRunStatus(row.status),
    startedAt: row.started_at,
    finishedAt: row.finished_at,
    emailsScanned: toCount(row.emails_scanned),
    emailsAnalyzed: toCount(row.emails_analyzed),
    prospectsFound: toCount(row.prospects_found),
    aiCostCents: toCount(row.ai_cost_cents),
    errorMessage: row.error_message,
    triggeredBy: row.triggered_by,
  }));
}

/**
 * Colonnes d'un prospect extrait. Partagées par la lecture d'une exécution
 * précise et par la liste cumulative, pour que les deux ne puissent pas
 * diverger.
 */
const RESULT_COLUMNS =
  "id, run_id, source_message_id, source_subject, source_from, source_date, extracted, confidence, reasoning, created_at, pushed_to_crm_at, crm_contact_id, crm_action";

/**
 * Forme d'une ligne de `run_results` telle qu'elle revient de PostgREST. Décrite
 * structurellement : la requête groupée y ajoute la jointure `runs`, ce qui
 * reste compatible.
 */
interface RunResultRow {
  id: string;
  run_id: string;
  source_message_id: string | null;
  source_subject: string | null;
  source_from: string | null;
  source_date: string | null;
  extracted: Json;
  confidence: number | null;
  reasoning: string | null;
  created_at: string;
  pushed_to_crm_at: string | null;
  crm_contact_id: string | null;
  crm_action: string | null;
}

function toRunResult(row: RunResultRow): RunResult {
  return {
    id: row.id,
    runId: row.run_id,
    sourceMessageId: row.source_message_id,
    sourceSubject: row.source_subject,
    sourceFrom: row.source_from,
    sourceDate: row.source_date,
    extracted: toExtracted(row.extracted),
    confidence: toNumber(row.confidence),
    reasoning: row.reasoning,
    createdAt: row.created_at,
    pushedToCrmAt: row.pushed_to_crm_at,
    crmContactId: row.crm_contact_id,
    crmAction: toCrmAction(row.crm_action),
  };
}

/**
 * Prospects extraits par une exécution, les mieux notés d'abord.
 * Le filtre sur `organization_id` double la RLS : un `runId` appartenant à une
 * autre organisation ne renvoie rien, sans jamais dépendre d'une seule barrière.
 */
export async function getRunResults(scope: Scope, runId: string): Promise<RunResult[]> {
  const { data, error } = await supabase
    .from("run_results")
    .select(RESULT_COLUMNS)
    .eq("organization_id", scope.organizationId)
    .eq("run_id", runId)
    .order("confidence", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);

  return (data ?? []).map(toRunResult);
}

/** Les prospects d'une même analyse, avec la date de celle-ci. */
export interface ProspectRunGroup {
  runId: string;
  /** Début de l'analyse, pas date d'écriture du résultat. */
  startedAt: string;
  results: RunResult[];
}

/**
 * Tous les prospects de l'organisation, groupés par analyse, la plus récente
 * d'abord.
 *
 * Complète `getRunResults()` plutôt qu'elle ne la remplace : l'écran des
 * analyses montrait les seuls résultats de la dernière exécution, si bien
 * qu'un prospect trouvé la semaine passée devenait invisible dès l'analyse
 * suivante — laquelle ne retrouve rien, `seen_messages` ayant déjà écarté ses
 * messages.
 *
 * La date vient de `runs` par jointure, et non de la liste des exécutions déjà
 * chargée par l'écran : celle-ci est plafonnée à {@link RUNS_LIMIT}, et un
 * prospect plus ancien s'y retrouverait sans date. Le `!inner` n'écarte rien
 * au passage — `runs` et `run_results` partagent la même politique RLS.
 */
export async function listRecentProspects(scope: Scope): Promise<ProspectRunGroup[]> {
  const { data, error } = await supabase
    .from("run_results")
    .select(`${RESULT_COLUMNS}, runs!inner(started_at)`)
    .eq("organization_id", scope.organizationId)
    .order("created_at", { ascending: false })
    .limit(PROSPECTS_LIMIT);

  if (error) throw new Error(error.message);

  // L'ordre d'insertion de la Map conserve le tri de la requête : les groupes
  // sortent du plus récent au plus ancien sans second tri.
  const groups = new Map<string, ProspectRunGroup>();

  for (const row of data ?? []) {
    const existing = groups.get(row.run_id);
    if (existing) {
      existing.results.push(toRunResult(row));
      continue;
    }
    groups.set(row.run_id, {
      runId: row.run_id,
      startedAt: toStartedAt(row.runs),
      results: [toRunResult(row)],
    });
  }

  return [...groups.values()];
}

/** Prospects pas encore envoyés au CRM, et leur nombre total. */
export interface PendingProspects {
  results: RunResult[];
  /** Total réel en base : peut dépasser `results.length`, plafonné à {@link PENDING_LIMIT}. */
  total: number;
}

/**
 * Prospects en attente de décision, les plus récents d'abord, toutes analyses
 * confondues. Le filtre sur `pushed_to_crm_at` est fait en base et non sur la
 * liste cumulative de {@link listRecentProspects} : celle-ci est plafonnée
 * avant filtrage, et masquerait un prospect en attente derrière cinquante
 * prospects déjà envoyés.
 */
export async function listPendingProspects(scope: Scope): Promise<PendingProspects> {
  const { data, error, count } = await supabase
    .from("run_results")
    .select(RESULT_COLUMNS, { count: "exact" })
    .eq("organization_id", scope.organizationId)
    .is("pushed_to_crm_at", null)
    .order("created_at", { ascending: false })
    .limit(PENDING_LIMIT);

  if (error) throw new Error(error.message);

  const results = (data ?? []).map(toRunResult);
  return { results, total: count ?? results.length };
}

/**
 * Envoie un prospect extrait dans HubSpot.
 *
 * L'écriture appartient à l'Edge Function `push-to-hubspot` : elle seule détient
 * la clé HubSpot, vérifie que l'appelant est owner ou admin et que le résultat
 * appartient bien à l'organisation, puis marque la ligne comme envoyée.
 *
 * Les corps 403 (droits), 404 (résultat étranger à l'organisation), 409 (déjà
 * envoyé), 422 (aucune adresse e-mail extraite) et 502 (refus de HubSpot)
 * portent un message rédigé pour l'utilisateur — celui du 422 explique pourquoi
 * ce prospect précis ne peut pas partir. Ils sont remontés tels quels ;
 * supabase-js ne les expose pas dans `error.message`.
 */
export async function pushResultToCrm(scope: Scope, resultId: string): Promise<CrmPushOutcome> {
  const { data, error } = await supabase.functions.invoke("push-to-hubspot", {
    method: "POST",
    body: { organizationId: scope.organizationId, resultId },
  });

  if (error) {
    if (error instanceof FunctionsHttpError) {
      const body: unknown = await error.context.json().catch(() => null);
      throw new Error(errorFromBody(body) ?? CRM_FALLBACK_ERROR);
    }
    throw new Error(error.message);
  }

  const payload = data as {
    contactId?: unknown;
    action?: unknown;
    warning?: unknown;
    error?: unknown;
  } | null;

  const inlineError = errorFromBody(payload);
  if (inlineError) throw new Error(inlineError);

  const contactId = toOptionalString(payload?.contactId);
  if (contactId === null) {
    throw new Error("Réponse inattendue du serveur : identifiant de contact manquant.");
  }

  return {
    contactId,
    action: toCrmAction(payload?.action),
    warning: toOptionalString(payload?.warning),
  };
}
