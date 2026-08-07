/** Modèle universel d'un Agent — sous-ensemble prioritaire (itération 1). */

export interface AgentCapability {
  id: string;
  label: string;
  description: string;
}

export type AgentAccessLevel = "read" | "write" | "execute" | "approve";

export interface AgentTool {
  id: string;
  name: string;
  category: string;
  accessLevel: AgentAccessLevel;
  status: "connected" | "disconnected" | "error";
}

export interface AgentPermission {
  resource: string;
  read: boolean;
  write: boolean;
  execute: boolean;
  approve: boolean;
}

export interface AgentKpi {
  label: string;
  value: string;
  trend?: "up" | "down" | "flat";
}

export type AgentStatus = "active" | "paused" | "error" | "maintenance";

export type AgentDomain =
  "Direction" | "Commercial" | "Marketing" | "Finance" | "RH" | "Support" | "Opérations";

export type MemoryLevel = "working" | "long_term" | "shared" | "enterprise_brain";

export interface AgentMemoryEntry {
  id: string;
  level: MemoryLevel;
  title: string;
  content: string;
  source: string;
  /** Id du KnowledgeItem correspondant si source = "Enterprise Brain". */
  sourceId?: string;
  confidenceScore: number | null;
  createdAt: string;
  lastAccessed: string;
}

export type AgentLogType = "tool_call" | "decision" | "handoff" | "validation" | "error";

export interface AgentLogEntry {
  id: string;
  timestamp: string;
  type: AgentLogType;
  action: string;
  tool: string | null;
  missionId: string | null;
  result: "success" | "failure" | "pending";
  durationMs: number | null;
  costEstimate: string | null;
}

export interface AgentConfig {
  language: string;
  timezone: string;
  autonomyLevel: "supervised" | "semi_autonomous" | "autonomous";
  executionFrequency: string;
  notificationsEnabled: boolean;
  validationThreshold: "none" | "critical_only" | "all_actions";
  enabledTools: string[];
  usageLimits: { label: string; value: string }[];
}

export interface AgentDetail {
  /** Même identifiant que dans missionAgents (a-ceo, a-sales, …). */
  id: string;
  name: string;
  avatar: string;
  role: string;
  domain: AgentDomain;
  version: string;
  status: AgentStatus;
  description: string;
  capabilities: AgentCapability[];
  tools: AgentTool[];
  permissions: AgentPermission[];
  kpis: AgentKpi[];
  confidenceScore: number;
  uptime: string;
  lastActivity: string;
  collaboratesWith: string[];
  memory: AgentMemoryEntry[];
  logs: AgentLogEntry[];
  config: AgentConfig;
}

export type AgentSortKey = "name" | "confidence" | "activity";
export type AgentView = "grid" | "list";

export interface AgentFilters {
  search: string;
  domain: AgentDomain | "all";
  status: AgentStatus | "all";
  sort: AgentSortKey;
}
