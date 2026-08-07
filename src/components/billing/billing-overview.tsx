import { CreditCard } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { formatEuro, formatPlanPrice } from "@/lib/billing/aggregations";
import type { BillingPlan, Invoice } from "@/lib/billing/types";

const DATE_FMT = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "long",
  year: "numeric",
  timeZone: "Europe/Paris",
});

function Tile({ value, label }: { value: string; label: string }) {
  return (
    <Card className="border-border bg-surface p-4">
      <p className="truncate text-[20px] font-medium tabular-nums text-foreground">{value}</p>
      <p className="mt-1 text-[11px] uppercase leading-tight tracking-wide text-muted-foreground">
        {label}
      </p>
    </Card>
  );
}

export function BillingOverviewBanner({
  plan,
  totalCost,
  totalAiCalls,
  nextInvoice,
  loading = false,
}: {
  plan: BillingPlan;
  totalCost: number;
  totalAiCalls: number;
  nextInvoice: Invoice;
  loading?: boolean;
}) {
  if (loading) {
    return (
      <Card className="border-border bg-card p-6">
        <div className="flex flex-col gap-6">
          <Skeleton className="h-6 w-48" />
          <div className="grid gap-3 @3xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-[76px] rounded-lg" />
            ))}
          </div>
          <Skeleton className="h-3 w-full rounded-full" />
        </div>
      </Card>
    );
  }

  const quotaPct = Math.min(100, Math.round((totalAiCalls / plan.limits.aiCalls) * 100));

  return (
    <Card className="border-border bg-card p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-[14px] font-medium text-foreground">
          <CreditCard className="size-4 shrink-0 text-primary" aria-hidden="true" />
          Billing Overview
        </p>
        <Badge variant="primary">Plan actuel · {plan.name}</Badge>
      </div>

      <div className="mt-4 grid min-w-0 grid-cols-2 gap-3 @3xl:grid-cols-4">
        <Tile value={formatEuro(totalCost)} label="Coût consommé (période)" />
        <Tile value={totalAiCalls.toLocaleString("fr-FR")} label="Appels IA consommés" />
        <Tile value={formatPlanPrice(plan)} label="Abonnement mensuel" />
        <Tile
          value={DATE_FMT.format(new Date(nextInvoice.dueAt))}
          label="Prochaine échéance"
        />
      </div>

      <div className="mt-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-[12px] text-muted-foreground">Quota d'appels IA inclus</p>
          <p className="text-[12px] tabular-nums text-muted-foreground">
            {totalAiCalls.toLocaleString("fr-FR")} / {plan.limits.aiCalls.toLocaleString("fr-FR")}{" "}
            ({quotaPct} %)
          </p>
        </div>
        <Progress value={quotaPct} className="mt-2" />
      </div>
    </Card>
  );
}
