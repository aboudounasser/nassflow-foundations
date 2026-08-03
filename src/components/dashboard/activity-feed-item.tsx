import { Bot, Cpu, User } from "lucide-react";

import { ItemState } from "./item-state";
import type { ActivityEvent, WidgetState } from "@/lib/dashboard/types";

const ACTOR_ICON = { agent: Bot, user: User, system: Cpu } as const;

export function ActivityFeedItem({
  event,
  state = "success",
  onRetry,
}: {
  event: ActivityEvent;
  state?: WidgetState;
  onRetry?: () => void;
}) {
  const fallback = ItemState({
    state,
    skeletonHeight: "h-10",
    onRetry,
    emptyTitle: "Aucune activité récente",
  });
  if (fallback) return <>{fallback}</>;

  const Icon = ACTOR_ICON[event.actorType];

  return (
    <li className="grid grid-cols-[auto_auto_minmax(0,1fr)] items-start gap-3 py-2">
      <span className="w-10 shrink-0 pt-0.5 text-[12px] tabular-nums text-muted-foreground">
        {event.timestamp}
      </span>
      <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md border border-border bg-surface">
        <Icon className="size-3.5 text-muted-foreground" aria-hidden="true" />
      </span>
      <p className="min-w-0 text-[14px] leading-5 text-muted-foreground">
        <span className="text-foreground">{event.actor}</span> {event.action} —{" "}
        <span className="text-foreground/80">{event.resource}</span>
      </p>
    </li>
  );
}
