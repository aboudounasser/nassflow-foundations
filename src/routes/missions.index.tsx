import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Plus, Target, TriangleAlert } from "lucide-react";
import { useMemo, useState } from "react";

import { EmptyState } from "@/components/common/empty-state";
import { ModuleToolbar } from "@/components/common/module-toolbar";
import { WidgetShell } from "@/components/dashboard/widget-shell";
import { useContextPanel, useContextPanelContent } from "@/components/layout/context-panel";
import { ModulePage } from "@/components/layout/page-header";
import { MissionBuilderDialog } from "@/components/missions/mission-builder-dialog";
import { MissionDetailPanel } from "@/components/missions/mission-detail-panel";
import {
  MissionCalendarView,
  MissionKanbanSkeleton,
  MissionKanbanView,
  MissionListSkeleton,
  MissionListView,
} from "@/components/missions/mission-views";
import { GmailScanSection } from "@/components/scans/gmail-scan-section";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useMissions } from "@/lib/missions/queries";
import { MISSION_VIEWS, PRIORITY_WEIGHT, missionFilterDescriptors } from "@/lib/missions/meta";
import type { MissionDetail, MissionFilters, MissionView } from "@/lib/missions/types";

const DESCRIPTION =
  "Pilotez les missions confiées aux agents IA : liste, kanban, calendrier et fiche détaillée.";

export const Route = createFileRoute("/missions/")({
  head: () => ({
    meta: [
      { title: "Missions — NASSFLOW OS" },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: "Missions — NASSFLOW OS" },
      { property: "og:description", content: DESCRIPTION },
    ],
  }),
  validateSearch: (search: Record<string, unknown>): { new?: boolean | undefined } => ({
    new: search["new"] === true || search["new"] === "true" ? true : undefined,
  }),
  component: Page,
});

const DEFAULT_FILTERS: MissionFilters = {
  search: "",
  statuses: [],
  priority: "all",
  agentId: "all",
  sort: "dueDate",
};

function Page() {
  const [filters, setFilters] = useState<MissionFilters>(DEFAULT_FILTERS);
  const [view, setView] = useState<MissionView>("list");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { new: openBuilder } = Route.useSearch();
  const [dialogOpen, setDialogOpen] = useState(openBuilder === true);
  const navigate = useNavigate();
  const handleDialogChange = (open: boolean) => {
    setDialogOpen(open);
    if (!open && openBuilder) {
      void navigate({ to: "/missions", search: {}, replace: true });
    }
  };
  const { requestOpen } = useContextPanel();

  const missionsQuery = useMissions();
  const agents = useMemo(() => missionsQuery.data?.agents ?? [], [missionsQuery.data]);
  const allMissions = useMemo(() => missionsQuery.data?.missions ?? [], [missionsQuery.data]);
  const descriptors = useMemo(() => missionFilterDescriptors(agents), [agents]);

  const missions = useMemo(() => {
    const query = filters.search.trim().toLowerCase();
    const filtered = allMissions.filter((mission) => {
      if (
        query &&
        !mission.title.toLowerCase().includes(query) &&
        !mission.tags.some((tag) => tag.toLowerCase().includes(query))
      )
        return false;
      if (filters.statuses.length > 0) {
        if (!filters.statuses.includes(mission.status)) return false;
        // Un statut explicitement sélectionné (y compris "Archivée") prime sur la règle par défaut ci-dessous.
      } else if (mission.status === "archived") {
        return false;
      }
      if (filters.priority !== "all" && mission.priority !== filters.priority) return false;
      if (filters.agentId !== "all" && !mission.agents.some((a) => a.id === filters.agentId))
        return false;
      return true;
    });

    return [...filtered].sort((a, b) => {
      if (filters.sort === "priority")
        return (PRIORITY_WEIGHT[a.priority] ?? 9) - (PRIORITY_WEIGHT[b.priority] ?? 9);
      if (filters.sort === "progress") return b.progress - a.progress;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });
  }, [filters, allMissions]);

  const selected = missions.find((m) => m.id === selectedId) ?? null;

  useContextPanelContent(
    () => (selected ? <MissionDetailPanel mission={selected} allMissions={allMissions} /> : null),
    [selected?.id, allMissions],
  );

  const handleSelect = (mission: MissionDetail) => {
    setSelectedId(mission.id);
    requestOpen();
  };

  const widgetState = missionsQuery.isError
    ? "error"
    : missionsQuery.isPending
      ? "loading"
      : missions.length === 0
        ? "empty"
        : "success";

  // Les analyses Gmail ne dépendent pas des missions : un échec de lecture de
  // ces dernières ne doit pas emporter la section avec lui.
  if (missionsQuery.isError) {
    return (
      <>
        <section className="col-span-12">
          <GmailScanSection />
        </section>

        <section className="col-span-12 min-w-0">
          <Card className="border-border bg-card p-4">
            <EmptyState
              icon={TriangleAlert}
              title="Impossible de charger les Missions"
              description="Les missions n'ont pas pu être récupérées. Vérifiez votre connexion puis réessayez."
            />
            <div className="flex justify-center">
              <Button type="button" size="sm" onClick={() => void missionsQuery.refetch()}>
                Réessayer
              </Button>
            </div>
          </Card>
        </section>
      </>
    );
  }

  return (
    <>
      <ModulePage title="Missions" description={DESCRIPTION} />

      <section className="col-span-12">
        <GmailScanSection />
      </section>

      <section className="col-span-12">
        <ModuleToolbar
          filters={filters}
          onChange={setFilters}
          onReset={() => setFilters(DEFAULT_FILTERS)}
          searchKey="search"
          searchPlaceholder="Rechercher une mission ou un tag…"
          searchAriaLabel="Rechercher une mission"
          descriptors={descriptors}
          views={MISSION_VIEWS}
          view={view}
          onViewChange={(v) => setView(v as MissionView)}
          resultCount={missions.length}
          resultLabel={(n) => `${n} mission${n > 1 ? "s" : ""}`}
          actions={
            <Button onClick={() => setDialogOpen(true)}>
              <Plus />
              Créer une Mission
            </Button>
          }
        />
      </section>

      <section className="col-span-12">
        <WidgetShell
          title={
            view === "list" ? "Vue Liste" : view === "kanban" ? "Vue Kanban" : "Vue Calendrier"
          }
          icon={Target}
          state={widgetState}
          showMenu={false}
          emptyIcon={Target}
          emptyTitle="Aucune mission ne correspond à ces critères"
          emptyAction={
            <Button variant="secondary" size="sm" onClick={() => setFilters(DEFAULT_FILTERS)}>
              Réinitialiser les filtres
            </Button>
          }
          skeleton={view === "kanban" ? <MissionKanbanSkeleton /> : <MissionListSkeleton />}
        >
          {view === "list" ? (
            <MissionListView missions={missions} selectedId={selectedId} onSelect={handleSelect} />
          ) : view === "kanban" ? (
            <MissionKanbanView
              missions={missions}
              selectedId={selectedId}
              onSelect={handleSelect}
            />
          ) : (
            <MissionCalendarView
              missions={missions}
              selectedId={selectedId}
              onSelect={handleSelect}
            />
          )}
        </WidgetShell>
      </section>

      <MissionBuilderDialog
        open={dialogOpen}
        onOpenChange={handleDialogChange}
        agents={agents}
        blueprints={missionsQuery.data?.blueprints ?? []}
      />
    </>
  );
}
