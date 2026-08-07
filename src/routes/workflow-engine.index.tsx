import { createFileRoute } from "@tanstack/react-router";
import { Workflow as WorkflowIcon } from "lucide-react";
import { useMemo, useState } from "react";

import { WidgetShell } from "@/components/dashboard/widget-shell";
import { useContextPanel, useContextPanelContent } from "@/components/layout/context-panel";
import { ModulePage } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { WorkflowCard, WorkflowCardSkeletonGrid } from "@/components/workflows/workflow-card";
import {
  WorkflowOverview,
  WorkflowOverviewSkeleton,
} from "@/components/workflows/workflow-overview";
import { WorkflowSummaryPanel } from "@/components/workflows/workflow-summary-panel";
import { WorkflowToolbar, type WorkflowFilters } from "@/components/workflows/workflow-toolbar";
import { workflowsMock } from "@/lib/workflows/mocks";
import type { Workflow, WorkflowView } from "@/lib/workflows/types";

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
  // État du module : loading / error / success (mock statique).
  const [state] = useState<"loading" | "error" | "success">("success");
  const { requestOpen } = useContextPanel();

  const workflows = useMemo(() => {
    const query = filters.search.trim().toLowerCase();
    const list = workflowsMock.filter((w) => {
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

    return list.sort((a, b) => {
      if (filters.sort === "name") return a.name.localeCompare(b.name, "fr");
      if (filters.sort === "successRate") return b.successRate - a.successRate;
      const at = a.lastRunAt ? new Date(a.lastRunAt).getTime() : 0;
      const bt = b.lastRunAt ? new Date(b.lastRunAt).getTime() : 0;
      return bt - at;
    });
  }, [filters]);

  const selected = workflowsMock.find((w) => w.id === selectedId) ?? null;

  useContextPanelContent(
    () => (selected ? <WorkflowSummaryPanel workflow={selected} /> : null),
    [selected?.id],
  );

  const handleSelect = (workflow: Workflow) => {
    setSelectedId(workflow.id);
    requestOpen();
  };

  const widgetState = state === "success" ? (workflows.length === 0 ? "empty" : "success") : state;

  return (
    <>
      <ModulePage title="Workflow Engine" description={DESCRIPTION} />

      <section className="col-span-12 min-w-0">
        {state === "loading" ? (
          <WorkflowOverviewSkeleton />
        ) : (
          <WorkflowOverview workflows={workflowsMock} />
        )}
      </section>

      <section className="col-span-12 min-w-0">
        <WorkflowToolbar
          filters={filters}
          onChange={setFilters}
          view={view}
          onViewChange={setView}
          onReset={() => setFilters(DEFAULT_FILTERS)}
          resultCount={workflows.length}
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
