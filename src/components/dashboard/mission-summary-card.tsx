import { CalendarClock } from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { ItemState } from "./item-state";
import { PRIORITY_BADGE } from "./decision-item-card";
import { MISSION_STATUS, formatDueDate } from "@/lib/missions/meta";
import type { Mission, WidgetState } from "@/lib/dashboard/types";
import type { MissionDetail } from "@/lib/missions/types";

export function MissionSummaryCard({
  mission,
  state = "success",
  onRetry,
  selected = false,
  compact = false,
  onSelect,
}: {
  mission: Mission | MissionDetail;
  state?: WidgetState;
  onRetry?: () => void;
  selected?: boolean;
  compact?: boolean;
  onSelect?: (mission: Mission | MissionDetail) => void;
}) {
  const fallback = ItemState({
    state,
    skeletonHeight: "h-28",
    onRetry,
    emptyTitle: "Aucune mission active",
  });
  if (fallback) return <>{fallback}</>;

  const priority = PRIORITY_BADGE[mission.priority];
  const status = MISSION_STATUS[mission.status];
  const StatusIcon = status.icon;

  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={() =>
        onSelect ? onSelect(mission) : toast(`Mission ouverte : ${mission.title}`)
      }
      className={cn(
        "w-full cursor-pointer rounded-lg border bg-surface text-left transition-colors duration-150 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        compact ? "p-3" : "p-4",
        selected ? "border-primary bg-primary/5" : "border-border",
      )}
    >
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
        <p className="min-w-0 truncate text-[14px] font-medium text-foreground">{mission.title}</p>
        <div className="flex shrink-0 flex-wrap justify-end gap-1">
          <Badge variant={priority.variant}>{priority.label}</Badge>
          <Badge variant={status.variant}>
            <StatusIcon aria-hidden="true" />
            {status.label}
          </Badge>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <Progress value={mission.progress} className="h-2 flex-1" />
        <span className="shrink-0 text-[12px] tabular-nums text-muted-foreground">
          {mission.progress}%
        </span>
      </div>

      {compact ? null : (
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
          Échéance : {formatDueDate(mission.dueDate)}
        </span>
      </div>
      )}
    </button>
  );
}
