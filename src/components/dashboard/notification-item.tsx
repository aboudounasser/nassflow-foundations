import { CheckCircle2, Info, OctagonAlert, TriangleAlert } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { ItemState } from "./item-state";
import type { AppNotification, WidgetState } from "@/lib/dashboard/types";

const TYPE = {
  info: { icon: Info, tone: "text-info" },
  success: { icon: CheckCircle2, tone: "text-success" },
  warning: { icon: TriangleAlert, tone: "text-warning" },
  critical: { icon: OctagonAlert, tone: "text-destructive" },
} as const;

export function NotificationItem({
  notification,
  state = "success",
  onRetry,
}: {
  notification: AppNotification;
  state?: WidgetState;
  onRetry?: () => void;
}) {
  const fallback = ItemState({ state, skeletonHeight: "h-16", onRetry, emptyTitle: "Aucune notification" });
  if (fallback) return <>{fallback}</>;

  const { icon: Icon, tone } = TYPE[notification.type];

  return (
    <button
      type="button"
      onClick={() => toast(`Notification : ${notification.title}`)}
      className="grid w-full cursor-pointer grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-3 rounded-lg border border-border bg-surface p-3 text-left transition-colors duration-150 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Icon className={`mt-0.5 size-4 shrink-0 ${tone}`} aria-hidden="true" />
      <span className="min-w-0">
        <span className="block truncate text-[14px] font-medium text-foreground">
          {notification.title}
        </span>
        <span className="block truncate text-[12px] text-muted-foreground">
          {notification.description}
        </span>
      </span>
      {!notification.read ? (
        <Badge variant="primary" className="shrink-0">
          Non lu
        </Badge>
      ) : null}
    </button>
  );
}
