import { Minus, TrendingDown, TrendingUp } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ItemState } from "./item-state";
import type { HealthCategory, WidgetState } from "@/lib/dashboard/types";

const STATUS_LABEL: Record<HealthCategory["status"], string> = {
  success: "Excellent",
  info: "Bon",
  warning: "À surveiller",
  destructive: "Critique",
};

export function HealthCategoryCard({
  category,
  state = "success",
  onRetry,
}: {
  category: HealthCategory;
  state?: WidgetState;
  onRetry?: () => void;
}) {
  const fallback = ItemState({ state, skeletonHeight: "h-16", onRetry, emptyTitle: "Domaine indisponible" });
  if (fallback) return <>{fallback}</>;

  const TrendIcon =
    category.trend === "up" ? TrendingUp : category.trend === "down" ? TrendingDown : Minus;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="rounded-lg border border-border bg-surface p-4 transition-colors duration-150 hover:bg-accent">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
            <span className="truncate text-[14px] font-medium text-foreground">{category.name}</span>
            <Badge variant={category.status} className="shrink-0">
              <TrendIcon />
              {STATUS_LABEL[category.status]}
            </Badge>
          </div>
          <div className="mt-3 flex items-center gap-3">
            <Progress value={category.score} className="h-2 flex-1" />
            <span className="shrink-0 text-[12px] tabular-nums text-muted-foreground">
              {category.score}/100
            </span>
          </div>
        </div>
      </TooltipTrigger>
      <TooltipContent>{category.recommendation}</TooltipContent>
    </Tooltip>
  );
}
