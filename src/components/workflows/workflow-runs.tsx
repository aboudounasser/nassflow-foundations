import { Badge } from "@/components/ui/badge";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { RUN_STATUS, formatDuration, formatWorkflowDateTime } from "@/lib/workflows/meta";
import type { RunStatusFilter, WorkflowRun } from "@/lib/workflows/types";

const FILTERS: { value: RunStatusFilter; label: string }[] = [
  { value: "all", label: "Tous" },
  { value: "success", label: "Succès" },
  { value: "failure", label: "Échec" },
  { value: "running", label: "En cours" },
];

export function WorkflowRunList({
  runs,
  filter,
  onFilterChange,
}: {
  runs: WorkflowRun[];
  filter: RunStatusFilter;
  onFilterChange: (next: RunStatusFilter) => void;
}) {
  const sorted = [...runs].sort(
    (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime(),
  );
  const visible = filter === "all" ? sorted : sorted.filter((r) => r.status === filter);

  return (
    <div className="space-y-3">
      <ToggleGroup
        type="single"
        value={filter}
        onValueChange={(v) => v && onFilterChange(v as RunStatusFilter)}
        aria-label="Filtrer les exécutions par statut"
      >
        {FILTERS.map((f) => (
          <ToggleGroupItem key={f.value} value={f.value} aria-label={f.label}>
            {f.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>

      {visible.length === 0 ? (
        <p className="text-[14px] text-muted-foreground">
          Aucune exécution ne correspond à ce filtre.
        </p>
      ) : (
        <ol className="space-y-3">
          {visible.map((run) => {
            const meta = RUN_STATUS[run.status];
            const RunIcon = meta.icon;
            return (
              <li
                key={run.id}
                className="space-y-2 rounded-lg border border-border bg-card p-3"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={meta.variant}>
                    <RunIcon aria-hidden="true" />
                    {meta.label}
                  </Badge>
                  <span className="text-[14px] text-foreground">
                    {formatWorkflowDateTime(run.startedAt)}
                  </span>
                  <span className="text-[12px] tabular-nums text-muted-foreground">
                    Durée : {formatDuration(run.durationMs)}
                  </span>
                </div>
                <p className="text-[12px] text-muted-foreground">
                  Déclenché par {run.triggeredBy} · {run.nodesExecuted}/{run.nodesTotal} nœuds
                  exécutés
                </p>
                {run.errorMessage ? (
                  <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-[12px] leading-5 text-destructive">
                    {run.errorMessage}
                  </p>
                ) : null}
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}