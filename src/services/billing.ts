import { agentsDetailMock } from "@/lib/agents/mocks";
import { parseEuro } from "@/lib/billing/aggregations";
import { billingPlansMock, invoicesMock, paymentMethodsMock } from "@/lib/billing/mocks";
import type {
  BillingPlan,
  ConsumptionData,
  ConsumptionRowByAgent,
  ConsumptionRowByMission,
  ConsumptionSummary,
  Invoice,
  PaymentMethod,
} from "@/lib/billing/types";
import { referenceDate } from "@/lib/insights/aggregations";
import { missionsDetailMock } from "@/lib/missions/mocks";
import type { Scope } from "@/lib/tenancy/types";

/**
 * Latence simulée. Rend isPending réel et permet de valider les états
 * de chargement. À supprimer quand les appels réseau seront réels.
 */
const MOCK_LATENCY_MS = 250;
function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), MOCK_LATENCY_MS));
}

const DAY_MS = 86_400_000;

const DAY_FMT = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "2-digit",
  timeZone: "Europe/Paris",
});

function consumptionByAgent(): ConsumptionRowByAgent[] {
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

function consumptionByMission(): ConsumptionRowByMission[] {
  return missionsDetailMock
    .map((mission) => ({
      missionId: mission.id,
      title: mission.title,
      aiCalls: mission.cost.aiCalls,
      cost: parseEuro(mission.cost.estimatedCost),
    }))
    .sort((a, b) => b.cost - a.cost);
}

function consumptionSummary(): ConsumptionSummary {
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
function consumptionByDay(days = 30): { day: string; cost: number }[] {
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

export async function getBillingPlans(_scope: Scope): Promise<BillingPlan[]> {
  return delay(billingPlansMock);
}

export async function getInvoices(_scope: Scope): Promise<Invoice[]> {
  return delay(invoicesMock);
}

export async function getPaymentMethods(_scope: Scope): Promise<PaymentMethod[]> {
  return delay(paymentMethodsMock);
}

export async function getConsumption(_scope: Scope): Promise<ConsumptionData> {
  return delay({
    summary: consumptionSummary(),
    byAgent: consumptionByAgent(),
    byMission: consumptionByMission(),
    /** 90 jours : la vue laisse l'utilisateur restreindre la fenêtre affichée. */
    byDay: consumptionByDay(90),
  });
}
