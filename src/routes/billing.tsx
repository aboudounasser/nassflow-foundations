import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import { BillingOverviewBanner } from "@/components/billing/billing-overview";
import { ConsumptionSection } from "@/components/billing/consumption-section";
import { InvoicesSection } from "@/components/billing/invoices-section";
import { PaymentMethodsSection } from "@/components/billing/payment-methods-section";
import { PlansSection } from "@/components/billing/plans-section";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { consumptionSummary } from "@/lib/billing/aggregations";
import { currentPlan, nextDueInvoice } from "@/lib/billing/mocks";
import type { BillingTab } from "@/lib/billing/types";

const DESCRIPTION =
  "Facturation de NASSFLOW OS : consommation IA dérivée des missions et des agents, factures, plans et moyens de paiement.";

export const Route = createFileRoute("/billing")({
  head: () => ({
    meta: [
      { title: "Billing — NASSFLOW OS" },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: "Billing — NASSFLOW OS" },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

const TABS: { value: BillingTab; label: string }[] = [
  { value: "consumption", label: "Consommation" },
  { value: "invoices", label: "Factures" },
  { value: "plans", label: "Plans" },
  { value: "payment", label: "Moyens de paiement" },
];

function Page() {
  const [tab, setTab] = useState<BillingTab>("consumption");
  const [state] = useState<"loading" | "success">("success");
  const loading = state === "loading";

  const summary = useMemo(() => consumptionSummary(), []);
  const plan = useMemo(() => currentPlan(), []);
  const invoice = useMemo(() => nextDueInvoice(), []);

  return (
    <>
      <section className="col-span-12 min-w-0">
        <h1 className="text-foreground">Billing</h1>
        <p className="mt-2 max-w-[640px] text-[16px] text-muted-foreground">{DESCRIPTION}</p>
      </section>

      <section className="col-span-12 @container min-w-0">
        <BillingOverviewBanner
          plan={plan}
          totalCost={summary.totalCost}
          totalAiCalls={summary.totalAiCalls}
          nextInvoice={invoice}
          loading={loading}
        />
      </section>

      <section className="col-span-12 @container flex min-w-0 flex-col gap-4">
        <ToggleGroup
          type="single"
          value={tab}
          onValueChange={(value) => value && setTab(value as BillingTab)}
          variant="outline"
          className="flex-wrap justify-start"
        >
          {TABS.map((t) => (
            <ToggleGroupItem key={t.value} value={t.value} aria-label={t.label}>
              {t.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>

        {loading ? (
          <div className="grid gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-lg" />
            ))}
          </div>
        ) : tab === "consumption" ? (
          <ConsumptionSection />
        ) : tab === "invoices" ? (
          <InvoicesSection />
        ) : tab === "plans" ? (
          <PlansSection />
        ) : (
          <PaymentMethodsSection />
        )}
      </section>
    </>
  );
}
