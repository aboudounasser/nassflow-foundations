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

/* ---------- Mission Builder (assistant de création) ---------- */

export type TriggerType = "manual" | "scheduled" | "event";

export interface MissionStepDraft {
  id: string;
  title: string;
  agentId: string | null;
  requiresValidation: boolean;
}

export interface MissionBlueprint {
  id: string;
  title: string;
  description: string;
  category: string;
  defaultAgentIds: string[];
  defaultSteps: { title: string; agentId: string }[];
}

export interface MissionDraft {
  title: string;
  objective: string;
  priority: Priority;
  tags: string[];
  dueDate: string | null;
  agentIds: string[];
  steps: MissionStepDraft[];
  triggerType: TriggerType;
  scheduledFor: string | null;
  eventDescription: string;
  validationThreshold: "none" | "critical_only" | "all_steps";
}
