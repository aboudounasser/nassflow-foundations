/** Modèle du module Security Center — politiques mockées en lecture seule. */

export type SecurityEventSeverity = "info" | "warning" | "critical";

export type SecurityEventSource = "agent_log" | "mission_history" | "workflow_run" | "org_member";

export interface SecurityEvent {
  id: string;
  timestamp: string;
  source: SecurityEventSource;
  severity: SecurityEventSeverity;
  title: string;
  description: string;
  actor: string;
  /** Liens de navigation optionnels vers l'origine réelle de l'événement. */
  linkTo?: {
    agentId?: string;
    missionId?: string;
    workflowId?: string;
    memberId?: string;
  };
}

export interface SecurityPolicy {
  id: string;
  label: string;
  value: string;
  description: string;
  /** Détails additionnels (ex. liste d'IP autorisées). */
  items?: string[];
}

export type SecurityTab = "overview" | "access" | "audit" | "policies";