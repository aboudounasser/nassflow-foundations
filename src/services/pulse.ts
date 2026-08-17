/**
 * Service Layer du Enterprise Pulse (table `pulses`).
 *
 * Deux moitiés bien séparées, comme pour les analyses Gmail :
 * - la génération, confiée à l'Edge Function `generate-pulse` (owner et admin
 *   seulement — la rédaction a un coût) ;
 * - la lecture du pulse du jour, en RLS ouverte à tous les membres.
 *
 * Aucune écriture n'est possible depuis le navigateur.
 */
import { FunctionsHttpError } from "@supabase/supabase-js";

import type { GeneratePulseResult, Pulse, PulseMetrics } from "@/lib/pulse/types";
import { supabase } from "@/lib/supabase/client";
import type { Json } from "@/lib/supabase/database.types";
import type { Scope } from "@/lib/tenancy/types";

const GENERATE_FALLBACK_ERROR = "La génération du pulse n'a pas abouti. Réessayez plus tard.";

function errorFromBody(body: unknown): string | null {
  if (typeof body !== "object" || body === null) return null;
  const message = (body as { error?: unknown }).error;
  return typeof message === "string" && message.length > 0 ? message : null;
}

function toOptionalString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

/** Les compteurs sont nuls tant que l'Edge Function n'a pas conclu. */
function toCount(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function toNumberOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function toBoolean(value: unknown): boolean {
  return value === true;
}

/**
 * Rétrécit le `jsonb` de la base vers la forme applicative. Le contenu vient
 * du modèle : il est traité comme une donnée extérieure, chaque champ étant
 * validé séparément plutôt que le bloc accepté en confiance.
 */
function toMetrics(value: Json): PulseMetrics {
  const raw = (
    typeof value === "object" && value !== null && !Array.isArray(value) ? value : {}
  ) as Record<string, unknown>;
  return {
    runs7d: toCount(raw["runs_7d"]),
    runsPrev7d: toCount(raw["runs_prev_7d"]),
    runsTotal: toCount(raw["runs_total"]),
    runsFailed7d: toCount(raw["runs_failed_7d"]),
    prospects7d: toCount(raw["prospects_7d"]),
    prospectsPrev7d: toCount(raw["prospects_prev_7d"]),
    pushed7d: toCount(raw["pushed_7d"]),
    pendingReviewTotal: toCount(raw["pending_review_total"]),
    pendingReview7d: toCount(raw["pending_review_7d"]),
    daysActive: toCount(raw["days_active"]),
    prospectsVariationPct: toNumberOrNull(raw["prospects_variation_pct"]),
    integrationsActive: toCount(raw["integrations_active"]),
    integrationsError: toCount(raw["integrations_error"]),
    canDescribe: toBoolean(raw["can_describe"]),
    canCompare: toBoolean(raw["can_compare"]),
    hasEnoughData: toBoolean(raw["has_enough_data"]),
  };
}

/** Date du jour au format `date` Postgres, dans le fuseau où vit l'entreprise. */
function todayPulseDate(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris" }).format(new Date());
}

/**
 * Le pulse du jour, ou `null` s'il n'a pas encore été généré.
 * La contrainte unique sur (organization_id, pulse_date) garantit qu'il y en
 * a au plus un — `maybeSingle()` plutôt que `single()`, l'absence n'étant pas
 * une erreur.
 */
export async function getTodayPulse(scope: Scope): Promise<Pulse | null> {
  const { data, error } = await supabase
    .from("pulses")
    .select(
      "id, pulse_date, metrics, has_enough_data, summary, attention, recommendation, ai_cost_millicents, generated_at, generated_by",
    )
    .eq("organization_id", scope.organizationId)
    .eq("pulse_date", todayPulseDate())
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;

  return {
    id: data.id,
    pulseDate: data.pulse_date,
    metrics: toMetrics(data.metrics),
    hasEnoughData: toBoolean(data.has_enough_data),
    summary: data.summary,
    attention: data.attention,
    recommendation: data.recommendation,
    aiCostMillicents: toCount(data.ai_cost_millicents),
    generatedAt: data.generated_at,
    generatedBy: data.generated_by,
  };
}

/**
 * Déclenche la rédaction du pulse du jour.
 *
 * Réservé aux owner et admin par l'Edge Function — la génération a un coût.
 * Les corps 403 (droits) et 502 (échec de rédaction) portent le message
 * métier ; supabase-js ne l'expose pas dans `error.message` — même
 * extraction que `startGmailScan()`.
 */
export async function generatePulse(scope: Scope): Promise<GeneratePulseResult> {
  const { data, error } = await supabase.functions.invoke("generate-pulse", {
    method: "POST",
    body: { organizationId: scope.organizationId },
  });

  if (error) {
    if (error instanceof FunctionsHttpError) {
      const body: unknown = await error.context.json().catch(() => null);
      throw new Error(errorFromBody(body) ?? GENERATE_FALLBACK_ERROR);
    }
    throw new Error(error.message);
  }

  const payload = data as {
    id?: unknown;
    pulse_date?: unknown;
    summary?: unknown;
    attention?: unknown;
    recommendation?: unknown;
    has_enough_data?: unknown;
    error?: unknown;
  } | null;

  const inlineError = errorFromBody(payload);
  if (inlineError) throw new Error(inlineError);

  const id = payload?.id;
  const pulseDate = payload?.pulse_date;
  const summary = payload?.summary;
  if (typeof id !== "string" || id.length === 0) {
    throw new Error("Réponse inattendue du serveur : identifiant du pulse manquant.");
  }
  if (typeof pulseDate !== "string" || pulseDate.length === 0) {
    throw new Error("Réponse inattendue du serveur : date du pulse manquante.");
  }
  if (typeof summary !== "string" || summary.length === 0) {
    throw new Error("Réponse inattendue du serveur : résumé manquant.");
  }

  return {
    id,
    pulseDate,
    summary,
    attention: toOptionalString(payload?.attention),
    recommendation: toOptionalString(payload?.recommendation),
    hasEnoughData: toBoolean(payload?.has_enough_data),
  };
}
