import { Building2, ShieldCheck, UserCheck, Users, type LucideIcon } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { CompanyProfile, Department, OrgMember } from "@/lib/organization/types";

function StatCard({ icon: Icon, value, label }: { icon: LucideIcon; value: string; label: string }) {
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

export function OrgOverviewSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 @2xl:grid-cols-3 @5xl:grid-cols-5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-[76px] rounded-xl" />
      ))}
    </div>
  );
}

export function OrgOverview({
  company,
  members,
  departments,
}: {
  company: CompanyProfile;
  members: OrgMember[];
  departments: Department[];
}) {
  const actifs = members.filter((m) => m.status === "active").length;
  const invites = members.filter((m) => m.status === "invited").length;
  const suspendus = members.filter((m) => m.status === "suspended").length;

  return (
    <div className="@container space-y-4">
      <Card className="flex flex-wrap items-center justify-between gap-3 border-border bg-surface p-4">
        <div className="min-w-0">
          <p className="text-[16px] font-medium text-foreground">{company.name}</p>
          <p className="text-[12px] text-muted-foreground">
            {company.industry} · {company.size} · Depuis {company.foundedYear}
          </p>
        </div>
        <p className="text-[12px] text-muted-foreground">
          Plan {company.plan} · {company.timezone} · {company.primaryLocale}
        </p>
      </Card>

      <div className="grid grid-cols-2 gap-4 @2xl:grid-cols-3 @5xl:grid-cols-5">
        <StatCard icon={Users} value={String(members.length)} label="Membres" />
        <StatCard icon={UserCheck} value={String(actifs)} label="Actifs" />
        <StatCard icon={ShieldCheck} value={String(invites)} label="Invitations en attente" />
        <StatCard icon={ShieldCheck} value={String(suspendus)} label="Suspendus" />
        <StatCard icon={Building2} value={String(departments.length)} label="Départements" />
      </div>
    </div>
  );
}