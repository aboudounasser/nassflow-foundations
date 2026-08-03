import { FileText, Gavel, Plug, ShieldCheck, Target } from "lucide-react";

import { ItemState } from "./item-state";
import type { HistoryEvent, WidgetState } from "@/lib/dashboard/types";

const TYPE_ICON = {
  mission: Target,
  decision: Gavel,
  integration: Plug,
  security: ShieldCheck,
  report: FileText,
} as const;

export function HistoryEventItem({
  event,
  state = "success",
  onRetry,
}: {
  event: HistoryEvent;
  state?: WidgetState;
  onRetry?: () => void;
}) {
  const fallback = ItemState({ state, skeletonHeight: "h-12", onRetry, emptyTitle: "Aucun historique" });
  if (fallback) return <>{fallback}</>;

  const Icon = TYPE_ICON[event.type];

  return (
    <li className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 py-2">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-md border border-border bg-surface">
        <Icon className="size-4 text-muted-foreground" aria-hidden="true" />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-[14px] text-foreground">{event.title}</span>
        <span className="block truncate text-[12px] text-muted-foreground">{event.actor}</span>
      </span>
      <span className="shrink-0 text-[12px] text-muted-foreground">{event.timestamp}</span>
    </li>
  );
}
