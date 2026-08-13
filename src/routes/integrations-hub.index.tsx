import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Plug, TriangleAlert } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { EmptyState } from "@/components/common/empty-state";
import { WidgetShell } from "@/components/dashboard/widget-shell";
import { ConnectedAccountsSection } from "@/components/integrations/connected-accounts-section";
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
import { Card } from "@/components/ui/card";
import { INTEGRATION_FILTER_DESCRIPTORS, INTEGRATION_STATUS_ORDER } from "@/lib/integrations/meta";
import { useIntegrations } from "@/lib/integrations/queries";
import type { Integration, IntegrationFilters, IntegrationView } from "@/lib/integrations/types";
import { gmailCallbackToast } from "@/lib/integrations-oauth/meta";

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
  /** `gmail-oauth-callback` renvoie l'issue du parcours dans `?gmail=` (+ `&email=`). */
  validateSearch: (
    search: Record<string, unknown>,
  ): { gmail?: string | undefined; email?: string | undefined } => ({
    gmail: typeof search["gmail"] === "string" ? search["gmail"] : undefined,
    email: typeof search["email"] === "string" ? search["email"] : undefined,
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
  const { requestOpen } = useContextPanel();
  const { gmail, email } = Route.useSearch();
  const navigate = useNavigate();
  const callbackHandled = useRef(false);

  /**
   * Retour de Google : un toast, puis nettoyage du paramètre. Sans ce retrait,
   * un simple rafraîchissement rejouerait le message. Le garde-fou couvre le
   * double montage des effets en développement.
   */
  useEffect(() => {
    if (!gmail || callbackHandled.current) return;
    callbackHandled.current = true;

    const { tone, message } = gmailCallbackToast(gmail, email ?? null);
    if (tone === "success") toast.success(message);
    else toast.error(message);

    void navigate({ to: "/integrations-hub", search: {}, replace: true });
  }, [gmail, email, navigate]);

  const integrationsQuery = useIntegrations();
  const allIntegrations = useMemo(
    () => integrationsQuery.data?.integrations ?? [],
    [integrationsQuery.data],
  );
  const usageByIntegration = integrationsQuery.data?.usageByIntegration ?? {};

  const integrations = useMemo(() => {
    const query = filters.search.trim().toLowerCase();
    const list = allIntegrations.filter((i) => {
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

    return [...list].sort((a, b) => {
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
  }, [filters, allIntegrations]);

  const selected = allIntegrations.find((i) => i.id === selectedId) ?? null;

  useContextPanelContent(
    () =>
      selected ? (
        <IntegrationSummaryPanel
          integration={selected}
          usages={usageByIntegration[selected.id] ?? []}
        />
      ) : null,
    [selected?.id, usageByIntegration],
  );

  const handleSelect = (integration: Integration) => {
    setSelectedId(integration.id);
    requestOpen();
  };

  const widgetState = integrationsQuery.isError
    ? "error"
    : integrationsQuery.isPending
      ? "loading"
      : integrations.length === 0
        ? "empty"
        : "success";

  // Le catalogue est mocké, les comptes connectés viennent de la base : son
  // échec ne doit pas emporter la section qui, elle, a peut-être abouti.
  if (integrationsQuery.isError) {
    return (
      <>
        <ModulePage title="Integrations Hub" description={DESCRIPTION} />

        <section className="col-span-12 min-w-0">
          <ConnectedAccountsSection />
        </section>

        <section className="col-span-12 min-w-0">
          <Card className="border-border bg-card p-4">
            <EmptyState
              icon={TriangleAlert}
              title="Impossible de charger l'Integrations Hub"
              description="Le catalogue d'intégrations n'a pas pu être récupéré. Vérifiez votre connexion puis réessayez."
            />
            <div className="flex justify-center">
              <Button type="button" size="sm" onClick={() => void integrationsQuery.refetch()}>
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
      <ModulePage title="Integrations Hub" description={DESCRIPTION} />

      <section className="col-span-12 min-w-0">
        <ConnectedAccountsSection />
      </section>

      <section className="col-span-12 min-w-0">
        {integrationsQuery.isPending ? (
          <IntegrationOverviewSkeleton />
        ) : (
          <IntegrationOverview integrations={allIntegrations} />
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
                agentCount={(usageByIntegration[integration.id] ?? []).length}
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
