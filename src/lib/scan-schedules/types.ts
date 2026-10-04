/**
 * Réglages d'analyse automatique d'une boîte Gmail (table `scan_schedules`).
 *
 * Une ligne par intégration Gmail, créée par la base à la connexion de la
 * boîte. Le navigateur ne modifie que les trois réglages de
 * `ScanScheduleSettings` ; tout le reste est tenu par la plateforme.
 */

/**
 * - `weekdays` : du lundi au vendredi, une fois ;
 * - `daily` : tous les jours, une fois ;
 * - `twice_daily` : du lundi au vendredi, à l'heure choisie et six heures après.
 */
export type ScanFrequency = "weekdays" | "daily" | "twice_daily";

export interface ScanSchedule {
  integrationId: string;
  enabled: boolean;
  frequency: ScanFrequency;
  /** Heure locale de la première analyse de la journée, de 6 à 16. */
  runHour: number;
  /** Fuseau IANA dans lequel `runHour` s'entend (`Europe/Paris`). */
  timezone: string;
  /** Calculée par la base ; `null` quand l'analyse automatique est en pause. */
  nextRunAt: string | null;
  consecutiveFailures: number;
  lastError: string | null;
  lastErrorAt: string | null;
  /** Dernière modification des réglages (pas de l'état tenu par le système). */
  updatedAt: string;
  updatedBy: string | null;
}

/** Les seuls champs que la base laisse modifier à un owner ou un admin. */
export interface ScanScheduleSettings {
  enabled: boolean;
  frequency: ScanFrequency;
  runHour: number;
}
