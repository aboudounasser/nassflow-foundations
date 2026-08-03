import { Target } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ItemState } from "./item-state";
import { PRIORITY_BADGE } from "./decision-item-card";
import type { Opportunity, WidgetState } from "@/lib/dashboard/types";

const EFFORT: Record<Opportunity["effort"], string> = {
  low: "Effort faible",
  medium: "Effort moyen",
  high: "Effort élevé",
};

export function OpportunityCard({
  opportunity,
  state = "success",
  onRetry,
}: {
  opportunity: Opportunity;
  state?: WidgetState;
  onRetry?: () => void;
}) {
  const fallback = ItemState({
    state,
    skeletonHeight: "h-28",
    onRetry,
    emptyTitle: "Aucune opportunité détectée",
  });
  if (fallback) return <>{fallback}</>;

  const priority = PRIORITY_BADGE[opportunity.priority];

  return (
    <div className="rounded-lg border border-border bg-surface p-4 transition-colors duration-150 hover:bg-accent">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
        <p className="min-w-0 text-[14px] font-medium leading-5 text-foreground">
          {opportunity.title}
        </p>
        <Badge variant={priority.variant} className="shrink-0">
          {priority.label}
        </Badge>
      </div>
      <p className="mt-2 text-[14px] text-muted-foreground">{opportunity.description}</p>
      <div className="mt-3 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <span className="min-w-0 truncate text-[12px] text-muted-foreground">
          <span className="text-success">{opportunity.estimatedImpact}</span> ·{" "}
          {EFFORT[opportunity.effort]} · confiance {opportunity.confidenceScore}%
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="h-9 shrink-0 px-2"
          onClick={() => toast.success(`Opportunité saisie : ${opportunity.title}`)}
        >
          <Target />
          Saisir
        </Button>
      </div>
    </div>
  );
}
