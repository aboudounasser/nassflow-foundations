import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { TriangleAlert } from "lucide-react";

import { BillingOverviewBanner } from "@/components/billing/billing-overview";
import { ConsumptionSection } from "@/components/billing/consumption-section";
import { InvoicesSection } from "@/components/billing/invoices-section";
import { PaymentMethodsSection } from "@/components/billing/payment-methods-section";
import { PlansSection } from "@/components/billing/plans-section";
import { EmptyState } from "@/components/common/empty-state";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useBillingPlans, useConsumption, useInvoices } from "@/lib/billing/queries";
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

  const plansQuery = useBillingPlans();
  const invoicesQuery = useInvoices();
  const consumptionQuery = useConsumption();

  const bannerLoading =
    plansQuery.isPending || invoicesQuery.isPending || consumptionQuery.isPending;
  const bannerError = plansQuery.isError || invoicesQuery.isError || consumptionQuery.isError;

  const plan = useMemo(() => {
    const plans = plansQuery.data;
    return plans?.find((p) => p.isCurrent) ?? plans?.at(-1);
  }, [plansQuery.data]);

  const invoice = useMemo(() => {
    const invoices = invoicesQuery.data;
    if (!invoices?.length) return undefined;
    return (
      [...invoices]
        .filter((i) => i.status !== "paid")
        .sort((a, b) => a.dueAt.localeCompare(b.dueAt))[0] ?? invoices[0]
    );
  }, [invoicesQuery.data]);

  const summary = consumptionQuery.data?.summary;

  const retry = () => {
    if (plansQuery.isError) void plansQuery.refetch();
    if (invoicesQuery.isError) void invoicesQuery.refetch();
    if (consumptionQuery.isError) void consumptionQuery.refetch();
  };

  return (
    <>
      <section className="col-span-12 min-w-0">
        <h1 className="text-foreground">Billing</h1>
        <p className="mt-2 max-w-[640px] text-[16px] text-muted-foreground">{DESCRIPTION}</p>
      </section>

      <section className="col-span-12 @container min-w-0">
        {bannerError ? (
          <Card className="border-border bg-card p-4">
            <EmptyState
              icon={TriangleAlert}
              title="Impossible de charger la facturation"
              description="Les données de facturation n'ont pas pu être récupérées. Vérifiez votre connexion puis réessayez."
            />
            <div className="flex justify-center">
              <Button type="button" size="sm" onClick={retry}>
                Réessayer
              </Button>
            </div>
          </Card>
        ) : plan && invoice && summary ? (
          <BillingOverviewBanner
            plan={plan}
            totalCost={summary.totalCost}
            totalAiCalls={summary.totalAiCalls}
            nextInvoice={invoice}
            loading={false}
          />
        ) : (
          <BillingOverviewBanner loading={true} />
        )}
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

        {tab === "consumption" ? (
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
