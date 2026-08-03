import { CalendarClock } from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ItemState } from "./item-state";
import { PRIORITY_BADGE } from "./decision-item-card";
import type { Mission, WidgetState } from "@/lib/dashboard/types";

const STATUS: Record<
  Mission["status"],
  { label: string; variant: "neutral" | "primary" | "warning" | "success" }
> = {
  todo: { label: "À faire", variant: "neutral" },
  running: { label: "En cours", variant: "primary" },
  blocked: { label: "Bloquée", variant: "warning" },
  done: { label: "Terminée", variant: "success" },
};

export function MissionSummaryCard({
  mission,
  state = "success",
  onRetry,
}: {
  mission: Mission;
  state?: WidgetState;
  onRetry?: () => void;
}) {
  const fallback = ItemState({
    state,
    skeletonHeight: "h-28",
    onRetry,
    emptyTitle: "Aucune mission active",
  });
  if (fallback) return <>{fallback}</>;

  const priority = PRIORITY_BADGE[mission.priority];
  const status = STATUS[mission.status];

  return (
    <button
      type="button"
      onClick={() => toast(`Mission ouverte : ${mission.title}`)}
      className="w-full cursor-pointer rounded-lg border border-border bg-surface p-4 text-left transition-colors duration-150 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
        <p className="min-w-0 truncate text-[14px] font-medium text-foreground">{mission.title}</p>
        <div className="flex shrink-0 gap-1">
          <Badge variant={priority.variant}>{priority.label}</Badge>
          <Badge variant={status.variant}>{status.label}</Badge>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <Progress value={mission.progress} className="h-2 flex-1" />
        <span className="shrink-0 text-[12px] tabular-nums text-muted-foreground">
          {mission.progress}%
        </span>
      </div>

      <div className="mt-3 grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3">
        <div className="flex -space-x-2">
          {mission.agents.map((agent) => (
            <Avatar key={agent.id} className="size-7 border-2 border-surface" title={agent.name}>
              <AvatarFallback className="text-[10px]">{agent.avatar}</AvatarFallback>
            </Avatar>
          ))}
        </div>
        <span className="flex min-w-0 items-center gap-1 truncate text-[12px] text-muted-foreground">
          <CalendarClock className="size-4 shrink-0" aria-hidden="true" />
          Échéance : {mission.dueDate}
        </span>
      </div>
    </button>
  );
}
