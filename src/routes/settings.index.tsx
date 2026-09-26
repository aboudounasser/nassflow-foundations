import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { MailPlus, TriangleAlert, Users } from "lucide-react";
import { useMemo, useState } from "react";

import { EmptyState } from "@/components/common/empty-state";
import { GRID_LIST_VIEWS, ModuleToolbar } from "@/components/common/module-toolbar";
import { WidgetShell } from "@/components/dashboard/widget-shell";
import { useContextPanel, useContextPanelContent } from "@/components/layout/context-panel";
import { InvitationsSection } from "@/components/organization/invitations-section";
import { MemberActionsMenu } from "@/components/organization/member-actions-menu";
import {
  OrgMemberCard,
  OrgMemberCardSkeletonGrid,
} from "@/components/organization/org-member-card";
import { OrgMemberSummaryPanel } from "@/components/organization/org-member-summary-panel";
import { useSession } from "@/components/providers/session-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  MEMBER_FILTER_DESCRIPTORS,
  PRIVILEGED_ROLES,
  canAdministerMember,
} from "@/lib/organization/meta";
import { useOrgMembers, useOrganizationProfile } from "@/lib/organization/queries";
import type { MemberFilters, OrgMember, OrgView, SettingsTab } from "@/lib/organization/types";

const DESCRIPTION =
  "Paramètres de l'organisation dans NASSFLOW OS : membres, rôles et invitations en cours.";

export const Route = createFileRoute("/settings/")({
  head: () => ({
    meta: [
      { title: "Paramètres — NASSFLOW OS" },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: "Paramètres — NASSFLOW OS" },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  validateSearch: (search: Record<string, unknown>): { tab?: SettingsTab | undefined } => ({
    tab: search["tab"] === "invitations" ? "invitations" : undefined,
  }),
  component: Page,
});

const DEFAULT_FILTERS: MemberFilters = {
  search: "",
  role: "all",
  sort: "name",
};

/**
 * Paramètres — fusion d'Organization et de System Settings (chantier 6).
 *
 * L'onglet Invitations n'existe que pour les rôles que la RLS de `invitations`
 * autorise : un simple membre ne le voit pas, plutôt que de remplir un
 * formulaire que la base refuserait.
 */
function Page() {
  const { session } = useSession();
  const { tab: requestedTab } = Route.useSearch();
  const navigate = useNavigate();

  const canManage = PRIVILEGED_ROLES.includes(session.role);
  const tab: SettingsTab = requestedTab === "invitations" && canManage ? "invitations" : "members";

  const organizationQuery = useOrganizationProfile();
  const organizationName = organizationQuery.data?.name ?? "votre organisation";

  const changeTab = (next: SettingsTab) =>
    void navigate({
      to: "/settings",
      search: next === "members" ? {} : { tab: next },
      replace: true,
    });

  return (
    <>
      <section className="col-span-12 min-w-0">
        <h1 className="text-foreground">Paramètres</h1>
        <p className="mt-2 text-[16px] text-muted-foreground">
          {canManage
            ? `Les membres de ${organizationName} et les invitations en cours.`
            : `Les membres de ${organizationName}.`}
        </p>
      </section>

      {canManage ? (
        <section className="col-span-12 min-w-0">
          <ToggleGroup
            type="single"
            value={tab}
            onValueChange={(v) => v && changeTab(v as SettingsTab)}
            aria-label="Changer d'onglet Paramètres"
          >
            <ToggleGroupItem value="members" aria-label="Onglet Membres">
              <Users className="size-5" />
              Membres
            </ToggleGroupItem>
            <ToggleGroupItem value="invitations" aria-label="Onglet Invitations">
              <MailPlus className="size-5" />
              Invitations
            </ToggleGroupItem>
          </ToggleGroup>
        </section>
      ) : null}

      {tab === "invitations" ? (
        <section className="col-span-12 min-w-0">
          <InvitationsSection />
        </section>
      ) : (
        <MembersTab />
      )}
    </>
  );
}

function MembersTab() {
  const { session } = useSession();
  const [filters, setFilters] = useState<MemberFilters>(DEFAULT_FILTERS);
  const [view, setView] = useState<OrgView>("grid");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { requestOpen } = useContextPanel();

  const membersQuery = useOrgMembers();
  const allMembers = useMemo(() => membersQuery.data ?? [], [membersQuery.data]);

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
      if (filters.role !== "all" && m.role !== filters.role) return false;
      return true;
    });

    return [...list].sort((a, b) => {
      if (filters.sort === "joinedAt")
        return new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime();
      return a.name.localeCompare(b.name, "fr");
    });
  }, [filters, allMembers]);

  const selected = allMembers.find((m) => m.id === selectedId) ?? null;

  useContextPanelContent(
    () => (selected ? <OrgMemberSummaryPanel member={selected} /> : null),
    [selected?.id, selected?.role],
  );

  const handleSelect = (member: OrgMember) => {
    setSelectedId(member.id);
    requestOpen();
  };

  if (membersQuery.isError) {
    return (
      <section className="col-span-12 min-w-0">
        <Card className="border-border bg-card p-4">
          <EmptyState
            icon={TriangleAlert}
            title="Impossible de charger les membres"
            description="La liste des membres n'a pas pu être récupérée. Vérifiez votre connexion puis réessayez."
          />
          <div className="flex justify-center">
            <Button type="button" size="sm" onClick={() => void membersQuery.refetch()}>
              Réessayer
            </Button>
          </div>
        </Card>
      </section>
    );
  }

  const state = membersQuery.isPending ? "loading" : members.length === 0 ? "empty" : "success";

  return (
    <>
      <section className="col-span-12 min-w-0">
        <ModuleToolbar
          filters={filters}
          onChange={setFilters}
          onReset={() => setFilters(DEFAULT_FILTERS)}
          searchKey="search"
          searchPlaceholder="Rechercher un nom, un e-mail, un poste…"
          searchAriaLabel="Rechercher un membre"
          descriptors={MEMBER_FILTER_DESCRIPTORS}
          views={GRID_LIST_VIEWS}
          view={view}
          onViewChange={(v) => setView(v as OrgView)}
          resultCount={members.length}
          resultLabel={(n) => `${n} membre${n > 1 ? "s" : ""}`}
        />
      </section>

      <section className="col-span-12 min-w-0">
        <WidgetShell
          title="Membres"
          icon={Users}
          state={state}
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
                actions={
                  canAdministerMember(session.role, member) ? (
                    <MemberActionsMenu member={member} />
                  ) : undefined
                }
              />
            ))}
          </div>
        </WidgetShell>
      </section>
    </>
  );
}
