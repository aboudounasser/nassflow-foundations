/**
 * Agrégations du module Billing.
 * La consommation facturée dérive uniquement des coûts déjà présents dans les
 * autres modules : missionsDetailMock[].cost et agentsDetailMock[].logs[].costEstimate.
 */
import { agentsDetailMock } from "@/lib/agents/mocks";
import { referenceDate } from "@/lib/insights/aggregations";
import { missionsDetailMock } from "@/lib/missions/mocks";
import type { BillingPlan, PlanCta, PlanTier } from "./types";

const DAY_MS = 86_400_000;

const DAY_FMT = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "2-digit",
  timeZone: "Europe/Paris",
});

/** "18,40 €" → 18.4 — robuste aux espaces insécables, au symbole € et aux séparateurs de milliers. */
export function parseEuro(value: string): number {
  if (!value) return 0;
  const cleaned = value
    .replace(/[\u00a0\u202f\s]/g, "")
    .replace(/€/g, "")
    .replace(/\.(?=\d{3}(\D|$))/g, "")
    .replace(",", ".");
  const parsed = Number.parseFloat(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}

/** Formatage monétaire fr-FR. */
export function formatEuro(value: number, maximumFractionDigits = 2): string {
  return value.toLocaleString("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits,
    minimumFractionDigits: maximumFractionDigits === 0 ? 0 : 2,
  });
}

export function consumptionByAgent(): {
  agentId: string;
  agentName: string;
  calls: number;
  cost: number;
}[] {
  return agentsDetailMock
    .map((agent) => {
      const billed = agent.logs.filter((log) => log.costEstimate);
      return {
        agentId: agent.id,
        agentName: agent.name,
        calls: billed.length,
        cost: billed.reduce((sum, log) => sum + parseEuro(log.costEstimate!), 0),
      };
    })
    .sort((a, b) => b.cost - a.cost);
}

/** Prix affiché d'un plan : "Gratuit", "Sur devis" ou "1 890 €". */
export function formatPlanPrice(plan: BillingPlan): string {
  if (plan.isFree) return "Gratuit";
  if (plan.pricePerMonth === null) return "Sur devis";
  return formatEuro(plan.pricePerMonth, 0);
}

/** Le suffixe "/ mois" ne s'affiche que pour un prix chiffré. */
export function showsMonthlySuffix(plan: BillingPlan): boolean {
  return !plan.isFree && plan.pricePerMonth !== null;
}

export function consumptionByMission(): {
  missionId: string;
  title: string;
  aiCalls: number;
  cost: number;
}[] {
  return missionsDetailMock
    .map((mission) => ({
      missionId: mission.id,
      title: mission.title,
      aiCalls: mission.cost.aiCalls,
      cost: parseEuro(mission.cost.estimatedCost),
    }))
    .sort((a, b) => b.cost - a.cost);
}

export function consumptionSummary(): {
  totalCost: number;
  totalAiCalls: number;
  missionCount: number;
  avgCostPerMission: number;
} {
  const rows = consumptionByMission();
  const totalCost = rows.reduce((sum, r) => sum + r.cost, 0);
  const totalAiCalls = rows.reduce((sum, r) => sum + r.aiCalls, 0);
  return {
    totalCost,
    totalAiCalls,
    missionCount: rows.length,
    avgCostPerMission: rows.length ? totalCost / rows.length : 0,
  };
}

/** Coût quotidien issu des logs d'agents facturés, sur les `days` derniers jours. */
export function consumptionByDay(days = 30): { day: string; cost: number }[] {
  const ref = new Date(referenceDate());
  ref.setUTCHours(0, 0, 0, 0);
  const buckets = new Map<string, number>();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(ref.getTime() - i * DAY_MS);
    buckets.set(d.toISOString().slice(0, 10), 0);
  }
  for (const agent of agentsDetailMock) {
    for (const log of agent.logs) {
      if (!log.costEstimate) continue;
      const key = log.timestamp.slice(0, 10);
      if (!buckets.has(key)) continue;
      buckets.set(key, buckets.get(key)! + parseEuro(log.costEstimate));
    }
  }
  return [...buckets.entries()].map(([key, cost]) => ({
    day: DAY_FMT.format(new Date(`${key}T00:00:00.000Z`)),
    cost: Math.round(cost * 100) / 100,
  }));
}
