import { Plus, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ItemState } from "./item-state";
import type { Insight, WidgetState } from "@/lib/dashboard/types";

export function InsightCard({
  insight,
  state = "success",
  onRetry,
}: {
  insight: Insight;
  state?: WidgetState;
  onRetry?: () => void;
}) {
  const fallback = ItemState({ state, skeletonHeight: "h-32", onRetry, emptyTitle: "Aucun insight généré" });
  if (fallback) return <>{fallback}</>;

  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
        <p className="min-w-0 text-[14px] font-medium leading-5 text-foreground">{insight.title}</p>
        <Badge variant="primary" className="shrink-0">
          <Sparkles /> {insight.confidenceScore}%
        </Badge>
      </div>
      <p className="mt-2 text-[14px] text-muted-foreground">{insight.summary}</p>
      <p className="mt-2 text-[12px] text-muted-foreground">
        <span className="text-foreground/80">Recommandation : </span>
        {insight.recommendation}
      </p>
      <Button
        variant="secondary"
        size="sm"
        className="mt-3"
        onClick={() => toast.success("Mission créée à partir de la recommandation")}
      >
        <Plus />
        Créer une Mission
      </Button>
    </div>
  );
}
