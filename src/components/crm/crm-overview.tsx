import { Building2, Percent, TrendingUp, UserCheck, Users, Wallet, type LucideIcon } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ACTIVE_STAGES, formatEuro } from "@/lib/crm/meta";
import type { Contact, Deal } from "@/lib/crm/types";

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

export function CrmOverviewSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 @2xl:grid-cols-3 @5xl:grid-cols-5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-[76px] rounded-xl" />
      ))}
    </div>
  );
}

export function CrmOverview({ contacts, deals }: { contacts: Contact[]; deals: Deal[] }) {
  const prospects = contacts.filter((c) => c.type === "prospect").length;
  const clients = contacts.filter((c) => c.type === "client").length;
  const activeValue = deals
    .filter((d) => ACTIVE_STAGES.includes(d.stage))
    .reduce((sum, d) => sum + d.value, 0);
  const conversion = contacts.length > 0 ? Math.round((clients / contacts.length) * 100) : 0;

  return (
    <div className="@container">
      <div className="grid grid-cols-2 gap-4 @2xl:grid-cols-3 @5xl:grid-cols-5">
        <StatCard icon={Users} value={String(contacts.length)} label="Contacts" />
        <StatCard icon={Building2} value={String(prospects)} label="Prospects" />
        <StatCard icon={UserCheck} value={String(clients)} label="Clients" />
        <StatCard icon={Wallet} value={formatEuro(activeValue)} label="Pipeline actif" />
        <StatCard icon={Percent} value={`${conversion}%`} label="Taux de conversion" />
      </div>
    </div>
  );
}

export function PipelineOverview({ deals }: { deals: Deal[] }) {
  const active = deals.filter((d) => ACTIVE_STAGES.includes(d.stage));
  const total = active.reduce((sum, d) => sum + d.value, 0);
  const weighted = active.reduce((sum, d) => sum + (d.value * d.probability) / 100, 0);
  const won = deals.filter((d) => d.stage === "won").reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="@container">
      <div className="grid grid-cols-2 gap-4 @2xl:grid-cols-4">
        <StatCard icon={Wallet} value={formatEuro(total)} label="Pipeline actif" />
        <StatCard icon={TrendingUp} value={formatEuro(Math.round(weighted))} label="Valeur pondérée" />
        <StatCard icon={UserCheck} value={formatEuro(won)} label="Signé (gagné)" />
        <StatCard icon={Users} value={String(active.length)} label="Deals en cours" />
      </div>
    </div>
  );
}