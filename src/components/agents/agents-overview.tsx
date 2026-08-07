import { Activity, Bot, Clock, Gauge, Target, type LucideIcon } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { AgentDetail } from "@/lib/agents/types";

function StatCard({
  icon: Icon,
  value,
  label,
}: {
  icon: LucideIcon;
  value: string;
  label: string;
}) {
  return (
    <Card className="flex items-center gap-3 border-border bg-surface p-4">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-border bg-card">
        <Icon className="size-5 text-muted-foreground" aria-hidden="true" />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-[20px] font-medium tabular-nums text-foreground">
          {value}
        </span>
        <span className="block text-[11px] uppercase leading-tight tracking-wide text-muted-foreground">
          {label}
        </span>
      </span>
    </Card>
  );
}

export function AgentsOverviewSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 @2xl:grid-cols-3 @5xl:grid-cols-5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-[76px] rounded-xl" />
      ))}
    </div>
  );
}

export function AgentsOverview({
  agents,
  runningMissions,
}: {
  agents: AgentDetail[];
  runningMissions: number;
}) {
  const actifs = agents.filter((a) => a.status === "active").length;
  const reussite =
    agents.length > 0
      ? Math.round(agents.reduce((sum, a) => sum + a.confidenceScore, 0) / agents.length)
      : 0;

  return (
    <div className="@container">
      <div className="grid grid-cols-2 gap-4 @2xl:grid-cols-3 @5xl:grid-cols-5">
        <StatCard icon={Bot} value={String(agents.length)} label="Collaborateurs IA" />
        <StatCard icon={Activity} value={String(actifs)} label="Agents actifs" />
        <StatCard icon={Target} value={String(runningMissions)} label="Missions en cours" />
        <StatCard icon={Gauge} value={`${reussite} %`} label="Taux de réussite moyen" />
        <StatCard icon={Clock} value="1 248 h" label="Temps économisé" />
      </div>
    </div>
  );
}
