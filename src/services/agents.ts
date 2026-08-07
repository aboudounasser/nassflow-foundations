import { agentsDetailMock, missionsOfAgent } from "@/lib/agents/mocks";
import type { AgentDetail } from "@/lib/agents/types";
import type { MissionDetail } from "@/lib/missions/types";
import type { Scope } from "@/lib/tenancy/types";
import { delay } from "@/services/latency";

export interface AgentListItem {
  agent: AgentDetail;
  missionCount: number;
}

export async function getAgents(_scope: Scope): Promise<AgentListItem[]> {
  return delay(
    agentsDetailMock.map((agent) => ({
      agent,
      missionCount: missionsOfAgent(agent.id).length,
    })),
  );
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
