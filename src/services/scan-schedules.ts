/**
 * Service Layer des réglages d'analyse automatique (`scan_schedules`).
 *
 * Lecture et modification directes, en RLS : réservées aux owner et admin, et
 * limitées par la base aux colonnes `enabled`, `frequency` et `run_hour`. Le
 * reste (échéance, traçabilité) est recalculé par trigger : la ligne relue
 * après modification fait foi.
 */
import type { ScanFrequency, ScanSchedule, ScanScheduleSettings } from "@/lib/scan-schedules/types";
import { supabase } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/database.types";
import type { Scope } from "@/lib/tenancy/types";

const SCHEDULE_COLUMNS =
  "integration_id, enabled, frequency, run_hour, timezone, next_run_at, consecutive_failures, last_error, last_error_at, updated_at, updated_by";

type ScheduleRow = Pick<
  Database["public"]["Tables"]["scan_schedules"]["Row"],
  | "integration_id"
  | "enabled"
  | "frequency"
  | "run_hour"
  | "timezone"
  | "next_run_at"
  | "consecutive_failures"
  | "last_error"
  | "last_error_at"
  | "updated_at"
  | "updated_by"
>;

/**
 * `frequency` est contrainte côté base. Une valeur inconnue vaut `weekdays`,
 * la fréquence par défaut : jamais une fréquence plus élevée que prévu.
 */
function toFrequency(value: string): ScanFrequency {
  return value === "daily" || value === "twice_daily" ? value : "weekdays";
}

function toSchedule(row: ScheduleRow): ScanSchedule {
  return {
    integrationId: row.integration_id,
    enabled: row.enabled,
    frequency: toFrequency(row.frequency),
    runHour: row.run_hour,
    timezone: row.timezone,
    nextRunAt: row.next_run_at,
    consecutiveFailures: row.consecutive_failures,
    lastError: row.last_error,
    lastErrorAt: row.last_error_at,
    updatedAt: row.updated_at,
    updatedBy: row.updated_by,
  };
}

/**
 * Réglages d'une boîte. `null` si la ligne est absente — intégration d'une
 * autre organisation, ou rôle sans accès (la RLS renvoie alors zéro ligne
 * plutôt qu'une erreur).
 */
export async function getScanSchedule(
  scope: Scope,
  integrationId: string,
): Promise<ScanSchedule | null> {
  const { data, error } = await supabase
    .from("scan_schedules")
    .select(SCHEDULE_COLUMNS)
    .eq("organization_id", scope.organizationId)
    .eq("integration_id", integrationId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? toSchedule(data) : null;
}

/**
 * Modifie un ou plusieurs réglages et rend la ligne recalculée par la base.
 *
 * Le trigger refuse d'activer une boîte dont la connexion n'est plus active :
 * son message (« Reconnectez Gmail avant d'activer… ») est rédigé pour
 * l'utilisateur et propagé tel quel.
 */
export async function updateScanSchedule(
  scope: Scope,
  integrationId: string,
  patch: Partial<ScanScheduleSettings>,
): Promise<ScanSchedule> {
  const update: Database["public"]["Tables"]["scan_schedules"]["Update"] = {};
  if (patch.enabled !== undefined) update.enabled = patch.enabled;
  if (patch.frequency !== undefined) update.frequency = patch.frequency;
  if (patch.runHour !== undefined) update.run_hour = patch.runHour;

  const { data, error } = await supabase
    .from("scan_schedules")
    .update(update)
    .eq("organization_id", scope.organizationId)
    .eq("integration_id", integrationId)
    .select(SCHEDULE_COLUMNS)
    .maybeSingle();

  if (error) throw new Error(error.message);
  // Zéro ligne : la RLS a filtré la mise à jour (rôle insuffisant).
  if (!data) throw new Error("Vous n'avez pas le droit de modifier ces réglages.");
  return toSchedule(data);
}
