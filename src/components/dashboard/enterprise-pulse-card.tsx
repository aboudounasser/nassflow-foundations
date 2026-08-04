import { Activity, ArrowRight, Sparkles, TrendingUp, TriangleAlert } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { WidgetShell, type WidgetProps } from "./widget-shell";
import type { EnterprisePulse } from "@/lib/dashboard/types";

function ScoreRing({ score }: { score: number }) {
  const angle = Math.round((score / 100) * 360);
  return (
    <div
      className="relative grid size-[104px] shrink-0 place-items-center rounded-full"
      style={{
        background: `conic-gradient(var(--color-primary) ${angle}deg, var(--color-border) ${angle}deg)`,
      }}
      role="img"
      aria-label={`Enterprise Score : ${score} sur 100`}
    >
      <div className="grid size-[84px] place-items-center rounded-full bg-card">
        <span className="text-[24px] font-bold leading-7 text-foreground">{score}</span>
        <span className="text-[12px] text-muted-foreground">/ 100</span>
      </div>
    </div>
  );
}

function PulseList({
  label,
  items,
  icon: Icon,
  tone,
}: {
  label: string;
  items: string[];
  icon: typeof TrendingUp;
  tone: string;
}) {
  return (
    <div className="min-w-0">
      <p className="flex items-center gap-2 text-[12px] font-medium uppercase tracking-wide text-muted-foreground">
        <Icon className={`size-4 shrink-0 ${tone}`} aria-hidden="true" />
        {label}
      </p>
      <ul className="mt-2 space-y-1">
        {items.map((item) => (
          <li key={item} className="text-[14px] leading-5 text-foreground/90">
            • {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function EnterprisePulseCard({
  data,
  state = "success",
  onRetry,
}: WidgetProps & { data: EnterprisePulse }) {
  return (
    <WidgetShell
      title="Enterprise Pulse"
      description="Synthèse IA de l'état de l'entreprise"
      icon={Activity}
      state={state}
      onRetry={onRetry}
      emptyIcon={Sparkles}
      emptyTitle="Aucune synthèse disponible"
      emptyDescription="Le CEO Agent génèrera un résumé au prochain cycle."
      headerAction={
        <Badge variant="primary">
          <Sparkles /> Confiance {data.confidenceScore}%
        </Badge>
      }
      skeleton={
        <div className="flex flex-col gap-6 md:flex-row">
          <Skeleton className="size-[104px] shrink-0 rounded-full" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-20 w-full rounded-lg" />
          </div>
        </div>
      }
    >
      <div className="flex flex-col gap-6 @3xl:flex-row">
        <div className="flex items-center gap-4 @3xl:w-[320px] @3xl:shrink-0">
          <ScoreRing score={data.enterpriseScore} />
          <div className="min-w-0">
            <p className="text-[14px] leading-5 text-foreground/90">{data.summary}</p>
            <p className="mt-2 text-[12px] text-muted-foreground">
              Généré le {new Date(data.generatedAt).toLocaleDateString("fr-FR", { timeZone: "Europe/Paris" })}
            </p>
          </div>
        </div>

        <Separator orientation="vertical" className="hidden h-auto @3xl:block" />

        <div className="grid min-w-0 flex-1 gap-6 @xl:grid-cols-3">
          <PulseList
            label="Priorités"
            items={data.priorities}
            icon={ArrowRight}
            tone="text-primary"
          />
          <PulseList label="Risques" items={data.risks} icon={TriangleAlert} tone="text-warning" />
          <PulseList
            label="Opportunités"
            items={data.opportunities}
            icon={TrendingUp}
            tone="text-success"
          />
        </div>
      </div>

      <div className="mt-6 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 rounded-lg border border-border bg-surface p-4">
        <p className="min-w-0 text-[14px] text-muted-foreground">
          <span className="text-foreground">Recommandation : </span>
          {data.recommendation}
        </p>
        <Button
          size="sm"
          className="shrink-0"
          onClick={() => toast.success("Détails du Enterprise Pulse")}
        >
          Voir les détails
        </Button>
      </div>
    </WidgetShell>
  );
}
