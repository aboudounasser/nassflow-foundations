import { createFileRoute } from "@tanstack/react-router";
import { TriangleAlert, Workflow as WorkflowIcon } from "lucide-react";
import { useMemo, useState } from "react";

import { EmptyState } from "@/components/common/empty-state";
import { WidgetShell } from "@/components/dashboard/widget-shell";
import { useContextPanel, useContextPanelContent } from "@/components/layout/context-panel";
import { ModulePage } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { WorkflowCard, WorkflowCardSkeletonGrid } from "@/components/workflows/workflow-card";
import {
  WorkflowOverview,
  WorkflowOverviewSkeleton,
} from "@/components/workflows/workflow-overview";
import { WorkflowSummaryPanel } from "@/components/workflows/workflow-summary-panel";
import { GRID_LIST_VIEWS, ModuleToolbar } from "@/components/common/module-toolbar";
import { WORKFLOW_FILTER_DESCRIPTORS } from "@/lib/workflows/meta";
import { useWorkflows } from "@/lib/workflows/queries";
import type { Workflow, WorkflowFilters, WorkflowView } from "@/lib/workflows/types";

const DESCRIPTION =
  "Le moteur technique de NASSFLOW OS : déclencheurs, conditions, actions et boucles qui exécutent les missions.";

export const Route = createFileRoute("/workflow-engine/")({
  head: () => ({
    meta: [
      { title: "Workflow Engine — NASSFLOW OS" },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: "Workflow Engine — NASSFLOW OS" },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

const DEFAULT_FILTERS: WorkflowFilters = {
  search: "",
  status: "all",
  trigger: "all",
  sort: "lastRun",
};

function Page() {
  const [filters, setFilters] = useState<WorkflowFilters>(DEFAULT_FILTERS);
  const [view, setView] = useState<WorkflowView>("grid");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { requestOpen } = useContextPanel();

  const workflowsQuery = useWorkflows();
  const allWorkflows = useMemo(
    () => workflowsQuery.data?.workflows ?? [],
    [workflowsQuery.data],
  );

  const workflows = useMemo(() => {
    const query = filters.search.trim().toLowerCase();
    const list = allWorkflows.filter((w) => {
      if (
        query &&
        !w.name.toLowerCase().includes(query) &&
        !w.description.toLowerCase().includes(query)
      )
        return false;
      if (filters.status !== "all" && w.status !== filters.status) return false;
      if (filters.trigger !== "all" && w.triggerKind !== filters.trigger) return false;
      return true;
    });

    return [...list].sort((a, b) => {
      if (filters.sort === "name") return a.name.localeCompare(b.name, "fr");
      if (filters.sort === "successRate") return b.successRate - a.successRate;
      const at = a.lastRunAt ? new Date(a.lastRunAt).getTime() : 0;
      const bt = b.lastRunAt ? new Date(b.lastRunAt).getTime() : 0;
      return bt - at;
    });
  }, [filters, allWorkflows]);

  const selected = allWorkflows.find((w) => w.id === selectedId) ?? null;

  useContextPanelContent(
    () => (selected ? <WorkflowSummaryPanel workflow={selected} /> : null),
    [selected?.id],
  );

  const handleSelect = (workflow: Workflow) => {
    setSelectedId(workflow.id);
    requestOpen();
  };

  const widgetState = workflowsQuery.isError
    ? "error"
    : workflowsQuery.isPending
      ? "loading"
      : workflows.length === 0
        ? "empty"
        : "success";

  if (workflowsQuery.isError) {
    return (
      <section className="col-span-12 min-w-0">
        <Card className="border-border bg-card p-4">
          <EmptyState
            icon={TriangleAlert}
            title="Impossible de charger le Workflow Engine"
            description="Les workflows n'ont pas pu être récupérés. Vérifiez votre connexion puis réessayez."
          />
          <div className="flex justify-center">
            <Button type="button" size="sm" onClick={() => void workflowsQuery.refetch()}>
              Réessayer
            </Button>
          </div>
        </Card>
      </section>
    );
  }

  return (
    <>
      <ModulePage title="Workflow Engine" description={DESCRIPTION} />

      <section className="col-span-12 min-w-0">
        {workflowsQuery.isPending || !workflowsQuery.data ? (
          <WorkflowOverviewSkeleton />
        ) : (
          <WorkflowOverview
            workflows={allWorkflows}
            runsLast24h={workflowsQuery.data.runsLast24h}
          />
        )}
      </section>

      <section className="col-span-12 min-w-0">
        <ModuleToolbar
          filters={filters}
          onChange={setFilters}
          onReset={() => setFilters(DEFAULT_FILTERS)}
          searchKey="search"
          searchPlaceholder="Rechercher un workflow, une description…"
          searchAriaLabel="Rechercher un workflow"
          descriptors={WORKFLOW_FILTER_DESCRIPTORS}
          views={GRID_LIST_VIEWS}
          view={view}
          onViewChange={(v) => setView(v as WorkflowView)}
          resultCount={workflows.length}
          resultLabel={(n) => `${n} workflow${n > 1 ? "s" : ""}`}
        />
      </section>

      <section className="col-span-12 min-w-0">
        <WidgetShell
          title={view === "grid" ? "Vue Grille" : "Vue Liste"}
          icon={WorkflowIcon}
          state={widgetState}
          showMenu={false}
          emptyIcon={WorkflowIcon}
          emptyTitle="Aucun workflow ne correspond à ces critères"
          emptyAction={
            <Button variant="secondary" size="sm" onClick={() => setFilters(DEFAULT_FILTERS)}>
              Réinitialiser les filtres
            </Button>
          }
          skeleton={<WorkflowCardSkeletonGrid />}
        >
          <div
            className={
              view === "grid"
                ? "grid grid-cols-1 gap-4 @2xl:grid-cols-2 @5xl:grid-cols-3"
                : "flex flex-col gap-3"
            }
          >
            {workflows.map((workflow) => (
              <WorkflowCard
                key={workflow.id}
                workflow={workflow}
                selected={workflow.id === selectedId}
                compact={view === "list"}
                onSelect={handleSelect}
              />
            ))}
          </div>
        </WidgetShell>
      </section>
    </>
  );
}
