import { Link } from "@tanstack/react-router";
import { Sparkles, TriangleAlert } from "lucide-react";

import { EmptyState } from "@/components/common/empty-state";
import { WidgetShell } from "@/components/dashboard/widget-shell";
import { Button } from "@/components/ui/button";
import type { WidgetState } from "@/lib/dashboard/types";
import { formatRelativePulseDate } from "@/lib/pulse/meta";
import { usePulse } from "@/lib/pulse/queries";

/**
 * « Résumé du jour » de la fiche CEO Agent — le pulse du jour (`pulses`).
 * La génération reste sur Mission Control : la fiche la montre, elle ne la
 * déclenche pas.
 */
export function AgentPulseSection() {
  const pulseQuery = usePulse();
  const pulse = pulseQuery.data ?? null;

  const state: WidgetState = pulseQuery.isError
    ? "error"
    : pulseQuery.isPending
      ? "loading"
      : "success";

  return (
    <WidgetShell
      title="Résumé du jour"
      description={pulse ? `Généré ${formatRelativePulseDate(pulse.generatedAt)}` : undefined}
      icon={Sparkles}
      state={state}
      showMenu={false}
      onRetry={() => void pulseQuery.refetch()}
      emptyIcon={Sparkles}
      emptyTitle="Aucun résumé généré aujourd'hui"
    >
      {pulse ? (
        <div className="flex flex-col gap-4">
          <div>
            <p className="text-[14px] leading-6 text-foreground/90">{pulse.summary}</p>
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
        </div>
      ) : (
        <>
          <EmptyState
            icon={Sparkles}
            title="Aucun résumé généré aujourd'hui"
            description="Le résumé du jour se génère depuis Mission Control."
            className="py-10"
          />
          <div className="flex justify-center">
            <Button asChild size="sm" variant="secondary">
              <Link to="/">Ouvrir Mission Control</Link>
            </Button>
          </div>
        </>
      )}
    </WidgetShell>
  );
}
