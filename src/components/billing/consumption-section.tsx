import { useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  consumptionByAgent,
  consumptionByDay,
  consumptionByMission,
  formatEuro,
} from "@/lib/billing/aggregations";

const PERIODS = [7, 30, 90] as const;
type Period = (typeof PERIODS)[number];

export function ConsumptionSection() {
  const navigate = useNavigate();
  const [period, setPeriod] = useState<Period>(30);

  const series = useMemo(() => consumptionByDay(period), [period]);
  const agents = useMemo(() => consumptionByAgent(), []);
  const missions = useMemo(() => consumptionByMission(), []);

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <Card className="min-w-0 border-border bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[14px] font-medium text-foreground">Coût IA par jour</p>
            <p className="mt-1 text-[12px] text-muted-foreground">
              Dérivé des logs d'agents facturés.
            </p>
          </div>
          <div className="flex gap-2">
            {PERIODS.map((p) => (
              <Button
                key={p}
                type="button"
                size="sm"
                variant={period === p ? "secondary" : "ghost"}
                aria-pressed={period === p}
                onClick={() => setPeriod(p)}
              >
                {p} j
              </Button>
            ))}
          </div>
        </div>

        <div className="mt-4 h-[220px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={series} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="billingFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.45} />
                  <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--color-border)" vertical={false} />
              <XAxis
                dataKey="day"
                stroke="var(--color-muted-foreground)"
                tickLine={false}
                axisLine={false}
                fontSize={12}
                minTickGap={24}
              />
              <YAxis
                stroke="var(--color-muted-foreground)"
                tickFormatter={(v: number) =>
                  `${v.toLocaleString("fr-FR", { maximumFractionDigits: 2 })} €`
                }
                tickLine={false}
                axisLine={false}
                width={64}
                fontSize={12}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--color-card)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 8,
                  fontSize: 12,
                }}
                labelStyle={{ color: "var(--color-muted-foreground)" }}
                formatter={(value: number) => [formatEuro(value), "Coût"]}
              />
              <Area
                type="monotone"
                dataKey="cost"
                stroke="var(--color-primary)"
                strokeWidth={2}
                fill="url(#billingFill)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="grid min-w-0 gap-4 @4xl:grid-cols-2">
        <Card className="min-w-0 border-border bg-card p-4">
          <p className="text-[14px] font-medium text-foreground">Coût par agent</p>
          <p className="mt-1 text-[12px] text-muted-foreground">
            Somme des coûts estimés des logs de chaque agent.
          </p>
          <div className="mt-4 min-w-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Agent</TableHead>
                  <TableHead className="text-right">Appels</TableHead>
                  <TableHead className="text-right">Coût</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {agents.map((row) => (
                  <TableRow
                    key={row.agentId}
                    className="cursor-pointer"
                    onClick={() =>
                      navigate({ to: "/agents/$agentId", params: { agentId: row.agentId } })
                    }
                  >
                    <TableCell className="text-foreground">{row.agentName}</TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {row.calls}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-foreground">
                      {formatEuro(row.cost)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>

        <Card className="min-w-0 border-border bg-card p-4">
          <p className="text-[14px] font-medium text-foreground">Coût par mission</p>
          <p className="mt-1 text-[12px] text-muted-foreground">
            Appels IA et coût estimé déclarés par chaque mission.
          </p>
          <div className="mt-4 min-w-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mission</TableHead>
                  <TableHead className="text-right">Appels IA</TableHead>
                  <TableHead className="text-right">Coût</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {missions.map((row) => (
                  <TableRow
                    key={row.missionId}
                    className="cursor-pointer"
                    onClick={() =>
                      navigate({
                        to: "/missions/$missionId",
                        params: { missionId: row.missionId },
                      })
                    }
                  >
                    <TableCell className="max-w-[220px] truncate text-foreground">
                      {row.title}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {row.aiCalls.toLocaleString("fr-FR")}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-foreground">
                      {formatEuro(row.cost)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </div>
  );
}
