/**
 * Modèle Workflow Engine de NASSFLOW OS.
 * Un Workflow est le processus TECHNIQUE (déclencheurs, conditions, actions, boucles)
 * qui exécute une Mission. Ce n'est PAS une Mission (unité métier du module Missions).
 */

export type WorkflowStatus = "active" | "paused" | "draft" | "error";

export type NodeType = "trigger" | "condition" | "action" | "loop";

export type TriggerKind = "manual" | "scheduled" | "webhook" | "event";

export interface WorkflowVariable {
  name: string;
  type: "string" | "number" | "boolean" | "date";
  defaultValue: string;
}

export interface WorkflowNode {
  id: string;
  type: NodeType;
  label: string;
  description: string;
  /** Pour type « condition » uniquement : deux branches possibles. */
  branches?: { label: "Oui" | "Non"; nodeIds: string[] }[];
  /** Outil utilisé si type « action ». */
  tool?: string | null;
}

export interface WorkflowRun {
  id: string;
  startedAt: string;
  finishedAt: string | null;
  status: "success" | "failure" | "running";
  triggeredBy: string;
  durationMs: number | null;
  errorMessage: string | null;
  nodesExecuted: number;
  nodesTotal: number;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  status: WorkflowStatus;
  triggerKind: TriggerKind;
  scheduleExpression: string | null;
  agentId: string | null;
  relatedMissionIds: string[];
  variables: WorkflowVariable[];
  nodes: WorkflowNode[];
  /** 0-100. */
  successRate: number;
  avgDurationMs: number;
  lastRunAt: string | null;
  runs: WorkflowRun[];
  createdAt: string;
  updatedAt: string;
}

export type WorkflowView = "grid" | "list";
export type WorkflowSortKey = "lastRun" | "successRate" | "name";
export type RunStatusFilter = "all" | WorkflowRun["status"];

export interface WorkflowFilters {
  search: string;
  status: WorkflowStatus | "all";
  trigger: TriggerKind | "all";
  sort: WorkflowSortKey;
}
