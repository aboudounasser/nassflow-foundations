import { MoreHorizontal, RefreshCw, TriangleAlert, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/empty-state";
import { cn } from "@/lib/utils";
import type { WidgetState } from "@/lib/dashboard/types";

export function WidgetMenu({ label }: { label: string }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="size-9 shrink-0" aria-label={`Options — ${label}`}>
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={() => toast.success(`${label} actualisé`)}>
          Actualiser
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => toast(`Export de « ${label} » lancé`)}>
          Exporter
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => toast(`Réglages de « ${label} »`)}>
          Configurer
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export interface WidgetProps {
  state?: WidgetState | undefined;
  onRetry?: (() => void) | undefined;
}

/**
 * Enveloppe commune des widgets du Dashboard CEO.
 * Gère explicitement les 4 états : loading / empty / error / success.
 */
export function WidgetShell({
  title,
  description,
  icon: Icon,
  state = "success",
  headerAction,
  showMenu = true,
  emptyIcon,
  emptyTitle,
  emptyDescription,
  emptyAction,
  onRetry,
  skeleton,
  className,
  contentClassName,
  children,
}: WidgetProps & {
  title: string;
  description?: string | undefined;
  icon?: LucideIcon | undefined;
  headerAction?: ReactNode;
  showMenu?: boolean | undefined;
  emptyIcon: LucideIcon;
  emptyTitle: string;
  emptyDescription?: string | undefined;
  emptyAction?: ReactNode;
  skeleton?: ReactNode;
  className?: string | undefined;
  contentClassName?: string | undefined;
  children: ReactNode;
}) {
  return (
    <Card className={cn("flex h-full flex-col", className)}>
      <CardHeader className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 pb-4">
        <div className="min-w-0">
          <CardTitle className="flex min-w-0 items-center gap-2">
            {Icon ? <Icon className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" /> : null}
            <span className="truncate">{title}</span>
          </CardTitle>
          {description ? <CardDescription className="mt-1">{description}</CardDescription> : null}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {headerAction}
          {showMenu ? <WidgetMenu label={title} /> : null}
        </div>
      </CardHeader>

      <CardContent className={cn("@container flex-1", contentClassName)}>
        {state === "loading" ? (
          (skeleton ?? (
            <div className="space-y-3">
              <Skeleton className="h-16 w-full rounded-lg" />
              <Skeleton className="h-16 w-full rounded-lg" />
              <Skeleton className="h-16 w-full rounded-lg" />
            </div>
          ))
        ) : state === "error" ? (
          <div className="flex flex-col items-center justify-center gap-3 px-6 py-10 text-center">
            <span className="flex size-12 items-center justify-center rounded-xl border border-destructive/30 bg-destructive/10">
              <TriangleAlert className="size-5 text-destructive" aria-hidden="true" />
            </span>
            <p className="text-[14px] text-muted-foreground">
              Impossible de charger « {title} ».
            </p>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                onRetry?.();
                toast(`Nouvelle tentative — ${title}`);
              }}
            >
              <RefreshCw />
              Réessayer
            </Button>
          </div>
        ) : state === "empty" ? (
          <EmptyState
            icon={emptyIcon}
            title={emptyTitle}
            description={emptyDescription}
            className="py-10"
          />
        ) : (
          children
        )}
        {state === "empty" && emptyAction ? (
          <div className="flex justify-center pb-2">{emptyAction}</div>
        ) : null}
      </CardContent>
    </Card>
  );
}
