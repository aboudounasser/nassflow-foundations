import { Activity, RefreshCw, Sparkles, TriangleAlert } from "lucide-react";
import { toast } from "sonner";

import { WidgetShell } from "@/components/dashboard/widget-shell";
import { useSession } from "@/components/providers/session-provider";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { WidgetState } from "@/lib/dashboard/types";
import { formatRelativePulseDate, pluralize } from "@/lib/pulse/meta";
import { useGeneratePulse, usePulse } from "@/lib/pulse/queries";

/** Rôles autorisés par la RLS et par l'Edge Function `generate-pulse` à déclencher une génération. */
const GENERATE_ROLES = ["owner", "admin"];

function PulseSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
      </div>
      <Skeleton className="h-16 w-full rounded-lg" />
      <Skeleton className="h-16 w-full rounded-lg" />
      <Skeleton className="h-4 w-2/5" />
    </div>
  );
}

/**
 * Synthèse quotidienne du CEO Agent (table `pulses`).
 *
 * La génération n'est proposée qu'aux rôles que l'Edge Function accepte :
 * masquer le bouton ailleurs évite un 403 promis d'avance, la vérification
 * faisant autorité restant côté serveur.
 */
export function EnterprisePulseCard() {
  const { session } = useSession();
  const pulseQuery = usePulse();
  const generateMutation = useGeneratePulse();

  const canGenerate = GENERATE_ROLES.includes(session.role);
  const pulse = pulseQuery.data ?? null;

  const generate = () => {
    generateMutation.mutate(undefined, {
      onSuccess: () => toast.success("Le pulse du jour a été généré."),
      // Message rédigé pour l'utilisateur final par l'Edge Function : affiché tel quel.
      onError: (e) => toast.error(e instanceof Error ? e.message : "La génération n'a pas abouti."),
    });
  };

  const state: WidgetState = pulseQuery.isPending
    ? "loading"
    : pulseQuery.isError
      ? "error"
      : pulse === null
        ? "empty"
        : "success";

  return (
    <WidgetShell
      title="Enterprise Pulse"
      description="Synthèse IA de l'état de l'entreprise"
      icon={Activity}
      state={state}
      showMenu={false}
      onRetry={() => void pulseQuery.refetch()}
      skeleton={<PulseSkeleton />}
      emptyIcon={Sparkles}
      emptyTitle="Aucun résumé aujourd'hui"
      emptyDescription={
        canGenerate
          ? "Générez le résumé du jour pour voir où en est l'entreprise."
          : "Le résumé du jour n'a pas encore été généré."
      }
      emptyAction={
        canGenerate ? (
          <Button
            type="button"
            size="sm"
            loading={generateMutation.isPending}
            disabled={generateMutation.isPending}
            onClick={generate}
          >
            <Sparkles />
            Générer le résumé
          </Button>
        ) : null
      }
      headerAction={
        pulse && canGenerate ? (
          <Button
            type="button"
            size="sm"
            variant="secondary"
            loading={generateMutation.isPending}
            disabled={generateMutation.isPending}
            onClick={generate}
          >
            <RefreshCw />
            Actualiser
          </Button>
        ) : null
      }
    >
      {pulse ? (
        <div className="flex flex-col gap-4">
          <div>
            <p className="text-[14px] leading-5 text-foreground/90">{pulse.summary}</p>
            {!pulse.hasEnoughData ? (
              <p className="mt-2 text-[12px] text-muted-foreground">
                Historique insuffisant pour identifier une tendance : ce résumé décrit l'état actuel
                sans le comparer aux jours précédents.
              </p>
            ) : null}
          </div>

          {pulse.attention ? (
            <div className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/10 p-3">
              <TriangleAlert className="size-5 shrink-0 text-warning" aria-hidden="true" />
              <p className="text-[14px] text-foreground/90">{pulse.attention}</p>
            </div>
          ) : null}

          {pulse.recommendation ? (
            <div className="rounded-lg border border-border bg-surface p-4">
              <p className="text-[12px] font-medium uppercase tracking-wide text-muted-foreground">
                Recommandation
              </p>
              <p className="mt-1 text-[14px] text-foreground/90">{pulse.recommendation}</p>
            </div>
          ) : null}

          <div className="flex flex-wrap items-center justify-between gap-2 text-[12px] text-muted-foreground">
            <span>
              {pluralize(pulse.metrics.prospects7d, "prospect", "prospects")} (7 j) ·{" "}
              {pluralize(pulse.metrics.pushed7d, "envoyé au CRM", "envoyés au CRM")} ·{" "}
              {pluralize(
                pulse.metrics.pendingReviewTotal,
                "en attente de revue",
                "en attente de revue",
              )}
            </span>
            <span>Généré {formatRelativePulseDate(pulse.generatedAt)}</span>
          </div>
        </div>
      ) : null}
    </WidgetShell>
  );
}
