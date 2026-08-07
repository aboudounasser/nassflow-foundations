import { ShieldCheck } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { securityOverview } from "@/lib/security/aggregations";

function ScoreRing({ score }: { score: number }) {
  const angle = Math.round((score / 100) * 360);
  return (
    <div
      className="relative grid size-[104px] shrink-0 place-items-center rounded-full"
      style={{
        background: `conic-gradient(var(--color-primary) ${angle}deg, var(--color-border) ${angle}deg)`,
      }}
      role="img"
      aria-label={`Score de posture de sécurité : ${score} sur 100`}
    >
      <div className="grid size-[84px] place-items-center rounded-full bg-card">
        <span className="text-[24px] font-bold leading-7 text-foreground">{score}</span>
        <span className="text-[12px] text-muted-foreground">/ 100</span>
      </div>
    </div>
  );
}

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

export function SecurityOverviewBanner({
  data,
  loading = false,
}: {
  data: ReturnType<typeof securityOverview>;
  loading?: boolean;
}) {
  if (loading) {
    return (
      <Card className="border-border bg-card p-6">
        <div className="flex flex-col gap-6 @3xl:flex-row @3xl:items-center">
          <Skeleton className="size-[104px] shrink-0 rounded-full" />
          <div className="grid min-w-0 flex-1 grid-cols-2 gap-3 @3xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-[76px] rounded-lg" />
            ))}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="border-border bg-card p-6">
      <div className="flex flex-col gap-6 @3xl:flex-row @3xl:items-center">
        <div className="flex items-center gap-4 @3xl:w-[300px] @3xl:shrink-0">
          <ScoreRing score={data.score} />
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-[14px] font-medium text-foreground">
              <ShieldCheck className="size-4 shrink-0 text-primary" aria-hidden="true" />
              Security Overview
            </p>
            <p className="mt-1 text-[12px] leading-4 text-muted-foreground">
              Score dérivé des intégrations en erreur, des comptes suspendus et des erreurs agents
              récentes.
            </p>
          </div>
        </div>

        <div className="grid min-w-0 flex-1 grid-cols-2 gap-3 @3xl:grid-cols-4">
          <Tile value={String(data.criticalLast7Days)} label="Événements critiques (7 j)" />
          <Tile value={String(data.activeMembers)} label="Membres actifs" />
          <Tile value={String(data.suspendedMembers)} label="Membres suspendus" />
          <Tile value={String(data.integrationsInError)} label="Intégrations en erreur" />
        </div>
      </div>
    </Card>
  );
}
