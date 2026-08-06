<<<<<<<
import { createFileRoute } from "@tanstack/react-router";
import { KanbanSquare, Users } from "lucide-react";
import { useMemo, useState } from "react";

import { WidgetShell } from "@/components/dashboard/widget-shell";
import { ContactCard, ContactCardSkeletonGrid } from "@/components/crm/contact-card";
import {
  ContactSummaryPanel,
  DealSummaryPanel,
} from "@/components/crm/contact-summary-panel";
import {
  CrmOverview,
  CrmOverviewSkeleton,
  PipelineOverview,
} from "@/components/crm/crm-overview";
import { CrmToolbar, type ContactFilters } from "@/components/crm/crm-toolbar";
import { PipelineKanban, PipelineSkeleton } from "@/components/crm/pipeline-view";
import { useContextPanel, useContextPanelContent } from "@/components/layout/context-panel";
import { ModulePage } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { contactsMock, dealsMock, dealsOfContact } from "@/lib/crm/mocks";
import type { Contact, CrmTab, CrmView, Deal } from "@/lib/crm/types";

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
  // État du module : loading / error / success (mock statique).
  const [state] = useState<"loading" | "error" | "success">("success");
  const { requestOpen } = useContextPanel();

  const contacts = useMemo(() => {
    const query = filters.search.trim().toLowerCase();
    const list = contactsMock.filter((c) => {
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

    return list.sort((a, b) => {
      if (filters.sort === "name") return a.name.localeCompare(b.name, "fr");
      if (filters.sort === "value") return (b.value ?? 0) - (a.value ?? 0);
      return new Date(b.lastContactAt).getTime() - new Date(a.lastContactAt).getTime();
    });
  }, [filters]);

  const selectedContact =
    contactsMock.find((c) => c.id === selectedContactId) ?? null;
  const selectedDeal = dealsMock.find((d) => d.id === selectedDealId) ?? null;

  useContextPanelContent(() => {
    if (tab === "pipeline") {
      if (!selectedDeal) return null;
      const contact = contactsMock.find((c) => c.id === selectedDeal.contactId) ?? null;
      return <DealSummaryPanel deal={selectedDeal} contact={contact} />;
    }
    if (!selectedContact) return null;
    return (
      <ContactSummaryPanel
        contact={selectedContact}
        dealCount={dealsOfContact(selectedContact.id).length}
      />
    );
  }, [tab, selectedContact?.id, selectedDeal?.id]);

  const handleSelectContact = (contact: Contact) => {
    setSelectedContactId(contact.id);
    requestOpen();
  };

  const handleSelectDeal = (deal: Deal) => {
    setSelectedDealId(deal.id);
    requestOpen();
  };

  const contactsWidgetState =
    state === "success" ? (contacts.length === 0 ? "empty" : "success") : state;

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
            {state === "loading" ? (
              <CrmOverviewSkeleton />
            ) : (
              <CrmOverview contacts={contactsMock} deals={dealsMock} />
            )}
          </section>

          <section className="col-span-12 min-w-0">
            <CrmToolbar
              filters={filters}
              onChange={setFilters}
              view={view}
              onViewChange={setView}
              onReset={() => setFilters(DEFAULT_FILTERS)}
              resultCount={contacts.length}
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
                {contacts.map((contact) => (
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
            {state === "loading" ? (
              <CrmOverviewSkeleton />
            ) : (
              <PipelineOverview deals={dealsMock} />
            )}
          </section>

          <section className="col-span-12 min-w-0">
            <WidgetShell
              title="Pipeline commercial"
              icon={KanbanSquare}
              state={state === "success" && dealsMock.length === 0 ? "empty" : state}
              showMenu={false}
              emptyIcon={KanbanSquare}
              emptyTitle="Aucune opportunité dans le pipeline"
              skeleton={<PipelineSkeleton />}
            >
              <PipelineKanban
                deals={dealsMock}
                contacts={contactsMock}
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