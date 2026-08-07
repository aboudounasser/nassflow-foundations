import { createFileRoute } from "@tanstack/react-router";
import { Building2, Users } from "lucide-react";
import { useMemo, useState } from "react";

import { WidgetShell } from "@/components/dashboard/widget-shell";
import { useContextPanel, useContextPanelContent } from "@/components/layout/context-panel";
import { ModulePage } from "@/components/layout/page-header";
import { DepartmentCard, DepartmentSkeletonGrid } from "@/components/organization/department-card";
import {
  OrgMemberCard,
  OrgMemberCardSkeletonGrid,
} from "@/components/organization/org-member-card";
import { OrgMemberSummaryPanel } from "@/components/organization/org-member-summary-panel";
import { OrgOverview, OrgOverviewSkeleton } from "@/components/organization/org-overview";
import { GRID_LIST_VIEWS, ModuleToolbar } from "@/components/common/module-toolbar";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { memberFilterDescriptors } from "@/lib/organization/meta";
import {
  agentsInDepartment,
  companyProfileMock,
  departmentsMock,
  directReports,
  membersInDepartment,
  orgMemberById,
  orgMembersMock,
} from "@/lib/organization/mocks";
import type { MemberFilters, OrgMember, OrgTab, OrgView } from "@/lib/organization/types";

const DESCRIPTION =
  "L'organisation hybride de NASSFLOW OS : annuaire des membres humains et départements réunissant équipes humaines et agents IA.";

export const Route = createFileRoute("/organization/")({
  head: () => ({
    meta: [
      { title: "Organization — Annuaire & Départements — NASSFLOW OS" },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: "Organization — Annuaire & Départements — NASSFLOW OS" },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

const DEFAULT_FILTERS: MemberFilters = {
  search: "",
  department: "all",
  role: "all",
  status: "all",
  sort: "name",
};

function Page() {
  const [tab, setTab] = useState<OrgTab>("directory");
  const [filters, setFilters] = useState<MemberFilters>(DEFAULT_FILTERS);
  const [view, setView] = useState<OrgView>("grid");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // État du module : loading / error / success (mock statique).
  const [state] = useState<"loading" | "error" | "success">("success");
  const { requestOpen } = useContextPanel();

  const members = useMemo(() => {
    const query = filters.search.trim().toLowerCase();
    const list = orgMembersMock.filter((m) => {
      if (
        query &&
        !m.name.toLowerCase().includes(query) &&
        !m.email.toLowerCase().includes(query) &&
        !m.jobTitle.toLowerCase().includes(query)
      )
        return false;
      if (filters.department !== "all" && m.department !== filters.department) return false;
      if (filters.role !== "all" && m.role !== filters.role) return false;
      if (filters.status !== "all" && m.status !== filters.status) return false;
      return true;
    });

    return [...list].sort((a, b) => {
      if (filters.sort === "joinedAt")
        return new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime();
      if (filters.sort === "department")
        return a.department.localeCompare(b.department, "fr") || a.name.localeCompare(b.name, "fr");
      return a.name.localeCompare(b.name, "fr");
    });
  }, [filters]);

  const selected = orgMembersMock.find((m) => m.id === selectedId) ?? null;

  useContextPanelContent(
    () =>
      selected ? (
        <OrgMemberSummaryPanel
          member={selected}
          manager={orgMemberById(selected.managerId)}
          reportCount={directReports(selected.id).length}
          agentCount={agentsInDepartment(selected.department).length}
        />
      ) : null,
    [selected?.id],
  );

  const handleSelect = (member: OrgMember) => {
    setSelectedId(member.id);
    requestOpen();
  };

  const directoryState = state === "success" ? (members.length === 0 ? "empty" : "success") : state;
  const departmentsState =
    state === "success" ? (departmentsMock.length === 0 ? "empty" : "success") : state;

  return (
    <>
      <ModulePage title="Organization" description={DESCRIPTION} />

      <section className="col-span-12 min-w-0">
        <ToggleGroup
          type="single"
          value={tab}
          onValueChange={(v) => v && setTab(v as OrgTab)}
          aria-label="Changer d'onglet Organization"
        >
          <ToggleGroupItem value="directory" aria-label="Vue Annuaire">
            <Users className="size-4" />
            Annuaire
          </ToggleGroupItem>
          <ToggleGroupItem value="departments" aria-label="Vue Départements">
            <Building2 className="size-4" />
            Départements
          </ToggleGroupItem>
        </ToggleGroup>
      </section>

      {tab === "directory" ? (
        <>
          <section className="col-span-12 min-w-0">
            {state === "loading" ? (
              <OrgOverviewSkeleton />
            ) : (
              <OrgOverview
                company={companyProfileMock}
                members={orgMembersMock}
                departments={departmentsMock}
              />
            )}
          </section>

          <section className="col-span-12 min-w-0">
            <ModuleToolbar
              filters={filters}
              onChange={setFilters}
              onReset={() => setFilters(DEFAULT_FILTERS)}
              searchKey="search"
              searchPlaceholder="Rechercher un nom, un e-mail, un poste…"
              searchAriaLabel="Rechercher un membre"
              descriptors={descriptors}
              views={GRID_LIST_VIEWS}
              view={view}
              onViewChange={(v) => setView(v as OrgView)}
              resultCount={members.length}
              resultLabel={(n) => `${n} membre${n > 1 ? "s" : ""}`}
            />
          </section>

          <section className="col-span-12 min-w-0">
            <WidgetShell
              title={view === "grid" ? "Vue Grille" : "Vue Liste"}
              icon={Users}
              state={directoryState}
              showMenu={false}
              emptyIcon={Users}
              emptyTitle="Aucun membre ne correspond à ces critères"
              emptyAction={
                <Button variant="secondary" size="sm" onClick={() => setFilters(DEFAULT_FILTERS)}>
                  Réinitialiser les filtres
                </Button>
              }
              skeleton={<OrgMemberCardSkeletonGrid />}
            >
              <div
                className={
                  view === "grid"
                    ? "grid grid-cols-1 gap-4 @2xl:grid-cols-2 @5xl:grid-cols-3"
                    : "flex flex-col gap-3"
                }
              >
                {members.map((member) => (
                  <OrgMemberCard
                    key={member.id}
                    member={member}
                    selected={member.id === selectedId}
                    compact={view === "list"}
                    onSelect={handleSelect}
                  />
                ))}
              </div>
            </WidgetShell>
          </section>
        </>
      ) : (
        <section className="col-span-12 min-w-0">
          <WidgetShell
            title="Départements"
            description="Chaque département réunit ses membres humains et les agents IA du même domaine."
            icon={Building2}
            state={departmentsState}
            showMenu={false}
            emptyIcon={Building2}
            emptyTitle="Aucun département défini"
            skeleton={<DepartmentSkeletonGrid />}
          >
            <div className="grid grid-cols-1 gap-4 @2xl:grid-cols-2 @5xl:grid-cols-3">
              {departmentsMock.map((department) => (
                <DepartmentCard
                  key={department.id}
                  department={department}
                  lead={orgMemberById(department.leadMemberId)}
                  members={membersInDepartment(department.name)}
                  agents={agentsInDepartment(department.name)}
                  onSelect={(d) => {
                    setFilters({ ...DEFAULT_FILTERS, department: d.name });
                    setTab("directory");
                  }}
                />
              ))}
            </div>
          </WidgetShell>
        </section>
      )}
    </>
  );
}
