/**
 * Agrégations cross-module du module Insights.
 * Toutes les valeurs sont dérivées des mocks existants des autres modules :
 * aucune donnée parallèle n'est inventée ici.
 */
import { agentsDetailMock } from "@/lib/agents/mocks";
import { dealsMock } from "@/lib/crm/mocks";
import { ACTIVE_STAGES, DEAL_STAGE, DEAL_STAGE_ORDER } from "@/lib/crm/meta";
import { integrationsMock } from "@/lib/integrations/mocks";
import { INTEGRATION_STATUS, INTEGRATION_STATUS_ORDER } from "@/lib/integrations/meta";
import { MISSION_STATUS } from "@/lib/missions/meta";
import { missionsDetailMock } from "@/lib/missions/mocks";
import { workflowsMock } from "@/lib/workflows/mocks";

const DAY_MS = 86_400_000;

/** Date de référence dérivée des mocks (dernier événement connu). */
export function referenceDate(): Date {
  const stamps = [
    ...missionsDetailMock.map((m) => m.updatedAt),
    ...workflowsMock.flatMap((w) => w.runs.map((r) => r.startedAt)),
  ]
    .map((iso) => new Date(iso).getTime())
    .filter((t) => !Number.isNaN(t));
  return new Date(stamps.length ? Math.max(...stamps) : Date.now());
}

const DAY_FMT = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "2-digit",
  timeZone: "Europe/Paris",
});

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  const dow = (d.getUTCDay() + 6) % 7; // lundi = 0
  d.setUTCDate(d.getUTCDate() - dow);
  return d;
}

function dayKey(date: Date): string {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

export function missionsByStatus(): { status: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const mission of missionsDetailMock) {
    counts.set(mission.status, (counts.get(mission.status) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([status, count]) => ({
      status: MISSION_STATUS[status as keyof typeof MISSION_STATUS]?.label ?? status,
      count,
      key: status,
    }))
    .sort((a, b) => b.count - a.count)
    .map(({ status, count }) => ({ status, count }));
}

/** Statuts considérés comme « mission terminée ». */
const COMPLETED_STATUSES = new Set(["completed", "done"]);

export function missionsCompletedByWeek(weeks = 6): { week: string; count: number }[] {
  const ref = startOfWeek(referenceDate());
  const buckets = new Map<string, number>();
  for (let i = weeks - 1; i >= 0; i--) {
    const start = new Date(ref.getTime() - i * 7 * DAY_MS);
    buckets.set(start.toISOString().slice(0, 10), 0);
  }
  for (const mission of missionsDetailMock) {
    if (!COMPLETED_STATUSES.has(mission.status)) continue;
    const date = new Date(mission.updatedAt);
    if (Number.isNaN(date.getTime())) continue;
    const key = startOfWeek(date).toISOString().slice(0, 10);
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }
  return [...buckets.entries()].map(([key, count]) => ({
    week: `S. ${DAY_FMT.format(new Date(key))}`,
    count,
  }));
}

export function workflowSuccessRateByDay(
  days = 8,
): { day: string; successRate: number; total: number }[] {
  const ref = referenceDate();
  const buckets = new Map<string, { success: number; total: number }>();
  for (let i = days - 1; i >= 0; i--) {
    buckets.set(dayKey(new Date(ref.getTime() - i * DAY_MS)), { success: 0, total: 0 });
  }
  for (const workflow of workflowsMock) {
    for (const run of workflow.runs) {
      if (run.status === "running") continue;
      const key = dayKey(new Date(run.startedAt));
      const bucket = buckets.get(key);
      if (!bucket) continue;
      bucket.total += 1;
      if (run.status === "success") bucket.success += 1;
    }
  }
  return [...buckets.entries()].map(([key, { success, total }]) => ({
    day: DAY_FMT.format(new Date(key)),
    successRate: total ? Math.round((success / total) * 100) : 0,
    total,
  }));
}

export function averageConfidenceByAgent(): { agentName: string; confidenceScore: number }[] {
  return agentsDetailMock
    .map((agent) => ({ agentName: agent.name, confidenceScore: agent.confidenceScore }))
    .sort((a, b) => b.confidenceScore - a.confidenceScore);
}

export function pipelineValueByStage(): { stage: string; value: number }[] {
  return DEAL_STAGE_ORDER.map((stage) => ({
    stage: DEAL_STAGE[stage].label,
    value: dealsMock.filter((d) => d.stage === stage).reduce((sum, d) => sum + d.value, 0),
  })).filter((entry) => entry.value > 0);
}

export function integrationsByStatus(): { status: string; count: number }[] {
  return INTEGRATION_STATUS_ORDER.map((status) => ({
    status: INTEGRATION_STATUS[status].label,
    count: integrationsMock.filter((i) => i.status === status).length,
  })).filter((entry) => entry.count > 0);
}

/** Métriques du bandeau Insights Overview. */
export function insightsOverview() {
  const totalMissions = missionsDetailMock.length;
  const completed = missionsDetailMock.filter((m) => COMPLETED_STATUSES.has(m.status)).length;

  const confidences = agentsDetailMock.map((a) => a.confidenceScore);
  const avgConfidence = confidences.length
    ? Math.round(confidences.reduce((s, v) => s + v, 0) / confidences.length)
    : 0;

  const activePipeline = dealsMock
    .filter((d) => ACTIVE_STAGES.includes(d.stage))
    .reduce((sum, d) => sum + d.value, 0);

  const runs = workflowsMock.flatMap((w) => w.runs).filter((r) => r.status !== "running");
  const successRuns = runs.filter((r) => r.status === "success").length;

  return {
    missionCompletionRate: totalMissions ? Math.round((completed / totalMissions) * 100) : 0,
    completedMissions: completed,
    totalMissions,
    avgConfidence,
    activePipeline,
    workflowSuccessRate: runs.length ? Math.round((successRuns / runs.length) * 100) : 0,
    totalRuns: runs.length,
    connectedIntegrations: integrationsMock.filter((i) => i.status === "connected").length,
    totalIntegrations: integrationsMock.length,
  };
}
