import type { Mission as DashboardMission, Priority } from "@/lib/dashboard/types";
import type { RunStatus } from "@/lib/scans/types";

/** Statuts complets du module Missions (le Dashboard n'en expose qu'un sous-ensemble). */
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

export type MissionStepStatus = "pending" | "running" | "done" | "failed";

export interface MissionAgent {
  id: string;
  name: string;
  avatar: string;
  role: string;
  tools?: string[];
}

export interface MissionStep {
  id: string;
  title: string;
  status: MissionStepStatus;
  agentId: string;
  /**
   * Ids des steps devant être terminés avant celui-ci.
   * Absent = exécution séquentielle après le step précédent.
   * Plusieurs steps partageant le même `dependsOn` = branche parallèle.
   */
  dependsOn?: string[];
}

export type MissionEventType =
  "step" | "decision" | "tool_call" | "handoff" | "validation" | "error";

export interface MissionHistoryEntry {
  timestamp: string;
  event: string;
  actor: string;
  /** Champs optionnels — enrichissent la Timeline plein écran sans casser le mini-historique. */
  type?: MissionEventType;
  tool?: string;
  agentId?: string;
  result?: "success" | "failure" | "pending";
}

/**
 * Modèle universel d'une Mission — étend le type Mission du Dashboard
 * (statut et agents élargis) sans le dupliquer.
 */
export interface MissionDetail extends Omit<DashboardMission, "status" | "agents"> {
  objective: string;
  status: MissionStatus;
  /**
   * Statut avant archivage — porté par la mission pour permettre une
   * restauration en un seul aller-retour. Optionnel : les fixtures d'autres
   * modules (`insights`, `workflows`, `crm`, `agents`, `security`, `billing`)
   * construisent encore des `MissionDetail` sans ce champ.
   */
  archivedFromStatus?: MissionStatus | null | undefined;
  priority: Priority;
  agents: MissionAgent[];
  steps: MissionStep[];
  dependencies: string[];
  estimatedDuration: string;
  actualDuration: string | null;
  confidenceScore: number;
  cost: { aiCalls: number; estimatedCost: string };
  createdAt: string;
  updatedAt: string;
  history: MissionHistoryEntry[];
}

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
 * ni agents, qui n'ont aucune colonne. `MissionDetail` reste pour les fixtures
 * des modules masqués.
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
