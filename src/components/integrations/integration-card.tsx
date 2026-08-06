import { Plug } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  INTEGRATION_STATUS,
  formatSyncRelative,
  integrationInitials,
} from "@/lib/integrations/meta";
import { agentsUsingIntegration } from "@/lib/integrations/mocks";
import type { Integration } from "@/lib/integrations/types";
import { cn } from "@/lib/utils";

export function IntegrationCardSkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 @2xl:grid-cols-2 @5xl:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-[168px] rounded-lg" />
      ))}
    </div>
  );
}

export function IntegrationCard({
  integration,
  selected = false,
  compact = false,
  onSelect,
}: {
  integration: Integration;
  selected?: boolean;
  compact?: boolean;
  onSelect?: (integration: Integration) => void;
}) {
  const status = INTEGRATION_STATUS[integration.status];
  const StatusIcon = status.icon;
  const agentCount = agentsUsingIntegration(integration.name).length;
  const notInstalled = integration.status === "not_installed";

  return (
    <div
      className={cn(
        "flex w-full flex-col gap-3 rounded-lg border bg-surface p-4 transition-colors duration-150",
        selected ? "border-primary" : "border-border",
        compact && "gap-2 p-3",
      )}
    >
      <button
        type="button"
        aria-pressed={selected}
        onClick={() => onSelect?.(integration)}
        className="flex cursor-pointer flex-col gap-3 rounded-lg text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-border bg-card text-[12px] font-medium text-muted-foreground">
            {integrationInitials(integration.name) || <Plug className="size-5" />}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[14px] font-medium text-foreground">{integration.name}</p>
            <p className="truncate text-[12px] text-muted-foreground">{integration.category}</p>
          </div>
        </div>

        {compact ? null : (
          <p className="line-clamp-2 text-[12px] leading-5 text-muted-foreground">
            {integration.description}
          </p>
        )}

        <div className="flex flex-wrap gap-1">
          <Badge variant={status.variant}>
            <StatusIcon aria-hidden="true" />
            {status.label}
          </Badge>
          <Badge variant="info">{integration.category}</Badge>
          {agentCount > 0 ? (
            <Badge variant="primary">
              {agentCount} agent{agentCount > 1 ? "s" : ""}
            </Badge>
          ) : null}
        </div>

        <p className="text-[12px] text-muted-foreground">
          {notInstalled
            ? "Disponible dans le catalogue"
            : `Dernière synchro : ${formatSyncRelative(integration.lastSyncAt)}`}
        </p>
      </button>

      {notInstalled ? (
        <Button
          variant="secondary"
          size="sm"
          className="self-start"
          onClick={() => toast.success(`Connexion de ${integration.name} (mock)`)}
        >
          <Plug />
          Connecter
        </Button>
      ) : null}
    </div>
  );
}