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
 * Prospects extraits par une exécution, les mieux notés d'abord.
 * Le filtre sur `organization_id` double la RLS : un `runId` appartenant à une
 * autre organisation ne renvoie rien, sans jamais dépendre d'une seule barrière.
 */
export async function getRunResults(scope: Scope, runId: string): Promise<RunResult[]> {
  const { data, error } = await supabase
    .from("run_results")
    .select(
      "id, run_id, source_message_id, source_subject, source_from, source_date, extracted, confidence, reasoning, created_at, pushed_to_crm_at, crm_contact_id, crm_action",
    )
    .eq("organization_id", scope.organizationId)
    .eq("run_id", runId)
    .order("confidence", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => ({
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
  }));
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
