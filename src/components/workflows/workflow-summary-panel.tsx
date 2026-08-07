import { useNavigate } from "@tanstack/react-router";
import { Maximize2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  TRIGGER_KIND,
  WORKFLOW_STATUS,
  formatDuration,
  formatRelative,
} from "@/lib/workflows/meta";
import type { Workflow } from "@/lib/workflows/types";

/** Résumé compact d'un workflow — Context Panel global. */
export function WorkflowSummaryPanel({ workflow }: { workflow: Workflow }) {
  const status = WORKFLOW_STATUS[workflow.status];
  const trigger = TRIGGER_KIND[workflow.triggerKind];
  const StatusIcon = status.icon;
  const navigate = useNavigate();

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-5 p-6">
        <div className="min-w-0 space-y-1">
          <h3 className="text-[16px] font-medium text-foreground">{workflow.name}</h3>
          <p className="text-[14px] leading-6 text-muted-foreground">{workflow.description}</p>
        </div>

        <div className="flex flex-wrap gap-1">
          <Badge variant={status.variant}>
            <StatusIcon aria-hidden="true" />
            {status.label}
          </Badge>
          <Badge variant={trigger.variant}>{trigger.label}</Badge>
        </div>

        <Separator />

        <dl className="grid grid-cols-2 gap-3 text-[14px]">
          <div>
            <dt className="text-[12px] text-muted-foreground">Taux de réussite</dt>
            <dd className="tabular-nums text-foreground">{workflow.successRate}%</dd>
          </div>
          <div>
            <dt className="text-[12px] text-muted-foreground">Durée moyenne</dt>
            <dd className="tabular-nums text-foreground">
              {formatDuration(workflow.avgDurationMs || null)}
            </dd>
          </div>
          <div>
            <dt className="text-[12px] text-muted-foreground">Dernière exécution</dt>
            <dd className="text-foreground">{formatRelative(workflow.lastRunAt)}</dd>
          </div>
          <div>
            <dt className="text-[12px] text-muted-foreground">Nœuds</dt>
            <dd className="tabular-nums text-foreground">{workflow.nodes.length}</dd>
          </div>
          {workflow.scheduleExpression ? (
            <div className="col-span-2 min-w-0">
              <dt className="text-[12px] text-muted-foreground">Planification</dt>
              <dd className="text-foreground">{workflow.scheduleExpression}</dd>
            </div>
          ) : null}
          <div className="col-span-2">
            <dt className="text-[12px] text-muted-foreground">Missions liées</dt>
            <dd className="tabular-nums text-foreground">{workflow.relatedMissionIds.length}</dd>
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
              to: "/workflow-engine/$workflowId",
              params: { workflowId: workflow.id },
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
