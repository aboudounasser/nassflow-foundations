import { createFileRoute } from "@tanstack/react-router";
import { BarChart3, Download, Share2 } from "lucide-react";
import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";

import { WidgetShell } from "@/components/dashboard/widget-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  averageConfidenceByAgent,
  insightsOverview,
  integrationsByStatus,
  missionsByStatus,
  missionsCompletedByWeek,
  pipelineValueByStage,
  workflowSuccessRateByDay,
} from "@/lib/insights/aggregations";
import {
  CHART_TOOLTIP_STYLE,
  VARIANT_COLOR,
  euroCompact,
  percentFormat,
} from "@/lib/insights/chart-colors";
import { DEAL_STAGE } from "@/lib/crm/meta";
import { INTEGRATION_STATUS } from "@/lib/integrations/meta";
import { MISSION_STATUS } from "@/lib/missions/meta";

const DESCRIPTION =
  "Vue analytique cross-module de NASSFLOW OS : missions, workforce, pipeline, workflows et intégrations.";

export const Route = createFileRoute("/insights")({
  head: () => ({
    meta: [
      { title: "Insights — NASSFLOW OS" },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: "Insights — NASSFLOW OS" },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

const PERIODS = [
  { value: "7", label: "7 j", days: 7, weeks: 4 },
  { value: "30", label: "30 j", days: 30, weeks: 6 },
  { value: "90", label: "90 j", days: 90, weeks: 13 },
] as const;

const AXIS = {
  stroke: "var(--color-muted-foreground)",
  tickLine: false,
  axisLine: false,
  fontSize: 12,
} as const;

const CHART_H = "h-[220px]";

function ChartSkeleton() {
  return <Skeleton className={`w-full rounded-lg ${CHART_H}`} />;
}

/** Couleur d'un libellé de statut de mission (via MISSION_STATUS). */
function missionColor(label: string) {
  const entry = Object.values(MISSION_STATUS).find((s) => s.label === label);
  return VARIANT_COLOR[entry?.variant ?? "neutral"] ?? VARIANT_COLOR["neutral"];
}

function dealColor(label: string) {
  const entry = Object.values(DEAL_STAGE).find((s) => s.label === label);
  return VARIANT_COLOR[entry?.variant ?? "neutral"] ?? VARIANT_COLOR["neutral"];
}

function integrationColor(label: string) {
  const entry = Object.values(INTEGRATION_STATUS).find((s) => s.label === label);
  return VARIANT_COLOR[entry?.variant ?? "neutral"] ?? VARIANT_COLOR["neutral"];
}

function OverviewTile({ value, label }: { value: string; label: string }) {
  return (
    <Card className="border-border bg-surface p-4">
      <p className="truncate text-[20px] font-medium tabular-nums text-foreground">{value}</p>
      <p className="mt-1 text-[11px] uppercase leading-tight tracking-wide text-muted-foreground">
        {label}
      </p>
    </Card>
  );
}

function Page() {
  const [period, setPeriod] = useState<(typeof PERIODS)[number]["value"]>("30");
  // État du module : loading / success (mocks statiques).
  const [state] = useState<"loading" | "success">("success");

  const selected = PERIODS.find((p) => p.value === period) ?? PERIODS[1];

  const overview = useMemo(() => insightsOverview(), []);
  const byStatus = useMemo(() => missionsByStatus(), []);
  const byAgent = useMemo(() => averageConfidenceByAgent(), []);
  const byStage = useMemo(() => pipelineValueByStage(), []);
  const byIntegration = useMemo(() => integrationsByStatus(), []);
  const completedByWeek = useMemo(() => missionsCompletedByWeek(selected.weeks), [selected.weeks]);
  const successByDay = useMemo(() => workflowSuccessRateByDay(selected.days), [selected.days]);

  const chartState = (data: unknown[]) =>
    state === "loading" ? "loading" : data.length === 0 ? "empty" : "success";

  return (
    <>
      <section className="col-span-12 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-foreground">Insights</h1>
          <p className="mt-2 max-w-[640px] text-[16px] text-muted-foreground">{DESCRIPTION}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => toast.success("Export généré (mock)")}
          >
            <Download />
            Exporter en PDF
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => toast.success("Lien de partage copié (mock)")}
          >
            <Share2 />
            Partager le rapport
          </Button>
        </div>
      </section>

      <section className="col-span-12 @container">
        {state === "loading" ? (
          <div className="grid grid-cols-2 gap-4 @3xl:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-[76px] rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 @3xl:grid-cols-5">
            <OverviewTile
              value={`${overview.missionCompletionRate} %`}
              label={`Missions terminées (${overview.completedMissions}/${overview.totalMissions})`}
            />
            <OverviewTile value={`${overview.avgConfidence} %`} label="Confiance moyenne agents" />
            <OverviewTile value={euroCompact(overview.activePipeline)} label="Pipeline actif" />
            <OverviewTile
              value={`${overview.workflowSuccessRate} %`}
              label={`Réussite workflows (${overview.totalRuns} runs)`}
            />
            <OverviewTile
              value={`${overview.connectedIntegrations}/${overview.totalIntegrations}`}
              label="Intégrations connectées"
            />
          </div>
        )}
      </section>

      <section className="col-span-12 flex flex-wrap items-center gap-3">
        <span className="text-[12px] text-muted-foreground">Période (graphiques temporels) :</span>
        <ToggleGroup
          type="single"
          value={period}
          onValueChange={(v) => v && setPeriod(v as typeof period)}
          aria-label="Filtrer la période"
        >
          {PERIODS.map((p) => (
            <ToggleGroupItem key={p.value} value={p.value} aria-label={p.label}>
              {p.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </section>

      <section className="col-span-12 @container">
        <div className="grid grid-cols-1 gap-4 @4xl:grid-cols-2">
          <WidgetShell
            title="Missions par statut"
            icon={BarChart3}
            state={chartState(byStatus)}
            emptyIcon={BarChart3}
            emptyTitle="Aucune mission"
            skeleton={<ChartSkeleton />}
          >
            <div className={`w-full ${CHART_H}`}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byStatus} layout="vertical" margin={{ left: 8, right: 16 }}>
                  <CartesianGrid stroke="var(--color-border)" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} {...AXIS} />
                  <YAxis type="category" dataKey="status" width={96} interval={0} {...AXIS} />
                  <Tooltip contentStyle={CHART_TOOLTIP_STYLE} cursor={false} />
                  <Bar dataKey="count" name="Missions" radius={[0, 6, 6, 0]}>
                    {byStatus.map((entry) => (
                      <Cell key={entry.status} fill={missionColor(entry.status)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </WidgetShell>

          <WidgetShell
            title="Missions terminées par semaine"
            description={`Période : ${selected.label}`}
            icon={BarChart3}
            state={chartState(completedByWeek)}
            emptyIcon={BarChart3}
            emptyTitle="Aucune mission terminée"
            skeleton={<ChartSkeleton />}
          >
            <div className={`w-full ${CHART_H}`}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={completedByWeek} margin={{ top: 8, right: 8, left: 0 }}>
                  <defs>
                    <linearGradient id="insightsMissionsFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.45} />
                      <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="week" interval="preserveStartEnd" {...AXIS} />
                  <YAxis allowDecimals={false} width={32} {...AXIS} />
                  <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                  <Area
                    type="monotone"
                    dataKey="count"
                    name="Terminées"
                    stroke="var(--color-primary)"
                    strokeWidth={2}
                    fill="url(#insightsMissionsFill)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </WidgetShell>

          <WidgetShell
            title="Taux de réussite Workflow Engine"
            description={`Période : ${selected.label}`}
            icon={BarChart3}
            state={chartState(successByDay)}
            emptyIcon={BarChart3}
            emptyTitle="Aucune exécution"
            skeleton={<ChartSkeleton />}
          >
            <div className={`w-full ${CHART_H}`}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={successByDay} margin={{ top: 8, right: 8, left: 0 }}>
                  <CartesianGrid stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="day" interval="preserveStartEnd" {...AXIS} />
                  <YAxis domain={[0, 100]} tickFormatter={percentFormat} width={52} {...AXIS} />
                  <Tooltip
                    contentStyle={CHART_TOOLTIP_STYLE}
                    formatter={(value: number) => percentFormat(value)}
                  />
                  <ReferenceLine
                    y={90}
                    stroke="var(--color-success)"
                    strokeDasharray="4 4"
                    label={{ value: "90 %", fill: "var(--color-muted-foreground)", fontSize: 11 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="successRate"
                    name="Réussite"
                    stroke="var(--color-primary)"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </WidgetShell>

          <WidgetShell
            title="Confiance moyenne par agent"
            icon={BarChart3}
            state={chartState(byAgent)}
            emptyIcon={BarChart3}
            emptyTitle="Aucun agent"
            skeleton={<ChartSkeleton />}
          >
            <div className={`w-full ${CHART_H}`}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byAgent} layout="vertical" margin={{ left: 8, right: 16 }}>
                  <CartesianGrid stroke="var(--color-border)" horizontal={false} />
                  <XAxis type="number" domain={[0, 100]} tickFormatter={percentFormat} {...AXIS} />
                  <YAxis type="category" dataKey="agentName" width={110} interval={0} {...AXIS} />
                  <Tooltip
                    contentStyle={CHART_TOOLTIP_STYLE}
                    cursor={false}
                    formatter={(value: number) => percentFormat(value)}
                  />
                  <Bar
                    dataKey="confidenceScore"
                    name="Confiance"
                    fill="var(--color-primary)"
                    radius={[0, 6, 6, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </WidgetShell>

          <WidgetShell
            title="Pipeline par étape"
            icon={BarChart3}
            state={chartState(byStage)}
            emptyIcon={BarChart3}
            emptyTitle="Aucun deal"
            skeleton={<ChartSkeleton />}
          >
            <div className={`w-full ${CHART_H}`}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byStage} margin={{ top: 8, right: 8, left: 0 }}>
                  <CartesianGrid stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="stage" interval={0} {...AXIS} />
                  <YAxis tickFormatter={euroCompact} width={64} {...AXIS} />
                  <Tooltip
                    contentStyle={CHART_TOOLTIP_STYLE}
                    cursor={false}
                    formatter={(value: number) => euroCompact(value)}
                  />
                  <Bar dataKey="value" name="Valeur" radius={[6, 6, 0, 0]}>
                    {byStage.map((entry) => (
                      <Cell key={entry.stage} fill={dealColor(entry.stage)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </WidgetShell>

          <WidgetShell
            title="Intégrations par statut"
            icon={BarChart3}
            state={chartState(byIntegration)}
            emptyIcon={BarChart3}
            emptyTitle="Aucune intégration"
            skeleton={<ChartSkeleton />}
          >
            <div className={`w-full ${CHART_H}`}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                  <Pie
                    data={byIntegration}
                    dataKey="count"
                    nameKey="status"
                    innerRadius="55%"
                    outerRadius="80%"
                    paddingAngle={2}
                    stroke="var(--color-card)"
                  >
                    {byIntegration.map((entry) => (
                      <Cell key={entry.status} fill={integrationColor(entry.status)} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
              {byIntegration.map((entry) => (
                <li
                  key={entry.status}
                  className="flex items-center gap-2 text-[12px] text-muted-foreground"
                >
                  <span
                    className="size-2 rounded-full"
                    style={{ background: integrationColor(entry.status) }}
                    aria-hidden="true"
                  />
                  {entry.status} · <span className="tabular-nums">{entry.count}</span>
                </li>
              ))}
            </ul>
          </WidgetShell>
        </div>
      </section>
    </>
  );
}
