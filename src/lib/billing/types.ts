/** Modèle du module Billing — plans, factures et moyens de paiement (mocks). */

export type PlanTier = "free" | "starter" | "business" | "enterprise";
export type PlanCta = "current" | "upgrade" | "downgrade" | "contact_sales";

export interface PlanLimits {
  /** null = illimité */
  agents: number | null;
  missionsPerMonth: number | null;
  aiCalls: number;
  seats: number;
}

export interface BillingPlan {
  id: string;
  tier: PlanTier;
  name: string;
  tagline: string;
  /** null = tarif sur devis */
  pricePerMonth: number | null;
  /** null = pas d'essai */
  trialDays: number | null;
  isFree: boolean;
  isRecommended: boolean;
  isCurrent: boolean;
  ctaType: PlanCta;
  limits: PlanLimits;
  features: string[];
}

export type InvoiceStatus = "paid" | "pending" | "failed";

export interface Invoice {
  id: string;
  number: string;
  periodStart: string;
  periodEnd: string;
  amount: number;
  status: InvoiceStatus;
  issuedAt: string;
  dueAt: string;
}

export interface PaymentMethod {
  id: string;
  type: "card" | "sepa";
  label: string;
  expiresAt: string | null;
  isDefault: boolean;
}

export type BillingTab = "consumption" | "invoices" | "plans" | "payment";