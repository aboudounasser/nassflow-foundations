import {
  Activity,
  CirclePlay,
  Percent,
  Workflow as WorkflowIcon,
  type LucideIcon,
} from "lucide-react";

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { NOW_REFERENCE } from "@/lib/workflows/meta";
import { runsLast24h } from "@/lib/workflows/mocks";
import type { Workflow } from "@/lib/workflows/types";

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

export function WorkflowOverviewSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 @2xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-[76px] rounded-xl" />
      ))}
    </div>
  );
}

export function WorkflowOverview({ workflows }: { workflows: Workflow[] }) {
  const active = workflows.filter((w) => w.status === "active").length;
  const rated = workflows.filter((w) => w.runs.length > 0);
  const avgSuccess =
    rated.length > 0
      ? Math.round(rated.reduce((sum, w) => sum + w.successRate, 0) / rated.length)
      : 0;
  const last24h = runsLast24h(workflows, NOW_REFERENCE);

  return (
    <div className="@container">
      <div className="grid grid-cols-2 gap-4 @2xl:grid-cols-4">
        <StatCard icon={WorkflowIcon} value={String(workflows.length)} label="Workflows" />
        <StatCard icon={CirclePlay} value={String(active)} label="Actifs" />
        <StatCard icon={Percent} value={`${avgSuccess}%`} label="Taux de réussite moyen" />
        <StatCard icon={Activity} value={String(last24h)} label="Exécutions 24h" />
      </div>
    </div>
  );
}
