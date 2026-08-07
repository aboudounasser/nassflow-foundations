import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TRIGGER_KIND, WORKFLOW_STATUS, formatRelative } from "@/lib/workflows/meta";
import type { Workflow } from "@/lib/workflows/types";
import { cn } from "@/lib/utils";

export function WorkflowCardSkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 @2xl:grid-cols-2 @5xl:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-[164px] rounded-lg" />
      ))}
    </div>
  );
}

export function WorkflowCard({
  workflow,
  selected = false,
  compact = false,
  onSelect,
}: {
  workflow: Workflow;
  selected?: boolean;
  compact?: boolean;
  onSelect?: (workflow: Workflow) => void;
}) {
  const status = WORKFLOW_STATUS[workflow.status];
  const trigger = TRIGGER_KIND[workflow.triggerKind];
  const TriggerIcon = trigger.icon;
  const StatusIcon = status.icon;

  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={() => onSelect?.(workflow)}
      className={cn(
        "flex w-full cursor-pointer flex-col gap-3 rounded-lg border bg-surface p-4 text-left transition-colors duration-150 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        selected ? "border-primary" : "border-border",
        compact && "gap-2 p-3",
      )}
    >
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-border bg-card">
          <TriggerIcon className="size-5 text-muted-foreground" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-medium text-foreground">{workflow.name}</p>
          <p className="truncate text-[12px] text-muted-foreground">{trigger.label}</p>
        </div>
      </div>

      {compact ? null : (
        <p className="line-clamp-2 text-[12px] leading-5 text-muted-foreground">
          {workflow.description}
        </p>
      )}

      <div className="flex flex-wrap gap-1">
        <Badge variant={status.variant}>
          <StatusIcon aria-hidden="true" />
          {status.label}
        </Badge>
        <Badge variant="neutral">{workflow.successRate}% de réussite</Badge>
        <Badge>{workflow.nodes.length} nœuds</Badge>
      </div>

      <p className="text-[12px] text-muted-foreground">
        Dernière exécution : {formatRelative(workflow.lastRunAt)}
      </p>
    </button>
  );
}
