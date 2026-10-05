import type { ConnectionStatus } from "@/lib/integrations-oauth/types";
import { pluralize } from "@/lib/scans/meta";

import type { ScanFrequency, ScanSchedule, ScheduledRunSummary } from "./types";

/** Écart entre la première et la seconde analyse de `twice_daily` (migration 20261004140000). */
export const SECOND_RUN_OFFSET_HOURS = 6;

/** Bornes de `run_hour`, contrainte `scan_schedules_run_hour_check`. */
export const RUN_HOURS: number[] = Array.from({ length: 11 }, (_, i) => i + 6);

/**
 * Au-delà, le dispatcher (étape 6) cesse de lancer l'analyse jusqu'à une
 * réactivation, qui remet le compteur à zéro.
 */
export const MAX_CONSECUTIVE_FAILURES = 3;

/**
 * Le dispatcher passe toutes les 15 minutes : une échéance dépassée de plus
 * d'une demi-heure signale une planification en panne.
 */
const OVERDUE_GRACE_MS = 30 * 60 * 1000;

export const SCAN_FREQUENCY: Record<ScanFrequency, { label: string }> = {
  weekdays: { label: "Jours ouvrés" },
  daily: { label: "Tous les jours" },
  twice_daily: { label: "Jours ouvrés, deux fois par jour" },
};

export const SCAN_FREQUENCIES: ScanFrequency[] = ["weekdays", "daily", "twice_daily"];

export function formatRunHour(hour: number): string {
  return `${hour} h`;
}

/** « Du lundi au vendredi à 7 h », « Du lundi au vendredi à 7 h et 13 h »… */
export function describeSchedule(frequency: ScanFrequency, runHour: number): string {
  const first = formatRunHour(runHour);
  switch (frequency) {
    case "weekdays":
      return `Du lundi au vendredi à ${first}`;
    case "daily":
      return `Tous les jours à ${first}`;
    case "twice_daily":
      return `Du lundi au vendredi à ${first} et ${formatRunHour(runHour + SECOND_RUN_OFFSET_HOURS)}`;
  }
}

/** Échéance lue dans le fuseau de la boîte, celui où `run_hour` s'entend. */
export function formatNextRun(iso: string | null, timeZone: string): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    timeZone,
  }).format(date);
}

/** « heure de Paris » pour le fuseau par défaut, le nom IANA sinon. */
export function describeTimezone(timeZone: string): string {
  return timeZone === "Europe/Paris" ? "heure de Paris" : `fuseau ${timeZone}`;
}

export interface ScheduleAlert {
  tone: "destructive" | "warning";
  message: string;
}

/**
 * L'état qui empêche l'analyse automatique de tourner, s'il y en a un. Un seul
 * à la fois, du plus bloquant au moins bloquant : une boîte déconnectée rend
 * les deux autres sans objet.
 */
export function scheduleAlert(
  schedule: ScanSchedule,
  connectionStatus: ConnectionStatus,
  now: number = Date.now(),
): ScheduleAlert | null {
  if (connectionStatus !== "active") {
    return {
      tone: "destructive",
      message:
        connectionStatus === "error"
          ? "Accès Gmail expiré, reconnectez le compte. L'analyse automatique reprendra ensuite."
          : "Cette boîte Gmail est déconnectée : l'analyse automatique ne peut pas tourner.",
    };
  }
  if (!schedule.enabled) return null;
  if (schedule.consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
    return {
      tone: "destructive",
      message: schedule.lastError
        ? `Analyse automatique suspendue après ${schedule.consecutiveFailures} échecs consécutifs : ${schedule.lastError}`
        : `Analyse automatique suspendue après ${schedule.consecutiveFailures} échecs consécutifs.`,
    };
  }
  if (schedule.nextRunAt) {
    const due = new Date(schedule.nextRunAt).getTime();
    if (Number.isFinite(due) && now - due > OVERDUE_GRACE_MS) {
      return {
        tone: "warning",
        message:
          "L'analyse automatique est en retard sur son horaire. Si cela persiste, contactez le support.",
      };
    }
  }
  // Échec isolé (dont un déclenchement resté sans réponse, qui ne laisse aucun
  // run) : la boîte n'est pas encore suspendue, la prochaine échéance réessaie.
  if (schedule.consecutiveFailures > 0 && schedule.lastError) {
    return {
      tone: "warning",
      message: `La dernière analyse automatique a échoué : ${schedule.lastError} Nouvel essai à la prochaine échéance.`,
    };
  }
  return null;
}

/** La boîte a atteint le seuil : le dispatcher ne la lance plus jusqu'à une reprise. */
export function isSuspended(schedule: ScanSchedule): boolean {
  return schedule.enabled && schedule.consecutiveFailures >= MAX_CONSECUTIVE_FAILURES;
}

/**
 * Résultat d'une analyse automatique, en une phrase : « 2 e-mails ouverts,
 * aucun prospect », « Échouée : … ». Les compteurs d'un run en échec ne sont
 * pas affichés — seule sa cause compte.
 */
export function describeScheduledRun(run: ScheduledRunSummary): string {
  if (run.status === "running") return "En cours";
  if (run.status === "failed") {
    return run.errorMessage ? `Échouée : ${run.errorMessage}` : "Échouée";
  }
  const opened = pluralize(run.emailsScanned, "e-mail ouvert", "e-mails ouverts");
  const prospects =
    run.prospectsFound > 0
      ? pluralize(run.prospectsFound, "prospect trouvé", "prospects trouvés")
      : "aucun prospect";
  const parts = [`${opened}, ${prospects}`];
  if (run.stopReason === "budget") parts.push("arrêt sur le budget du jour");
  if (run.backlogRemaining) {
    parts.push(pluralize(run.backlogRemaining, "message en attente", "messages en attente"));
  }
  return parts.join(" · ");
}

/** Résumé d'une ligne, pour la ligne Gmail de l'Integrations Hub. */
export function describeScheduleStatus(schedule: ScanSchedule): string {
  if (!schedule.enabled) return "Analyse automatique en pause";
  if (isSuspended(schedule)) return "Analyse automatique suspendue après plusieurs échecs";
  return schedule.nextRunAt
    ? `Analyse automatique : prochaine le ${formatNextRun(schedule.nextRunAt, schedule.timezone)}`
    : "Analyse automatique active";
}
