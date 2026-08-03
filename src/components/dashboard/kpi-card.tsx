import { Minus, TrendingDown, TrendingUp } from "lucide-react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ItemState } from "./item-state";
import type { Kpi, WidgetState } from "@/lib/dashboard/types";

function formatValue(kpi: Kpi) {
  const formatted =
    kpi.value >= 1000
      ? kpi.value.toLocaleString("fr-FR", { maximumFractionDigits: 0 })
      : kpi.value.toLocaleString("fr-FR", { maximumFractionDigits: 1 });
  return kpi.unit === "€" ? `${formatted} €` : `${formatted}${kpi.unit}`;
}

export function KpiCard({
  kpi,
  state = "success",
  onRetry,
}: {
  kpi: Kpi;
  state?: WidgetState;
  onRetry?: () => void;
}) {
  const fallback = ItemState({
    state,
    skeletonHeight: "h-[104px]",
    onRetry,
    emptyTitle: "KPI indisponible",
  });
  if (fallback) return <>{fallback}</>;

  const TrendIcon = kpi.trend === "up" ? TrendingUp : kpi.trend === "down" ? TrendingDown : Minus;
  const positive = kpi.change >= 0;

  return (
    <Card interactive className="border-border bg-surface p-4">
      <p className="truncate text-[12px] uppercase tracking-wide text-muted-foreground">
        {kpi.title}
      </p>
      <p className="mt-2 text-[22px] font-semibold leading-7 text-foreground">{formatValue(kpi)}</p>
      <div className="mt-2 flex items-center gap-2">
        <span
          className={cn(
            "inline-flex items-center gap-1 text-[14px] font-medium",
            positive ? "text-success" : "text-destructive",
          )}
        >
          <TrendIcon className="size-4" aria-hidden="true" />
          {positive ? "+" : ""}
          {kpi.change}%
        </span>
        <span className="truncate text-[12px] text-muted-foreground">vs période précédente</span>
      </div>
    </Card>
  );
}
