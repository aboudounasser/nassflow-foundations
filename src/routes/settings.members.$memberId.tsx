import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, TriangleAlert, Users } from "lucide-react";

import { EmptyState } from "@/components/common/empty-state";
import { useContextPanelContent } from "@/components/layout/context-panel";
import { MemberActionsMenu } from "@/components/organization/member-actions-menu";
import { OrgMemberSummaryPanel } from "@/components/organization/org-member-summary-panel";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  MEMBER_ROLE,
  formatOrgDate,
  formatSeniority,
  memberInitials,
} from "@/lib/organization/meta";
import { useOrgMember } from "@/lib/organization/queries";

const DESCRIPTION =
  "Fiche d'un membre de l'organisation : rôle, e-mail, date d'arrivée et actions d'administration.";

export const Route = createFileRoute("/settings/members/$memberId")({
  head: () => ({
    meta: [
      { title: "Fiche membre — Paramètres — NASSFLOW OS" },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: "Fiche membre — Paramètres — NASSFLOW OS" },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function DetailSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-full max-w-md rounded-lg" />
      <Skeleton className="h-40 w-full rounded-lg" />
    </div>
  );
}

function Page() {
  const { memberId } = Route.useParams();
  const navigate = useNavigate();

  const memberQuery = useOrgMember(memberId);
  const member = memberQuery.data ?? null;

  useContextPanelContent(
    () => (member ? <OrgMemberSummaryPanel member={member} /> : null),
    [member?.id, member?.role],
  );

  if (memberQuery.isError) {
    return (
      <section className="col-span-12 min-w-0">
        <EmptyState
          icon={TriangleAlert}
          title="Impossible de charger cette fiche"
          description="Les informations du membre n'ont pas pu être récupérées. Vérifiez votre connexion puis réessayez."
        />
        <div className="flex justify-center">
          <Button type="button" size="sm" onClick={() => void memberQuery.refetch()}>
            Réessayer
          </Button>
        </div>
      </section>
    );
  }

  if (memberQuery.isPending) {
    return (
      <section className="col-span-12 min-w-0">
        <DetailSkeleton />
      </section>
    );
  }

  if (!member) {
    return (
      <section className="col-span-12 min-w-0">
        <EmptyState
          icon={Users}
          title="Membre introuvable"
          description="Ce membre n'existe pas ou a été retiré de l'organisation."
        />
        <div className="flex justify-center">
          <Button variant="secondary" size="sm" asChild>
            <Link to="/settings" search={{ tab: "members" }}>
              Retour aux membres
            </Link>
          </Button>
        </div>
      </section>
    );
  }

  const role = MEMBER_ROLE[member.role];

  return (
    <>
      <section className="col-span-12 min-w-0 space-y-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/settings" search={{ tab: "members" }}>
            <ArrowLeft />
            Retour aux membres
          </Link>
        </Button>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <Avatar className="size-12 shrink-0">
              <AvatarFallback className="text-[13px]">{memberInitials(member)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 space-y-2">
              <h1 className="text-foreground">{member.name}</h1>
              {member.jobTitle ? (
                <p className="text-[14px] text-muted-foreground">{member.jobTitle}</p>
              ) : null}
              <div className="flex flex-wrap gap-1">
                <Badge variant={role.variant}>{role.label}</Badge>
              </div>
            </div>
          </div>
          {/* Le menu se masque de lui-même quand le rôle courant ne permet aucune action. */}
          <MemberActionsMenu
            member={member}
            onRemoved={() => void navigate({ to: "/settings", search: { tab: "members" } })}
          />
        </div>
      </section>

      <section className="col-span-12 min-w-0">
        <div className="space-y-2 rounded-xl border border-border bg-surface p-6">
          <h2 className="text-[14px] font-medium text-foreground">Informations</h2>
          <Card className="grid gap-3 border-border bg-card p-4 @2xl:grid-cols-3">
            <div className="min-w-0">
              <p className="text-[12px] text-muted-foreground">E-mail</p>
              <p className="truncate text-[14px] text-foreground">{member.email}</p>
            </div>
            <div className="min-w-0">
              <p className="text-[12px] text-muted-foreground">Date d'arrivée</p>
              <p className="truncate text-[14px] text-foreground">
                {formatOrgDate(member.joinedAt)}
              </p>
            </div>
            <div className="min-w-0">
              <p className="text-[12px] text-muted-foreground">Ancienneté</p>
              <p className="truncate text-[14px] text-foreground">
                {formatSeniority(member.joinedAt)}
              </p>
            </div>
          </Card>
        </div>
      </section>
    </>
  );
}
