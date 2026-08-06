import type { BillingPlan, Invoice, PaymentMethod } from "./types";

/** Le plan courant reste "Enterprise", cohérent avec companyProfileMock.plan. */
export const billingPlansMock: BillingPlan[] = [
  {
    id: "p-starter",
    name: "Starter",
    pricePerMonth: 149,
    includedAiCalls: 5_000,
    includedSeats: 5,
    features: [
      "3 agents IA",
      "Missions illimitées en lecture",
      "Enterprise Brain (1 collection)",
      "Support par e-mail",
    ],
    isCurrent: false,
  },
  {
    id: "p-business",
    name: "Business",
    pricePerMonth: 590,
    includedAiCalls: 40_000,
    includedSeats: 25,
    features: [
      "7 agents IA",
      "Workflow Engine complet",
      "Integrations Hub (20 connecteurs)",
      "Insights & rapports",
      "Support prioritaire",
    ],
    isCurrent: false,
  },
  {
    id: "p-enterprise",
    name: "Enterprise",
    pricePerMonth: 1_890,
    includedAiCalls: 150_000,
    includedSeats: 100,
    features: [
      "Agents IA illimités",
      "Security Center & journal d'audit",
      "SSO, 2FA et restrictions IP",
      "Intégrations sur mesure",
      "Customer Success dédié",
    ],
    isCurrent: true,
  },
];

export const invoicesMock: Invoice[] = [
  {
    id: "inv-2026-08",
    number: "FA-2026-08",
    periodStart: "2026-08-01",
    periodEnd: "2026-08-31",
    amount: 2_143.6,
    status: "pending",
    issuedAt: "2026-08-01T08:00:00.000Z",
    dueAt: "2026-08-15T08:00:00.000Z",
  },
  {
    id: "inv-2026-07",
    number: "FA-2026-07",
    periodStart: "2026-07-01",
    periodEnd: "2026-07-31",
    amount: 2_074.2,
    status: "failed",
    issuedAt: "2026-07-01T08:00:00.000Z",
    dueAt: "2026-07-15T08:00:00.000Z",
  },
  {
    id: "inv-2026-06",
    number: "FA-2026-06",
    periodStart: "2026-06-01",
    periodEnd: "2026-06-30",
    amount: 1_996.4,
    status: "paid",
    issuedAt: "2026-06-01T08:00:00.000Z",
    dueAt: "2026-06-15T08:00:00.000Z",
  },
  {
    id: "inv-2026-05",
    number: "FA-2026-05",
    periodStart: "2026-05-01",
    periodEnd: "2026-05-31",
    amount: 1_954.8,
    status: "paid",
    issuedAt: "2026-05-01T08:00:00.000Z",
    dueAt: "2026-05-15T08:00:00.000Z",
  },
  {
    id: "inv-2026-04",
    number: "FA-2026-04",
    periodStart: "2026-04-01",
    periodEnd: "2026-04-30",
    amount: 1_912.3,
    status: "paid",
    issuedAt: "2026-04-01T08:00:00.000Z",
    dueAt: "2026-04-15T08:00:00.000Z",
  },
  {
    id: "inv-2026-03",
    number: "FA-2026-03",
    periodStart: "2026-03-01",
    periodEnd: "2026-03-31",
    amount: 1_890,
    status: "paid",
    issuedAt: "2026-03-01T08:00:00.000Z",
    dueAt: "2026-03-15T08:00:00.000Z",
  },
  {
    id: "inv-2026-02",
    number: "FA-2026-02",
    periodStart: "2026-02-01",
    periodEnd: "2026-02-28",
    amount: 1_890,
    status: "paid",
    issuedAt: "2026-02-01T08:00:00.000Z",
    dueAt: "2026-02-15T08:00:00.000Z",
  },
];

export const paymentMethodsMock: PaymentMethod[] = [
  {
    id: "pm-card",
    type: "card",
    label: "Visa •••• 4242",
    expiresAt: "2028-09-30",
    isDefault: true,
  },
  {
    id: "pm-sepa",
    type: "sepa",
    label: "Prélèvement SEPA •••• 8391",
    expiresAt: null,
    isDefault: false,
  },
];

/** Prochaine échéance = facture non réglée la plus ancienne, sinon la plus récente. */
export function nextDueInvoice(): Invoice {
  const unpaid = invoicesMock
    .filter((i) => i.status !== "paid")
    .sort((a, b) => a.dueAt.localeCompare(b.dueAt));
  return unpaid[0] ?? invoicesMock[0]!;
}

export function currentPlan(): BillingPlan {
  return billingPlansMock.find((p) => p.isCurrent) ?? billingPlansMock[billingPlansMock.length - 1]!;
}