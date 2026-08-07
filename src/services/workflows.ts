import type { AgentDetail } from "@/lib/agents/types";
import type { MissionDetail } from "@/lib/missions/types";
import type { Scope } from "@/lib/tenancy/types";
import { NOW_REFERENCE } from "@/lib/workflows/meta";
import {
  runsLast24h,
  workflowAgentById,
  workflowById,
  workflowMissions,
  workflowsMock,
} from "@/lib/workflows/mocks";
import type { Workflow } from "@/lib/workflows/types";
import { delay } from "@/services/latency";

export interface WorkflowListData {
  workflows: Workflow[];
  runsLast24h: number;
}

export async function getWorkflows(_scope: Scope): Promise<WorkflowListData> {
  return delay({
    workflows: workflowsMock,
    runsLast24h: runsLast24h(workflowsMock, NOW_REFERENCE),
  });
}

/** Agrégat de la vue détail : un seul aller-retour par identifiant (option B). */
export interface WorkflowDetailData {
  workflow: Workflow;
  agent: AgentDetail | null;
  missions: MissionDetail[];
}

export async function getWorkflow(
  _scope: Scope,
  workflowId: string,
): Promise<WorkflowDetailData | null> {
  const workflow = workflowById(workflowId);
  if (!workflow) return delay(null);
  return delay({
    workflow,
    agent: workflowAgentById(workflow.agentId),
    missions: workflowMissions(workflow.relatedMissionIds),
  });
}
