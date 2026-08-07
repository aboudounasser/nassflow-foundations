import { createFileRoute } from "@tanstack/react-router";
import { Bot } from "lucide-react";
import { useMemo, useState } from "react";

import { AgentCard, AgentCardSkeletonGrid } from "@/components/agents/agent-card";
import { AgentSummaryPanel } from "@/components/agents/agent-summary-panel";
import { AgentsOverview, AgentsOverviewSkeleton } from "@/components/agents/agents-overview";
import { GRID_LIST_VIEWS, ModuleToolbar } from "@/components/common/module-toolbar";
import { WidgetShell } from "@/components/dashboard/widget-shell";
import { useContextPanel, useContextPanelContent } from "@/components/layout/context-panel";
import { ModulePage } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { agentsDetailMock, missionsOfAgent } from "@/lib/agents/mocks";
import { AGENT_FILTER_DESCRIPTORS } from "@/lib/agents/meta";
import type { AgentDetail, AgentFilters, AgentView } from "@/lib/agents/types";
import { missionsDetailMock } from "@/lib/missions/mocks";

const DESCRIPTION =
  "Pilotez la workforce IA de NASSFLOW OS : rôles, capacités, outils, permissions et missions de chaque collaborateur IA.";

export const Route = createFileRoute("/agents/")({
  head: () => ({
    meta: [
      { title: "AI Workforce — NASSFLOW OS" },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: "AI Workforce — NASSFLOW OS" },
      { property: "og:description", content: DESCRIPTION },
    ],
  }),
  component: Page,
});

const DEFAULT_FILTERS: AgentFilters = {
  search: "",
  domain: "all",
  status: "all",
  sort: "name",
};

function Page() {
  const [filters, setFilters] = useState<AgentFilters>(DEFAULT_FILTERS);
  const [view, setView] = useState<AgentView>("grid");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // État du module : loading / error / success (mock statique).
  const [state] = useState<"loading" | "error" | "success">("success");
  const { requestOpen } = useContextPanel();

  const agents = useMemo(() => {
    const query = filters.search.trim().toLowerCase();
    const filtered = agentsDetailMock.filter((agent) => {
      if (
        query &&
        !agent.name.toLowerCase().includes(query) &&
        !agent.role.toLowerCase().includes(query) &&
        !agent.domain.toLowerCase().includes(query)
      )
        return false;
      if (filters.domain !== "all" && agent.domain !== filters.domain) return false;
      if (filters.status !== "all" && agent.status !== filters.status) return false;
      return true;
    });

    return [...filtered].sort((a, b) => {
      if (filters.sort === "confidence") return b.confidenceScore - a.confidenceScore;
      if (filters.sort === "activity")
        return new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime();
      return a.name.localeCompare(b.name, "fr");
    });
  }, [filters]);

  const selected = agents.find((a) => a.id === selectedId) ?? null;

  useContextPanelContent(
    () =>
      selected ? (
        <AgentSummaryPanel agent={selected} missionCount={missionsOfAgent(selected.id).length} />
      ) : null,
    [selected?.id],
  );

  const handleSelect = (agent: AgentDetail) => {
    setSelectedId(agent.id);
    requestOpen();
  };

  const widgetState = state === "success" ? (agents.length === 0 ? "empty" : "success") : state;

  return (
    <>
      <ModulePage title="AI Workforce" description={DESCRIPTION} />

      <section className="col-span-12 min-w-0">
        {state === "loading" ? (
          <AgentsOverviewSkeleton />
        ) : (
          <AgentsOverview agents={agentsDetailMock} missions={missionsDetailMock} />
        )}
      </section>

      <section className="col-span-12 min-w-0">
        <ModuleToolbar
          filters={filters}
          onChange={setFilters}
          onReset={() => setFilters(DEFAULT_FILTERS)}
          searchKey="search"
          searchPlaceholder="Rechercher un agent, un rôle, un domaine…"
          searchAriaLabel="Rechercher un agent"
          descriptors={AGENT_FILTER_DESCRIPTORS}
          views={GRID_LIST_VIEWS}
          view={view}
          onViewChange={(v) => setView(v as AgentView)}
          resultCount={agents.length}
          resultLabel={(n) => `${n} agent${n > 1 ? "s" : ""}`}
        />
      </section>

      <section className="col-span-12 min-w-0">
        <WidgetShell
          title={view === "grid" ? "Vue Grille" : "Vue Liste"}
          icon={Bot}
          state={widgetState}
          showMenu={false}
          emptyIcon={Bot}
          emptyTitle="Aucun agent ne correspond à ces critères"
          emptyAction={
            <Button variant="secondary" size="sm" onClick={() => setFilters(DEFAULT_FILTERS)}>
              Réinitialiser les filtres
            </Button>
          }
          skeleton={<AgentCardSkeletonGrid />}
        >
          <div
            className={
              view === "grid"
                ? "grid grid-cols-1 gap-4 @2xl:grid-cols-2 @5xl:grid-cols-3"
                : "flex flex-col gap-3"
            }
          >
            {agents.map((agent) => (
              <AgentCard
                key={agent.id}
                agent={agent}
                selected={agent.id === selectedId}
                compact={view === "list"}
                missionCount={missionsOfAgent(agent.id).length}
                onSelect={handleSelect}
              />
            ))}
          </div>
        </WidgetShell>
      </section>
    </>
  );
}
