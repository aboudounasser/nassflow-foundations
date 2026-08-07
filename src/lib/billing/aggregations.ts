/**
 * Helpers de présentation du module Billing.
 * La production des données de consommation vit dans src/services/billing.ts.
 */
import type { BillingPlan, PlanCta, PlanTier } from "./types";

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

const TIER_RANK: Record<PlanTier, number> = {
  free: 0,
  starter: 1,
  business: 2,
  enterprise: 3,
};

/**
 * Le CTA d'un plan dépend TOUJOURS du plan courant.
 * Un même plan est une montée ou une descente en gamme selon le
 * contexte : cette valeur ne doit jamais être figée dans les données.
 */
export function planCta(plan: BillingPlan, current: BillingPlan): PlanCta {
  if (plan.isCurrent) return "current";
  if (plan.pricePerMonth === null) return "contact_sales";
  return TIER_RANK[plan.tier] > TIER_RANK[current.tier] ? "upgrade" : "downgrade";
}
