/** Modèle du module Billing — plans, factures et moyens de paiement (mocks). */

export interface BillingPlan {
  id: string;
  name: string;
  pricePerMonth: number;
  includedAiCalls: number;
  includedSeats: number;
  features: string[];
  isCurrent: boolean;
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