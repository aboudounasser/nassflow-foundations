import { createFileRoute } from "@tanstack/react-router";
import { Building2, TriangleAlert, Users } from "lucide-react";
import { useMemo, useState } from "react";

import { EmptyState } from "@/components/common/empty-state";
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
import { Card } from "@/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { memberFilterDescriptors } from "@/lib/organization/meta";
import {
  useCompanyProfile,
  useDepartmentSummaries,
  useDepartments,
  useOrgMember,
  useOrgMembers,
} from "@/lib/organization/queries";
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
  const { requestOpen } = useContextPanel();

  const companyQuery = useCompanyProfile();
  const departmentsQuery = useDepartments();
  const membersQuery = useOrgMembers();
  const departmentSummariesQuery = useDepartmentSummaries();
  const selectedQuery = useOrgMember(selectedId ?? "");

  const allMembers = useMemo(() => membersQuery.data ?? [], [membersQuery.data]);
  const departmentsData = departmentsQuery.data;

  const isPending =
    companyQuery.isPending || departmentsQuery.isPending || membersQuery.isPending;
  const isError = companyQuery.isError || departmentsQuery.isError || membersQuery.isError;

  const retry = () => {
    if (companyQuery.isError) void companyQuery.refetch();
    if (departmentsQuery.isError) void departmentsQuery.refetch();
    if (membersQuery.isError) void membersQuery.refetch();
  };

  const members = useMemo(() => {
    const query = filters.search.trim().toLowerCase();
    const list = allMembers.filter((m) => {
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
  }, [filters, allMembers]);

  const selected = allMembers.find((m) => m.id === selectedId) ?? null;
  const selectedDetail = selectedQuery.data ?? null;

  const departments = useMemo(
    () => (departmentsData ?? []).map((d) => d.name),
    [departmentsData],
  );
  const descriptors = useMemo(() => memberFilterDescriptors(departments), [departments]);

  useContextPanelContent(
    () =>
      selected && selectedDetail ? (
        <OrgMemberSummaryPanel
          member={selected}
          manager={allMembers.find((m) => m.id === selected.managerId) ?? null}
          reportCount={selectedDetail.directReports.length}
          agentCount={selectedDetail.departmentAgents.length}
        />
      ) : null,
    [selected?.id, selectedDetail],
  );

  const handleSelect = (member: OrgMember) => {
    setSelectedId(member.id);
    requestOpen();
  };

  const directoryState = isError
    ? "error"
    : isPending
      ? "loading"
      : members.length === 0
        ? "empty"
        : "success";
  const departmentsState = isError
    ? "error"
    : isPending || departmentSummariesQuery.isPending
      ? "loading"
      : (departmentSummariesQuery.data ?? []).length === 0
        ? "empty"
        : "success";

  if (isError) {
    return (
      <section className="col-span-12 min-w-0">
        <Card className="border-border bg-card p-4">
          <EmptyState
            icon={TriangleAlert}
            title="Impossible de charger l'organisation"
            description="Les données de l'organisation n'ont pas pu être récupérées. Vérifiez votre connexion puis réessayez."
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
            {isPending || !companyQuery.data ? (
              <OrgOverviewSkeleton />
            ) : (
              <OrgOverview
                company={companyQuery.data}
                members={allMembers}
                departments={departmentsData ?? []}
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
              {(departmentSummariesQuery.data ?? []).map((summary) => (
                <DepartmentCard
                  key={summary.department.id}
                  department={summary.department}
                  lead={summary.lead}
                  members={summary.members}
                  agents={summary.agents}
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
