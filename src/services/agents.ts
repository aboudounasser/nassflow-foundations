import { agentsDetailMock, missionsOfAgent } from "@/lib/agents/mocks";
import type { AgentDetail, AgentKpi } from "@/lib/agents/types";
import { missionsDetailMock } from "@/lib/missions/mocks";
import type { MissionDetail } from "@/lib/missions/types";
import type { Pulse, PulseMetrics } from "@/lib/pulse/types";
import type { Scope } from "@/lib/tenancy/types";
import { delay } from "@/services/latency";
import * as pulseService from "@/services/pulse";

export interface AgentListItem {
  agent: AgentDetail;
  missionCount: number;
}

/** Liste + agrégats du bandeau : la vue ne connaît plus le module Missions. */
export interface AgentsListData {
  items: AgentListItem[];
  runningMissions: number;
}

const RUNNING_STATUSES = ["running", "waiting", "blocked"];

/** Seul agent branché sur des données réelles (table `pulses`) — les 6 autres restent mockés. */
const CEO_AGENT_ID = "a-ceo";

function ceoKpisFromPulse(metrics: PulseMetrics): AgentKpi[] {
  return [
    { label: "Prospects détectés (7j)", value: String(metrics.prospects7d) },
    { label: "Analyses Gmail (7j)", value: String(metrics.runs7d) },
    { label: "Envoyés au CRM (7j)", value: String(metrics.pushed7d) },
  ];
}

/**
 * Fusionne le pulse du jour dans la fiche CEO Agent. `confidenceScore` et
 * `uptime` ne mesurent rien de réel pour cet agent : ils sont retirés plutôt
 * que remplacés par une heuristique inventée. Sans pulse aujourd'hui, les
 * KPIs repassent à vide plutôt que de garder les anciennes valeurs mock.
 */
function mergeCeoPulse(agent: AgentDetail, pulse: Pulse | null): AgentDetail {
  return {
    ...agent,
    confidenceScore: undefined,
    uptime: undefined,
    kpis: pulse ? ceoKpisFromPulse(pulse.metrics) : [],
    lastActivity: pulse?.generatedAt ?? agent.lastActivity,
    pulse: pulse ?? undefined,
  };
}

export async function getAgents(scope: Scope): Promise<AgentsListData> {
  const pulse = await pulseService.getTodayPulse(scope);
  const items = agentsDetailMock.map((agent) => ({
    agent: agent.id === CEO_AGENT_ID ? mergeCeoPulse(agent, pulse) : agent,
    missionCount: missionsOfAgent(agent.id).length,
  }));
  const agentIds = new Set(agentsDetailMock.map((a) => a.id));
  const runningMissions = missionsDetailMock.filter(
    (m) => RUNNING_STATUSES.includes(m.status) && m.agents.some((a) => agentIds.has(a.id)),
  ).length;
  return delay({ items, runningMissions });
}

/** Agrégat de la vue détail : un seul aller-retour par identifiant (option B). */
export interface AgentDetailData {
  agent: AgentDetail;
  missions: MissionDetail[];
  /** Agents référencés par collaboratesWith, résolus côté service. */
  collaborators: AgentDetail[];
}

export async function getAgent(scope: Scope, agentId: string): Promise<AgentDetailData | null> {
  const agent = agentsDetailMock.find((a) => a.id === agentId) ?? null;
  if (!agent) return delay(null);

  const resolvedAgent =
    agent.id === CEO_AGENT_ID
      ? mergeCeoPulse(agent, await pulseService.getTodayPulse(scope))
      : agent;

  return delay({
    agent: resolvedAgent,
    missions: missionsOfAgent(agentId),
    collaborators: agent.collaboratesWith
      .map((id) => agentsDetailMock.find((a) => a.id === id))
      .filter((a): a is AgentDetail => Boolean(a)),
  });
}
