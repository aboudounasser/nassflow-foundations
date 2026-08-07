import { createFileRoute } from "@tanstack/react-router";
import { KanbanSquare, TriangleAlert, Users } from "lucide-react";
import { useMemo, useState } from "react";

import { EmptyState } from "@/components/common/empty-state";
import { WidgetShell } from "@/components/dashboard/widget-shell";
import { ContactCard, ContactCardSkeletonGrid } from "@/components/crm/contact-card";
import { ContactSummaryPanel, DealSummaryPanel } from "@/components/crm/contact-summary-panel";
import { CrmOverview, CrmOverviewSkeleton, PipelineOverview } from "@/components/crm/crm-overview";
import { GRID_LIST_VIEWS, ModuleToolbar } from "@/components/common/module-toolbar";
import { PipelineKanban, PipelineSkeleton } from "@/components/crm/pipeline-view";
import { useContextPanel, useContextPanelContent } from "@/components/layout/context-panel";
import { ModulePage } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { CONTACT_FILTER_DESCRIPTORS } from "@/lib/crm/meta";
import { useContacts, useDeals } from "@/lib/crm/queries";
import type { Contact, ContactFilters, CrmTab, CrmView, Deal } from "@/lib/crm/types";

const DESCRIPTION =
  "Le CRM piloté par l'IA de NASSFLOW OS : contacts unifiés prospects/clients et pipeline d'opportunités orchestré par le Sales Agent.";

