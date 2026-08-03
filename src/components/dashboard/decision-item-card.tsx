import { Check, Clock, Pencil, Sparkles, X } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ItemState } from "./item-state";
import type { Decision, Priority, WidgetState } from "@/lib/dashboard/types";

export const PRIORITY_BADGE: Record<Priority, { label: string; variant: "neutral" | "info" | "warning" | "destructive" }> = {
  low: { label: "Basse", variant: "neutral" },
  medium: { label: "Moyenne", variant: "info" },
  high: { label: "Haute", variant: "warning" },
  critical: { label: "Critique", variant: "destructive" },
};

export function DecisionItemCard({
  decision,
  state = "success",
  onRetry,
}: {
  decision: Decision;
  state?: WidgetState;
  onRetry?: () => void;
}) {
  const fallback = ItemState({ state, skeletonHeight: "h-40", onRetry, emptyTitle: "Aucune décision en attente" });
  if (fallback) return <>{fallback}</>;

  const priority = PRIORITY_BADGE[decision.priority];

  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
        <p className="min-w-0 text-[14px] font-medium leading-5 text-foreground">{decision.title}</p>
        <Badge variant={priority.variant} className="shrink-0">
          {priority.label}
        </Badge>
      </div>

      <p className="mt-2 text-[12px] text-muted-foreground">
        {decision.category} · {decision.impact}
      </p>

      <p className="mt-3 flex items-start gap-2 text-[14px] text-muted-foreground">
        <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
        <span>
          {decision.recommendation}{" "}
          <span className="text-foreground/70">(confiance {decision.confidenceScore}%)</span>
        </span>
      </p>

      <p className="mt-2 flex items-center gap-2 text-[12px] text-muted-foreground">
        <Clock className="size-4 shrink-0" aria-hidden="true" />
        Échéance : {decision.dueDate}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          variant="success"
          size="sm"
          onClick={() => toast.success(`Décision validée : ${decision.title}`)}
        >
          <Check />
          Valider
        </Button>
        <Button variant="secondary" size="sm" onClick={() => toast(`Modification : ${decision.title}`)}>
          <Pencil />
          Modifier
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => toast.error(`Décision rejetée : ${decision.title}`)}
        >
          <X />
          Rejeter
        </Button>
      </div>
    </div>
  );
}
