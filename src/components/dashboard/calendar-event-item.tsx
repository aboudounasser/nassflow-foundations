import { Badge } from "@/components/ui/badge";
import { ItemState } from "./item-state";
import type { CalendarEvent, WidgetState } from "@/lib/dashboard/types";

const CATEGORY: Record<
  CalendarEvent["category"],
  { label: string; variant: "primary" | "destructive" | "info" }
> = {
  meeting: { label: "Réunion", variant: "primary" },
  deadline: { label: "Échéance", variant: "destructive" },
  reminder: { label: "Rappel", variant: "info" },
};

export function CalendarEventItem({
  event,
  state = "success",
  onRetry,
}: {
  event: CalendarEvent;
  state?: WidgetState;
  onRetry?: () => void;
}) {
  const fallback = ItemState({
    state,
    skeletonHeight: "h-14",
    onRetry,
    emptyTitle: "Aucun événement à venir",
  });
  if (fallback) return <>{fallback}</>;

  const category = CATEGORY[event.category];
  const date = new Date(event.startDate);

  return (
    <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-lg border border-border bg-surface p-3">
      <span className="w-14 shrink-0 text-[12px] tabular-nums text-muted-foreground">
        {date.toLocaleDateString("fr-FR", {
          day: "2-digit",
          month: "short",
          timeZone: "Europe/Paris",
        })}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-[14px] font-medium text-foreground">
          {event.title}
        </span>
        <span className="block text-[12px] text-muted-foreground">
          {date.toLocaleTimeString("fr-FR", {
            hour: "2-digit",
            minute: "2-digit",
            timeZone: "Europe/Paris",
          })}
        </span>
      </span>
      <Badge variant={category.variant} className="shrink-0">
        {category.label}
      </Badge>
    </div>
  );
}
