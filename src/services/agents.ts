import { agentsDetailMock, missionsOfAgent } from "@/lib/agents/mocks";
import type { AgentDetail } from "@/lib/agents/types";
import { missionsDetailMock } from "@/lib/missions/mocks";
import type { MissionDetail } from "@/lib/missions/types";
import type { Scope } from "@/lib/tenancy/types";
import { delay } from "@/services/latency";

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

export async function getAgents(_scope: Scope): Promise<AgentsListData> {
  const items = agentsDetailMock.map((agent) => ({
    agent,
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

export async function getAgent(_scope: Scope, agentId: string): Promise<AgentDetailData | null> {
  const agent = agentsDetailMock.find((a) => a.id === agentId) ?? null;
  if (!agent) return delay(null);
  return delay({
    agent,
    missions: missionsOfAgent(agentId),
    collaborators: agent.collaboratesWith
      .map((id) => agentsDetailMock.find((a) => a.id === id))
      .filter((a): a is AgentDetail => Boolean(a)),
  });
}
