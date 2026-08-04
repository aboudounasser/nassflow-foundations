import type { Mission, Priority } from "@/lib/dashboard/types";

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
}

export interface MissionStep {
  id: string;
  title: string;
  status: MissionStepStatus;
  agentId: string;
}

export interface MissionHistoryEntry {
  timestamp: string;
  event: string;
  actor: string;
}

/**
 * Modèle universel d'une Mission — étend le type Mission du Dashboard
 * (statut et agents élargis) sans le dupliquer.
 */
export interface MissionDetail extends Omit<Mission, "status" | "agents"> {
  objective: string;
  status: MissionStatus;
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

export type MissionSortKey = "dueDate" | "priority" | "progress";
export type MissionView = "list" | "kanban" | "calendar";