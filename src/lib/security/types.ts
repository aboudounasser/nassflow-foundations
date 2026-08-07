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

export interface SecurityOverview {
  score: number;
  criticalLast7Days: number;
  activeMembers: number;
  suspendedMembers: number;
  integrationsInError: number;
  totalEvents: number;
}

export interface AccessMatrixRow {
  memberId: string;
  memberName: string;
  role: MemberRole;
  department: string;
  status: MemberStatus;
}

export interface AgentPermissionsRow {
  agentId: string;
  agentName: string;
  totalPermissions: number;
  writeOrHigher: number;
}

export interface IntegrationPermissionsRow {
  integrationId: string;
  integrationName: string;
  grantedCount: number;
  totalCount: number;
}
