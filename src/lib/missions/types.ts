import type { RunStatus } from "@/lib/scans/types";

/**
 * Statuts du module Missions. La base n'en admet que six (contrainte
 * `missions_status_check`) ; `ready`, `waiting` et `blocked` n'y apparaissent pas.
 */
export type MissionStatus =
  | "draft"
  | "ready"
  | "running"
  | "waiting"
  | "blocked"
  | "completed"
  | "failed"
  | "cancelled"
  | "archived";

/* ---------- Missions réelles (table `missions` et son run) ---------- */

/** Le run qui a ouvert la mission — colonnes de `runs`, réservées aux owner et admin. */
export interface MissionRun {
  status: RunStatus;
  startedAt: string | null;
  finishedAt: string | null;
  emailsScanned: number;
  emailsAnalyzed: number;
  prospectsFound: number;
  aiCostCents: number;
  errorMessage: string | null;
}

/**
 * Une mission telle que la base la connaît — sans priorité, échéance, étapes
 * ni agents, qui n'ont aucune colonne.
 */
export interface Mission {
  id: string;
  runId: string;
  title: string;
  objective: string;
  status: MissionStatus;
  archivedFromStatus: MissionStatus | null;
  createdAt: string;
  completedAt: string | null;
  /** `null` quand la jointure revient vide. */
  run: MissionRun | null;
}

export type MissionSortKey = "newest" | "oldest";

export interface MissionFilters {
  search: string;
  statuses: MissionStatus[];
  sort: MissionSortKey;
}
