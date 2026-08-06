/**
 * Agrégations du module Security Center.
 * Toutes les valeurs sont dérivées des mocks déjà existants (agents, missions,
 * workflows, organisation, intégrations) : aucun jeu de données parallèle.
 */
import { agentsDetailMock } from "@/lib/agents/mocks";
import { integrationsMock } from "@/lib/integrations/mocks";
import { referenceDate } from "@/lib/insights/aggregations";
import { missionsDetailMock } from "@/lib/missions/mocks";
import { orgMembersMock } from "@/lib/organization/mocks";
import type { MemberRole, MemberStatus } from "@/lib/organization/types";
import { workflowsMock } from "@/lib/workflows/mocks";

import type { SecurityEvent, SecurityEventSeverity } from "./types";

const DAY_MS = 86_400_000;

export function accessMatrix(): {
  memberId: string;
  memberName: string;
  role: MemberRole;
  department: string;
  status: MemberStatus;
}[] {
  return orgMembersMock.map((m) => ({
    memberId: m.id,
    memberName: m.name,
    role: m.role,
    department: m.department,
    status: m.status,
  }));
}

export function agentPermissionsSummary(): {
  agentId: string;
  agentName: string;
  totalPermissions: number;
  writeOrHigher: number;
}[] {
  return agentsDetailMock
    .map((agent) => ({
      agentId: agent.id,
      agentName: agent.name,
      totalPermissions: agent.permissions.length,
      writeOrHigher: agent.permissions.filter((p) => p.write || p.execute || p.approve).length,
    }))
    .sort((a, b) => b.writeOrHigher - a.writeOrHigher);
}

export function integrationPermissionsSummary(): {
  integrationId: string;
  integrationName: string;
  grantedCount: number;
  totalCount: number;
}[] {
  return integrationsMock
    .filter((i) => i.permissions.length > 0)
    .map((i) => ({
      integrationId: i.id,
      integrationName: i.name,
      grantedCount: i.permissions.filter((p) => p.granted).length,
      totalCount: i.permissions.length,
    }))
    .sort((a, b) => b.grantedCount - a.grantedCount);
}

/** Journal d'audit : normalisation d'événements déjà présents dans les autres modules. */
export function securityEventFeed(): SecurityEvent[] {
  const events: SecurityEvent[] = [];

  for (const agent of agentsDetailMock) {
    for (const log of agent.logs) {
      if (log.type === "error") {
        events.push({
          id: `sec-log-${log.id}`,
          timestamp: log.timestamp,
          source: "agent_log",
          severity: "critical",
          title: `Erreur agent — ${log.action}`,
          description: log.tool
            ? `Outil « ${log.tool} » — exécution en échec.`
            : "Exécution en échec côté agent.",
          actor: agent.name,
          linkTo: log.missionId
            ? { agentId: agent.id, missionId: log.missionId }
            : { agentId: agent.id },
        });
      } else if (log.type === "validation") {
        events.push({
          id: `sec-log-${log.id}`,
          timestamp: log.timestamp,
          source: "agent_log",
          severity: log.result === "success" ? "info" : "warning",
          title: `Validation — ${log.action}`,
          description:
            log.result === "success"
              ? "Validation accordée par le contrôle d'accès de l'agent."
              : "Validation en attente ou refusée : action sensible à revoir.",
          actor: agent.name,
          linkTo: log.missionId
            ? { agentId: agent.id, missionId: log.missionId }
            : { agentId: agent.id },
        });
      }
    }
  }

  for (const mission of missionsDetailMock) {
    for (const [index, entry] of mission.history.entries()) {
      if (entry.type !== "validation" && entry.type !== "error") continue;
      const severity: SecurityEventSeverity =
        entry.type === "error" ? "critical" : entry.result === "failure" ? "warning" : "info";
      events.push({
        id: `sec-mission-${mission.id}-${index}`,
        timestamp: entry.timestamp,
        source: "mission_history",
        severity,
        title: entry.type === "error" ? `Incident mission — ${mission.title}` : `Validation mission — ${mission.title}`,
        description: entry.event,
        actor: entry.actor,
        linkTo: entry.agentId
          ? { missionId: mission.id, agentId: entry.agentId }
          : { missionId: mission.id },
      });
    }
  }

  for (const workflow of workflowsMock) {
    for (const run of workflow.runs) {
      if (run.status !== "failure") continue;
      events.push({
        id: `sec-run-${run.id}`,
        timestamp: run.startedAt,
        source: "workflow_run",
        severity: "critical",
        title: `Exécution en échec — ${workflow.name}`,
        description: run.errorMessage ?? "Exécution interrompue sans message d'erreur.",
        actor: run.triggeredBy,
        linkTo: { workflowId: workflow.id },
      });
    }
  }

  for (const member of orgMembersMock) {
    if (member.status !== "suspended") continue;
    events.push({
      id: `sec-member-${member.id}`,
      timestamp: member.joinedAt,
      source: "org_member",
      severity: "warning",
      title: "Compte suspendu",
      description: `${member.name} (${member.jobTitle}, ${member.department}) n'a plus accès à la plateforme.`,
      actor: member.name,
      linkTo: { memberId: member.id },
    });
  }

  return events.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );
}

/** Événements critiques sur les 7 derniers jours (référence = dernier événement des mocks). */
export function criticalEventsLast7Days(events = securityEventFeed()): SecurityEvent[] {
  const since = referenceDate().getTime() - 7 * DAY_MS;
  return events.filter(
    (e) => e.severity === "critical" && new Date(e.timestamp).getTime() >= since,
  );
}

/**
 * Score de posture 0-100, dérivé des mocks :
 *   base 100
 *   − 6 par intégration en statut "error"
 *   − 4 par membre "suspended"
 *   − 3 par log agent de type "error" sur les 7 derniers jours
 * Le résultat est borné entre 0 et 100.
 */
export function securityPostureScore(): number {
  const since = referenceDate().getTime() - 7 * DAY_MS;
  const integrationErrors = integrationsMock.filter((i) => i.status === "error").length;
  const suspended = orgMembersMock.filter((m) => m.status === "suspended").length;
  const recentAgentErrors = agentsDetailMock.reduce(
    (acc, agent) =>
      acc +
      agent.logs.filter(
        (l) => l.type === "error" && new Date(l.timestamp).getTime() >= since,
      ).length,
    0,
  );
  const score = 100 - integrationErrors * 6 - suspended * 4 - recentAgentErrors * 3;
  return Math.max(0, Math.min(100, score));
}

export function securityOverview() {
  const events = securityEventFeed();
  return {
    score: securityPostureScore(),
    criticalLast7Days: criticalEventsLast7Days(events).length,
    activeMembers: orgMembersMock.filter((m) => m.status === "active").length,
    suspendedMembers: orgMembersMock.filter((m) => m.status === "suspended").length,
    integrationsInError: integrationsMock.filter((i) => i.status === "error").length,
    totalEvents: events.length,
  };
}