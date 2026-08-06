import { useNavigate } from "@tanstack/react-router";
import { Maximize2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  INTEGRATION_STATUS,
  formatIntegrationDate,
  formatSyncRelative,
  integrationInitials,
} from "@/lib/integrations/meta";
import { agentsUsingIntegration } from "@/lib/integrations/mocks";
import type { Integration } from "@/lib/integrations/types";

/** Résumé compact d'une intégration — Context Panel global. */
export function IntegrationSummaryPanel({ integration }: { integration: Integration }) {
  const status = INTEGRATION_STATUS[integration.status];
  const StatusIcon = status.icon;
  const usages = agentsUsingIntegration(integration.name);
  const granted = integration.permissions.filter((p) => p.granted).length;
  const navigate = useNavigate();

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-5 p-6">
        <div className="flex items-start gap-3">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-border bg-card text-[14px] font-medium text-muted-foreground">
            {integrationInitials(integration.name)}
          </span>
          <div className="min-w-0">
            <h3 className="truncate text-[16px] font-medium text-foreground">{integration.name}</h3>
            <p className="truncate text-[14px] text-muted-foreground">{integration.category}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-1">
          <Badge variant={status.variant}>
            <StatusIcon aria-hidden="true" />
            {status.label}
          </Badge>
          <Badge variant="info">{integration.category}</Badge>
        </div>

        <p className="text-[14px] leading-6 text-muted-foreground">{integration.description}</p>

        <Separator />

        <dl className="grid grid-cols-2 gap-3 text-[14px]">
          <div>
            <dt className="text-[12px] text-muted-foreground">Fréquence</dt>
            <dd className="text-foreground">{integration.syncFrequency ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-[12px] text-muted-foreground">Dernière synchro</dt>
            <dd className="text-foreground">{formatSyncRelative(integration.lastSyncAt)}</dd>
          </div>
          <div>
            <dt className="text-[12px] text-muted-foreground">Connectée depuis</dt>
            <dd className="text-foreground">{formatIntegrationDate(integration.connectedSince)}</dd>
          </div>
          <div>
            <dt className="text-[12px] text-muted-foreground">Permissions accordées</dt>
            <dd className="tabular-nums text-foreground">
              {granted}/{integration.permissions.length}
            </dd>
          </div>
          <div className="col-span-2">
            <dt className="text-[12px] text-muted-foreground">Agents connectés</dt>
            <dd className="tabular-nums text-foreground">{usages.length}</dd>
          </div>
        </dl>
      </div>

      <div className="border-t border-border p-4">
        <Button
          variant="secondary"
          size="sm"
          className="w-full"
          onClick={() =>
            navigate({
              to: "/integrations-hub/$integrationId",
              params: { integrationId: integration.id },
            })
          }
        >
          <Maximize2 />
          Voir le détail
        </Button>
      </div>
    </div>
  );
}