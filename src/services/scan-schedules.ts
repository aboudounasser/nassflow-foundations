/**
 * Service Layer des réglages d'analyse automatique (`scan_schedules`).
 *
 * Lecture et modification directes, en RLS : réservées aux owner et admin, et
 * limitées par la base aux colonnes `enabled`, `frequency` et `run_hour`. Le
 * reste (échéance, traçabilité) est recalculé par trigger : la ligne relue
 * après modification fait foi.
 */
import type {
  ScanFrequency,
  ScanSchedule,
  ScanScheduleSettings,
  ScheduledRunSummary,
} from "@/lib/scan-schedules/types";
import { supabase } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/database.types";
import type { Scope } from "@/lib/tenancy/types";

import { toCount, toMeasured, toRunStatus, toRunStopReason } from "./scans";

/**
 * La dernière analyse automatique est jointe par sa clé étrangère : la RLS de
 * `runs` (owner et admin) s'applique à la jointure comme à une lecture directe.
 */
const SCHEDULE_COLUMNS =
  "integration_id, enabled, frequency, run_hour, timezone, next_run_at, consecutive_failures, last_error, last_error_at, updated_at, updated_by, last_scheduled_run:runs!scan_schedules_last_scheduled_run_id_fkey(id, status, started_at, emails_scanned, prospects_found, stop_reason, backlog_remaining, error_message)";

type RunRow = Database["public"]["Tables"]["runs"]["Row"];

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
> & {
  last_scheduled_run: Pick<
    RunRow,
    | "id"
    | "status"
    | "started_at"
    | "emails_scanned"
    | "prospects_found"
    | "stop_reason"
    | "backlog_remaining"
    | "error_message"
  > | null;
};

/**
 * `frequency` est contrainte côté base. Une valeur inconnue vaut `weekdays`,
 * la fréquence par défaut : jamais une fréquence plus élevée que prévu.
 */
function toFrequency(value: string): ScanFrequency {
  return value === "daily" || value === "twice_daily" ? value : "weekdays";
}

function toRunSummary(row: ScheduleRow["last_scheduled_run"]): ScheduledRunSummary | null {
  if (!row) return null;
  return {
    id: row.id,
    status: toRunStatus(row.status),
    startedAt: row.started_at,
    emailsScanned: toCount(row.emails_scanned),
    prospectsFound: toCount(row.prospects_found),
    stopReason: toRunStopReason(row.stop_reason),
    backlogRemaining: toMeasured(row.backlog_remaining),
    errorMessage: row.error_message,
  };
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
    lastScheduledRun: toRunSummary(row.last_scheduled_run),
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

/**
 * Reprend une boîte suspendue après trois échecs consécutifs.
 *
 * Le trigger de la base ne remet le compteur à zéro qu'au passage de
 * « en pause » à « active » : la reprise est donc une pause suivie d'une
 * activation. Si la seconde étape échoue, la boîte reste en pause — un état
 * sûr, affiché tel quel, que le bouton « Activer » permet de quitter.
 */
export async function resumeScanSchedule(
  scope: Scope,
  integrationId: string,
): Promise<ScanSchedule> {
  await updateScanSchedule(scope, integrationId, { enabled: false });
  return updateScanSchedule(scope, integrationId, { enabled: true });
}
