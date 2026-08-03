import { Inbox, RefreshCw, TriangleAlert, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { EmptyState } from "@/components/common/empty-state";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { WidgetState } from "@/lib/dashboard/types";

/**
 * Rend les états loading / empty / error d'un item, ou `null` si l'état est "success"
 * (le composant appelant affiche alors son contenu normal).
 */
export function ItemState({
  state = "success",
  skeletonHeight = "h-20",
  emptyIcon = Inbox,
  emptyTitle = "Aucun élément",
  emptyDescription,
  onRetry,
}: {
  state?: WidgetState | undefined;
  skeletonHeight?: string | undefined;
  emptyIcon?: LucideIcon | undefined;
  emptyTitle?: string | undefined;
  emptyDescription?: string | undefined;
  onRetry?: (() => void) | undefined;
}): ReactNode {
  if (state === "loading") return <Skeleton className={`w-full rounded-lg ${skeletonHeight}`} />;
  if (state === "empty")
    return (
      <EmptyState
        icon={emptyIcon}
        title={emptyTitle}
        description={emptyDescription}
        className="py-6"
      />
    );
  if (state === "error")
    return (
      <div className="flex items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
        <span className="flex min-w-0 items-center gap-2 text-[14px] text-muted-foreground">
          <TriangleAlert className="size-4 shrink-0 text-destructive" aria-hidden="true" />
          <span className="truncate">Chargement impossible.</span>
        </span>
        <Button variant="ghost" size="sm" className="h-9 shrink-0 px-2" onClick={onRetry}>
          <RefreshCw />
          Réessayer
        </Button>
      </div>
    );
  return null;
}
