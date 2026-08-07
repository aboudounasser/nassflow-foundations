/** Service Layer du module Missions. */
import { missionAgents, missionBlueprints, missionsDetailMock } from "@/lib/missions/mocks";
import type { MissionAgent, MissionBlueprint, MissionDetail } from "@/lib/missions/types";
import type { Scope } from "@/lib/tenancy/types";
import { delay } from "@/services/latency";

export interface MissionsListData {
  missions: MissionDetail[];
  agents: MissionAgent[];
  /** Modèles proposés par le Mission Builder. */
  blueprints: MissionBlueprint[];
}

export async function getMissions(_scope: Scope): Promise<MissionsListData> {
  return delay({
    missions: missionsDetailMock,
    agents: missionAgents,
    blueprints: missionBlueprints,
  });
}

/** Agrégat de la vue détail : inclut toutes les missions (dépendances croisées). */
export interface MissionDetailData {
  mission: MissionDetail;
  allMissions: MissionDetail[];
  agents: MissionAgent[];
}

export async function getMission(
  _scope: Scope,
  missionId: string,
): Promise<MissionDetailData | null> {
  const mission = missionsDetailMock.find((m) => m.id === missionId) ?? null;
  if (!mission) return delay(null);
  return delay({ mission, allMissions: missionsDetailMock, agents: missionAgents });
}
