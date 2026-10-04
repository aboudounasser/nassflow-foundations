/**
 * Analyse planifiée : logique du point d'entrée, séparée de `index.ts` pour
 * être testable sans le runtime Edge (dépendances injectées).
 *
 * Appelée par le dispatcher SQL (`private.dispatch_due_gmail_scans`, via
 * pg_net), jamais par le navigateur : `verify_jwt = false`, pas de CORS.
 *
 * Authentification : un jeton à usage unique, tiré par le dispatcher et
 * échangé ici contre la boîte à analyser (`claim_scan_dispatch`). Le corps de
 * la requête ne choisit RIEN d'autre : ni l'organisation, ni l'intégration.
 */
import type { SupabaseClient } from "jsr:@supabase/supabase-js@2.117.2";

import type { ScanOutcome, ScanRequest } from "../_shared/gmail-scan.ts";

/** Au-delà, le dispatcher ignore la boîte (`consecutive_failures < 3`). */
export const MAX_CONSECUTIVE_FAILURES = 3;

/** 32 octets en hexadécimal, tels que les tire le dispatcher. */
const TOKEN_PATTERN = /^[0-9a-f]{64}$/;

export interface ClaimedDispatch {
  dispatchId: string;
  organizationId: string;
  integrationId: string;
}

export interface SchedulerDeps {
  admin: SupabaseClient;
  runScan: (request: ScanRequest) => Promise<ScanOutcome>;
  /** `EdgeRuntime.waitUntil` : l'analyse continue après la réponse 202. */
  waitUntil: (promise: Promise<unknown>) => void;
}

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function handleScheduledRequest(req: Request, deps: SchedulerDeps): Promise<Response> {
  if (req.method !== "POST") return json({ error: "Méthode non autorisée." }, 405);

  let token: unknown;
  try {
    token = (await req.json())?.token;
  } catch {
    return json({ error: "Requête invalide." }, 400);
  }
  // Forme vérifiée AVANT toute requête en base : un appel anonyme mal formé
  // ne coûte rien. Le jeton n'est jamais journalisé.
  if (typeof token !== "string" || !TOKEN_PATTERN.test(token)) {
    return json({ error: "Non autorisé." }, 401);
  }

  const { data, error } = await deps.admin.rpc("claim_scan_dispatch", { p_token: token });
  if (error) {
    console.error("échange du jeton refusé par la base", error.message);
    return json({ error: "Erreur serveur." }, 500);
  }
  // Jeton inconnu, expiré ou déjà utilisé : même réponse, rien à apprendre.
  const row = Array.isArray(data) ? data[0] : null;
  if (!row) return json({ error: "Non autorisé." }, 401);

  const dispatch: ClaimedDispatch = {
    dispatchId: row.dispatch_id,
    organizationId: row.dispatch_organization_id,
    integrationId: row.dispatch_integration_id,
  };

  deps.waitUntil(runDispatch(deps, dispatch));
  return json({ accepted: true, dispatchId: dispatch.dispatchId }, 202);
}

/** L'analyse elle-même, en arrière-plan. Ne rejette jamais. */
export async function runDispatch(deps: SchedulerDeps, dispatch: ClaimedDispatch): Promise<void> {
  try {
    const outcome = await deps.runScan({
      organizationId: dispatch.organizationId,
      integrationId: dispatch.integrationId,
      triggeredBy: null,
      triggerSource: "schedule",
    });
    await recordOutcome(deps.admin, dispatch, outcome);
  } catch (e) {
    // Le run éventuel reste 'running' : le nettoyeur le clôt et compte l'échec.
    console.error("analyse planifiée : échec inattendu", { dispatchId: dispatch.dispatchId }, e);
  }
}

/**
 * Reporte l'issue sur scan_schedules (état tenu par le système, seules
 * colonnes que service_role peut modifier) et rattache le run au
 * déclenchement.
 */
export async function recordOutcome(
  admin: SupabaseClient,
  dispatch: ClaimedDispatch,
  outcome: ScanOutcome,
): Promise<void> {
  const { dispatchId, integrationId } = dispatch;
  const runId = outcome.kind === "succeeded"
    ? outcome.summary.runId
    : outcome.kind === "failed"
    ? outcome.runId
    : null;

  if (runId) {
    const { error } = await admin.rpc("attach_scan_dispatch_run", {
      p_dispatch_id: dispatchId,
      p_run_id: runId,
    });
    if (error) console.error("run non rattaché au déclenchement", error.message);
  }

  if (outcome.kind === "succeeded") {
    // Arrêt sur budget compris : l'analyse a fonctionné, ce n'est pas un échec.
    const { error } = await admin
      .from("scan_schedules")
      .update({
        consecutive_failures: 0,
        last_error: null,
        last_error_at: null,
        last_scheduled_run_id: runId,
      })
      .eq("integration_id", integrationId);
    if (error) console.error("état de la boîte non mis à jour", error.message);
    return;
  }

  if (outcome.kind === "rejected" && outcome.status !== 500) {
    // 409 (analyse déjà en cours, ou boîte plus active) et 404 ne disent rien
    // de la santé de l'analyse : pas un échec. L'échéance suivante viendra.
    console.warn("analyse planifiée non lancée", {
      dispatchId,
      status: outcome.status,
      error: outcome.error,
    });
    return;
  }

  // Échec : lecture puis écriture du compteur. Pas de course possible, un seul
  // run 'running' par boîte (index unique) et une seule analyse planifiée par
  // échéance (réservation du dispatcher).
  const { data: current, error: readError } = await admin
    .from("scan_schedules")
    .select("consecutive_failures")
    .eq("integration_id", integrationId)
    .maybeSingle();
  if (readError) {
    console.error("compteur d'échecs illisible", readError.message);
    return;
  }
  const failures = (current?.consecutive_failures ?? 0) + 1;

  const { error: writeError } = await admin
    .from("scan_schedules")
    .update({
      consecutive_failures: failures,
      // Message déjà rédigé pour l'utilisateur (assaini par le cœur).
      last_error: outcome.error,
      last_error_at: new Date().toISOString(),
      ...(runId ? { last_scheduled_run_id: runId } : {}),
    })
    .eq("integration_id", integrationId);
  if (writeError) console.error("compteur d'échecs non mis à jour", writeError.message);

  if (failures >= MAX_CONSECUTIVE_FAILURES) {
    console.warn("analyse automatique suspendue après échecs consécutifs", {
      integrationId,
      failures,
    });
  }
}
