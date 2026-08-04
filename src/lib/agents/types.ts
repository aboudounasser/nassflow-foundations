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
  | "Direction"
  | "Commercial"
  | "Marketing"
  | "Finance"
  | "RH"
  | "Support"
  | "Opérations";

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
}

export type AgentSortKey = "name" | "confidence" | "activity";
export type AgentView = "grid" | "list";
