import { createFileRoute } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, Lock, Target, TriangleAlert } from "lucide-react";
import { useMemo, useState } from "react";

import { EmptyState } from "@/components/common/empty-state";
import { ModuleToolbar } from "@/components/common/module-toolbar";
import { WidgetShell } from "@/components/dashboard/widget-shell";
import { useContextPanel, useContextPanelContent } from "@/components/layout/context-panel";
import { ModulePage } from "@/components/layout/page-header";
import { MissionDetailPanel } from "@/components/missions/mission-detail-panel";
import { MissionRow } from "@/components/missions/mission-row";
import { useSession } from "@/components/providers/session-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { MISSION_FILTER_DESCRIPTORS } from "@/lib/missions/meta";
import { useMissions } from "@/lib/missions/queries";
import type { Mission, MissionFilters } from "@/lib/missions/types";
import { PRIVILEGED_ROLES } from "@/lib/organization/meta";

const DESCRIPTION =
  "Chaque analyse de votre boîte e-mail ouvre une mission : son statut, son résultat et les prospects trouvés.";

export const Route = createFileRoute("/missions/")({
  head: () => ({
    meta: [
      { title: "Missions — NASSFLOW OS" },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: "Missions — NASSFLOW OS" },
      { property: "og:description", content: DESCRIPTION },
    ],
  }),
  component: Page,
});

const DEFAULT_FILTERS: MissionFilters = {
  search: "",
  statuses: [],
  sort: "newest",
};

const PAGE_SIZE = 10;

/**
 * Missions — la liste des analyses et de leur résultat.
 *
 * La RLS de `missions` est réservée aux owner et admin : pour les autres rôles,
 * la page le dit plutôt que d'afficher une liste vide trompeuse.
 */
function Page() {
  const { session } = useSession();
  const canRead = PRIVILEGED_ROLES.includes(session.role);

  return (
    <>
      <ModulePage title="Missions" description={DESCRIPTION} />
      {canRead ? (
        <MissionsList />
      ) : (
        <section className="col-span-12 min-w-0">
          <Card className="border-border bg-card p-4">
            <EmptyState icon={Lock} title="Réservé aux propriétaires et administrateurs." />
          </Card>
        </section>
      )}
    </>
  );
}

function ListSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-16 w-full rounded-lg" />
      ))}
    </div>
  );
}

function MissionsList() {
  const [filters, setFilters] = useState<MissionFilters>(DEFAULT_FILTERS);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const { requestOpen } = useContextPanel();

  const missionsQuery = useMissions();
  const allMissions = useMemo(() => missionsQuery.data ?? [], [missionsQuery.data]);

  const missions = useMemo(() => {
    const query = filters.search.trim().toLowerCase();
    const filtered = allMissions.filter((mission) => {
      if (query && !mission.title.toLowerCase().includes(query)) return false;
      if (filters.statuses.length > 0) {
        if (!filters.statuses.includes(mission.status)) return false;
        // Un statut explicitement sélectionné (y compris "Archivée") prime sur la règle par défaut ci-dessous.
      } else if (mission.status === "archived") {
        return false;
      }
      return true;
    });

    // La requête renvoie déjà les plus récentes d'abord.
    return filters.sort === "oldest" ? [...filtered].reverse() : filtered;
  }, [filters, allMissions]);

  const pageCount = Math.max(1, Math.ceil(missions.length / PAGE_SIZE));
  const current = Math.min(page, pageCount - 1);
  const slice = missions.slice(current * PAGE_SIZE, current * PAGE_SIZE + PAGE_SIZE);

  const selected = allMissions.find((m) => m.id === selectedId) ?? null;

  useContextPanelContent(
    () => (selected ? <MissionDetailPanel mission={selected} /> : null),
    [selected],
  );

  const handleSelect = (mission: Mission) => {
    setSelectedId(mission.id);
    requestOpen();
  };

  const changeFilters = (next: MissionFilters) => {
    setFilters(next);
    setPage(0);
  };

  if (missionsQuery.isError) {
    return (
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
    );
  }

  const state = missionsQuery.isPending ? "loading" : missions.length === 0 ? "empty" : "success";
  const noMissionAtAll = !missionsQuery.isPending && allMissions.length === 0;

  return (
    <>
      <section className="col-span-12">
        <ModuleToolbar
          filters={filters}
          onChange={changeFilters}
          onReset={() => changeFilters(DEFAULT_FILTERS)}
          searchKey="search"
          searchPlaceholder="Rechercher une mission…"
          searchAriaLabel="Rechercher une mission"
          descriptors={MISSION_FILTER_DESCRIPTORS}
          views={[]}
          view="list"
          onViewChange={() => undefined}
          resultCount={missions.length}
          resultLabel={(n) => `${n} mission${n > 1 ? "s" : ""}`}
        />
      </section>

      <section className="col-span-12">
        <WidgetShell
          title="Missions"
          icon={Target}
          state={state}
          showMenu={false}
          emptyIcon={Target}
          emptyTitle={
            noMissionAtAll
              ? "Aucune mission pour l'instant"
              : "Aucune mission ne correspond à ces critères"
          }
          emptyDescription={
            noMissionAtAll
              ? "Chaque analyse de vos e-mails, lancée depuis Mission Control, ouvre une mission."
              : undefined
          }
          emptyAction={
            noMissionAtAll ? undefined : (
              <Button variant="secondary" size="sm" onClick={() => changeFilters(DEFAULT_FILTERS)}>
                Réinitialiser les filtres
              </Button>
            )
          }
          skeleton={<ListSkeleton />}
        >
          <div className="space-y-3">
            <ul className="flex flex-col gap-3">
              {slice.map((mission) => (
                <MissionRow
                  key={mission.id}
                  mission={mission}
                  selected={mission.id === selectedId}
                  onSelect={handleSelect}
                />
              ))}
            </ul>

            {pageCount > 1 ? (
              <div className="flex items-center justify-end gap-2 pt-2">
                <span className="text-[12px] text-muted-foreground">
                  Page {current + 1} / {pageCount}
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={current === 0}
                  onClick={() => setPage(current - 1)}
                >
                  <ChevronLeft />
                  Précédent
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={current >= pageCount - 1}
                  onClick={() => setPage(current + 1)}
                >
                  Suivant
                  <ChevronRight />
                </Button>
              </div>
            ) : null}
          </div>
        </WidgetShell>
      </section>
    </>
  );
}
