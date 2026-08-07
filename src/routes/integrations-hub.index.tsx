import { createFileRoute } from "@tanstack/react-router";
import { Plug } from "lucide-react";
import { useMemo, useState } from "react";

import { WidgetShell } from "@/components/dashboard/widget-shell";
import {
  IntegrationCard,
  IntegrationCardSkeletonGrid,
} from "@/components/integrations/integration-card";
import {
  IntegrationOverview,
  IntegrationOverviewSkeleton,
} from "@/components/integrations/integration-overview";
import { IntegrationSummaryPanel } from "@/components/integrations/integration-summary-panel";
import { GRID_LIST_VIEWS, ModuleToolbar } from "@/components/common/module-toolbar";
import { useContextPanel, useContextPanelContent } from "@/components/layout/context-panel";
import { ModulePage } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { INTEGRATION_FILTER_DESCRIPTORS, INTEGRATION_STATUS_ORDER } from "@/lib/integrations/meta";
import { integrationsMock } from "@/lib/integrations/mocks";
import type { Integration, IntegrationFilters, IntegrationView } from "@/lib/integrations/types";

const DESCRIPTION =
  "Le catalogue d'intégrations de NASSFLOW OS : outils connectés aux agents, permissions, synchronisation et connexions disponibles.";

export const Route = createFileRoute("/integrations-hub/")({
  head: () => ({
    meta: [
      { title: "Integrations Hub — NASSFLOW OS" },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: "Integrations Hub — NASSFLOW OS" },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

const DEFAULT_FILTERS: IntegrationFilters = {
  search: "",
  category: "all",
  status: "all",
  sort: "name",
};

function Page() {
  const [filters, setFilters] = useState<IntegrationFilters>(DEFAULT_FILTERS);
  const [view, setView] = useState<IntegrationView>("grid");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // État du module : loading / error / success (mock statique).
  const [state] = useState<"loading" | "error" | "success">("success");
  const { requestOpen } = useContextPanel();

  const integrations = useMemo(() => {
    const query = filters.search.trim().toLowerCase();
    const list = integrationsMock.filter((i) => {
      if (
        query &&
        !i.name.toLowerCase().includes(query) &&
        !i.description.toLowerCase().includes(query)
      )
        return false;
      if (filters.category !== "all" && i.category !== filters.category) return false;
      if (filters.status !== "all" && i.status !== filters.status) return false;
      return true;
    });

    return list.sort((a, b) => {
      if (filters.sort === "status") {
        const diff =
          INTEGRATION_STATUS_ORDER.indexOf(a.status) - INTEGRATION_STATUS_ORDER.indexOf(b.status);
        return diff !== 0 ? diff : a.name.localeCompare(b.name, "fr");
      }
      if (filters.sort === "lastSync") {
        const at = a.lastSyncAt ? new Date(a.lastSyncAt).getTime() : 0;
        const bt = b.lastSyncAt ? new Date(b.lastSyncAt).getTime() : 0;
        return bt - at;
      }
      return a.name.localeCompare(b.name, "fr");
    });
  }, [filters]);

  const selected = integrationsMock.find((i) => i.id === selectedId) ?? null;

  useContextPanelContent(
    () => (selected ? <IntegrationSummaryPanel integration={selected} /> : null),
    [selected?.id],
  );

  const handleSelect = (integration: Integration) => {
    setSelectedId(integration.id);
    requestOpen();
  };

  const widgetState =
    state === "success" ? (integrations.length === 0 ? "empty" : "success") : state;

  return (
    <>
      <ModulePage title="Integrations Hub" description={DESCRIPTION} />

      <section className="col-span-12 min-w-0">
        {state === "loading" ? (
          <IntegrationOverviewSkeleton />
        ) : (
          <IntegrationOverview integrations={integrationsMock} />
        )}
      </section>

      <section className="col-span-12 min-w-0">
        <ModuleToolbar
          filters={filters}
          onChange={setFilters}
          onReset={() => setFilters(DEFAULT_FILTERS)}
          searchKey="search"
          searchPlaceholder="Rechercher une intégration, une description…"
          searchAriaLabel="Rechercher une intégration"
          descriptors={INTEGRATION_FILTER_DESCRIPTORS}
          views={GRID_LIST_VIEWS}
          view={view}
          onViewChange={(v) => setView(v as IntegrationView)}
          resultCount={integrations.length}
          resultLabel={(n) => `${n} intégration${n > 1 ? "s" : ""}`}
        />
      </section>

      <section className="col-span-12 min-w-0">
        <WidgetShell
          title={view === "grid" ? "Vue Grille" : "Vue Liste"}
          icon={Plug}
          state={widgetState}
          showMenu={false}
          emptyIcon={Plug}
          emptyTitle="Aucune intégration ne correspond à ces critères"
          emptyAction={
            <Button variant="secondary" size="sm" onClick={() => setFilters(DEFAULT_FILTERS)}>
              Réinitialiser les filtres
            </Button>
          }
          skeleton={<IntegrationCardSkeletonGrid />}
        >
          <div
            className={
              view === "grid"
                ? "grid grid-cols-1 gap-4 @2xl:grid-cols-2 @5xl:grid-cols-3"
                : "flex flex-col gap-3"
            }
          >
            {integrations.map((integration) => (
              <IntegrationCard
                key={integration.id}
                integration={integration}
                selected={integration.id === selectedId}
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