export const Route = createFileRoute("/crm/")({
  head: () => ({
    meta: [
      { title: "CRM — Contacts & Pipeline — NASSFLOW OS" },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: "CRM — Contacts & Pipeline — NASSFLOW OS" },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

const DEFAULT_FILTERS: ContactFilters = {
  search: "",
  type: "all",
  status: "all",
  sort: "lastContact",
};

function Page() {
  const [tab, setTab] = useState<CrmTab>("contacts");
  const [filters, setFilters] = useState<ContactFilters>(DEFAULT_FILTERS);
  const [view, setView] = useState<CrmView>("grid");
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null);
  const { requestOpen } = useContextPanel();

  const contactsQuery = useContacts();
  const dealsQuery = useDeals();

  const items = useMemo(() => contactsQuery.data ?? [], [contactsQuery.data]);
  const allContacts = useMemo(() => items.map((i) => i.contact), [items]);
  const allDeals = useMemo(() => dealsQuery.data ?? [], [dealsQuery.data]);

  const isPending = contactsQuery.isPending || dealsQuery.isPending;
  const isError = contactsQuery.isError || dealsQuery.isError;

  const retry = () => {
    if (contactsQuery.isError) void contactsQuery.refetch();
    if (dealsQuery.isError) void dealsQuery.refetch();
  };

  const contacts = useMemo(() => {
    const query = filters.search.trim().toLowerCase();
    const list = items.filter(({ contact: c }) => {
      if (
        query &&
        !c.name.toLowerCase().includes(query) &&
        !c.company.toLowerCase().includes(query) &&
        !c.email.toLowerCase().includes(query)
      )
        return false;
      if (filters.type !== "all" && c.type !== filters.type) return false;
      if (filters.status !== "all" && c.status !== filters.status) return false;
      return true;
    });

    return [...list].sort((a, b) => {
      if (filters.sort === "name") return a.contact.name.localeCompare(b.contact.name, "fr");
      if (filters.sort === "value") return (b.contact.value ?? 0) - (a.contact.value ?? 0);
      return (
        new Date(b.contact.lastContactAt).getTime() - new Date(a.contact.lastContactAt).getTime()
      );
    });
  }, [filters, items]);

  const selectedItem = items.find((i) => i.contact.id === selectedContactId) ?? null;
  const selectedContact = selectedItem?.contact ?? null;
  const selectedDeal = allDeals.find((d) => d.id === selectedDealId) ?? null;

  useContextPanelContent(() => {
    if (tab === "pipeline") {
      if (!selectedDeal) return null;
      const contact = allContacts.find((c) => c.id === selectedDeal.contactId) ?? null;
      return <DealSummaryPanel deal={selectedDeal} contact={contact} />;
    }
    if (!selectedContact || !selectedItem) return null;
    return <ContactSummaryPanel contact={selectedContact} dealCount={selectedItem.deals.length} />;
  }, [tab, selectedContact?.id, selectedDeal?.id]);

  const handleSelectContact = (contact: Contact) => {
    setSelectedContactId(contact.id);
    requestOpen();
  };

  const handleSelectDeal = (deal: Deal) => {
    setSelectedDealId(deal.id);
    requestOpen();
  };

  const contactsWidgetState = isError
    ? "error"
    : isPending
      ? "loading"
      : contacts.length === 0
        ? "empty"
        : "success";

  if (isError) {
    return (
      <section className="col-span-12 min-w-0">
        <Card className="border-border bg-card p-4">
          <EmptyState
            icon={TriangleAlert}
            title="Impossible de charger le CRM"
            description="Les contacts et opportunités n'ont pas pu être récupérés. Vérifiez votre connexion puis réessayez."
          />
          <div className="flex justify-center">
            <Button type="button" size="sm" onClick={retry}>
              Réessayer
            </Button>
          </div>
        </Card>
      </section>
    );
  }

  return (
    <>
      <ModulePage title="CRM" description={DESCRIPTION} />

      <section className="col-span-12 min-w-0">
        <ToggleGroup
          type="single"
          value={tab}
          onValueChange={(v) => v && setTab(v as CrmTab)}
          aria-label="Changer d'onglet CRM"
        >
          <ToggleGroupItem value="contacts" aria-label="Vue Contacts">
            <Users className="size-4" />
            Contacts
          </ToggleGroupItem>
          <ToggleGroupItem value="pipeline" aria-label="Vue Pipeline">
            <KanbanSquare className="size-4" />
            Pipeline
          </ToggleGroupItem>
        </ToggleGroup>
      </section>

      {tab === "contacts" ? (
        <>
          <section className="col-span-12 min-w-0">
            {isPending ? (
              <CrmOverviewSkeleton />
            ) : (
              <CrmOverview contacts={allContacts} deals={allDeals} />
            )}
          </section>

          <section className="col-span-12 min-w-0">
            <ModuleToolbar
              filters={filters}
              onChange={setFilters}
              onReset={() => setFilters(DEFAULT_FILTERS)}
              searchKey="search"
              searchPlaceholder="Rechercher un nom, une entreprise, un e-mail…"
              searchAriaLabel="Rechercher un contact"
              descriptors={CONTACT_FILTER_DESCRIPTORS}
              views={GRID_LIST_VIEWS}
              view={view}
              onViewChange={(v) => setView(v as CrmView)}
              resultCount={contacts.length}
              resultLabel={(n) => `${n} contact${n > 1 ? "s" : ""}`}
            />
          </section>

          <section className="col-span-12 min-w-0">
            <WidgetShell
              title={view === "grid" ? "Vue Grille" : "Vue Liste"}
              icon={Users}
              state={contactsWidgetState}
              showMenu={false}
              emptyIcon={Users}
              emptyTitle="Aucun contact ne correspond à ces critères"
              emptyAction={
                <Button variant="secondary" size="sm" onClick={() => setFilters(DEFAULT_FILTERS)}>
                  Réinitialiser les filtres
                </Button>
              }
              skeleton={<ContactCardSkeletonGrid />}
            >
              <div
                className={
                  view === "grid"
                    ? "grid grid-cols-1 gap-4 @2xl:grid-cols-2 @5xl:grid-cols-3"
                    : "flex flex-col gap-3"
                }
              >
                {contacts.map(({ contact }) => (
                  <ContactCard
                    key={contact.id}
                    contact={contact}
                    selected={contact.id === selectedContactId}
                    compact={view === "list"}
                    onSelect={handleSelectContact}
                  />
                ))}
              </div>
            </WidgetShell>
          </section>
        </>
      ) : (
        <>
          <section className="col-span-12 min-w-0">
            {isPending ? <CrmOverviewSkeleton /> : <PipelineOverview deals={allDeals} />}
          </section>

          <section className="col-span-12 min-w-0">
            <WidgetShell
              title="Pipeline commercial"
              icon={KanbanSquare}
              state={isPending ? "loading" : allDeals.length === 0 ? "empty" : "success"}
              showMenu={false}
              emptyIcon={KanbanSquare}
              emptyTitle="Aucune opportunité dans le pipeline"
              skeleton={<PipelineSkeleton />}
            >
              <PipelineKanban
                deals={allDeals}
                contacts={allContacts}
                selectedId={selectedDealId}
                onSelect={handleSelectDeal}
              />
            </WidgetShell>
          </section>
        </>
      )}
    </>
  );
}
