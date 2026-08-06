import { Plug, CircleCheck, TriangleAlert, Download, type LucideIcon } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Integration } from "@/lib/integrations/types";

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

export function IntegrationOverviewSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 @2xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-[76px] rounded-xl" />
      ))}
    </div>
  );
}

export function IntegrationOverview({ integrations }: { integrations: Integration[] }) {
  const connected = integrations.filter((i) => i.status === "connected").length;
  const errored = integrations.filter((i) => i.status === "error").length;
  const notInstalled = integrations.filter((i) => i.status === "not_installed").length;

  return (
    <div className="@container">
      <div className="grid grid-cols-2 gap-4 @2xl:grid-cols-4">
        <StatCard icon={Plug} value={String(integrations.length)} label="Intégrations" />
        <StatCard icon={CircleCheck} value={String(connected)} label="Connectées" />
        <StatCard icon={TriangleAlert} value={String(errored)} label="En erreur" />
        <StatCard icon={Download} value={String(notInstalled)} label="Non installées" />
      </div>
    </div>
  );
}