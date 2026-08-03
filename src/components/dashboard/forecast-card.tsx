import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { ItemState } from "./item-state";
import type { Forecast, WidgetState } from "@/lib/dashboard/types";

const compact = (v: number) =>
  `${(v / 1000).toLocaleString("fr-FR", { maximumFractionDigits: 0 })}k€`;

export function ForecastCard({
  forecast,
  state = "success",
  onRetry,
}: {
  forecast: Forecast;
  state?: WidgetState;
  onRetry?: () => void;
}) {
  const fallback = ItemState({ state, skeletonHeight: "h-48", onRetry, emptyTitle: "Aucune prévision" });
  if (fallback) return <>{fallback}</>;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-border bg-surface p-3">
          <p className="text-[12px] uppercase tracking-wide text-muted-foreground">Actuel</p>
          <p className="mt-1 text-[18px] font-semibold text-foreground">
            {compact(forecast.currentValue)}
          </p>
        </div>
        <div className="rounded-lg border border-primary/30 bg-primary/10 p-3">
          <p className="text-[12px] uppercase tracking-wide text-muted-foreground">Prévu</p>
          <p className="mt-1 text-[18px] font-semibold text-primary">
            {compact(forecast.predictedValue)}
          </p>
        </div>
      </div>

      <div className="h-[160px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={forecast.series} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="forecastFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.45} />
                <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="var(--color-border)" vertical={false} />
            <XAxis
              dataKey="label"
              stroke="var(--color-muted-foreground)"
              tickLine={false}
              axisLine={false}
              fontSize={12}
            />
            <YAxis
              stroke="var(--color-muted-foreground)"
              tickFormatter={compact}
              tickLine={false}
              axisLine={false}
              width={48}
              fontSize={12}
            />
            <Tooltip
              contentStyle={{
                background: "var(--color-card)",
                border: "1px solid var(--color-border)",
                borderRadius: 12,
                fontSize: 12,
              }}
              formatter={(value: number) => compact(value)}
            />
            <Area
              type="monotone"
              dataKey="predicted"
              stroke="var(--color-primary)"
              strokeWidth={2}
              fill="url(#forecastFill)"
              name="Prévision"
            />
            <Area
              type="monotone"
              dataKey="actual"
              stroke="var(--color-success)"
              strokeWidth={2}
              fill="transparent"
              connectNulls
              name="Réalisé"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <p className="text-[12px] text-muted-foreground">
        Intervalle de confiance : {compact(forecast.confidenceInterval[0])} –{" "}
        {compact(forecast.confidenceInterval[1])} · horizon{" "}
        {new Date(forecast.predictionDate).toLocaleDateString("fr-FR", {
          month: "long",
          year: "numeric",
        })}
      </p>
    </div>
  );
}
