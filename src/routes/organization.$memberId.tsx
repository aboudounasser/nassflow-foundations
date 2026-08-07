import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Bot, PauseCircle, ShieldCheck, UserMinus, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { EmptyState } from "@/components/common/empty-state";
import { useContextPanelContent } from "@/components/layout/context-panel";
import { OrgMemberSummaryPanel } from "@/components/organization/org-member-summary-panel";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  MEMBER_ROLE,
  MEMBER_STATUS,
  formatOrgDate,
  formatSeniority,
} from "@/lib/organization/meta";
import { agentsInDepartment, directReports, orgMemberById } from "@/lib/organization/mocks";
import type { OrgMember } from "@/lib/organization/types";

const DESCRIPTION =
  "Fiche d'un membre de l'organisation NASSFLOW OS : informations, hiérarchie et agents IA du même département.";

export const Route = createFileRoute("/organization/$memberId")({
  head: () => ({
    meta: [
      { title: "Fiche membre — Organization — NASSFLOW OS" },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: "Fiche membre — Organization — NASSFLOW OS" },
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

function MemberLinkCard({ member }: { member: OrgMember }) {
  const navigate = useNavigate();
  return (
    <button
      type="button"
      onClick={() => navigate({ to: "/organization/$memberId", params: { memberId: member.id } })}
      className="flex w-full cursor-pointer items-center gap-3 rounded-lg border border-border bg-card px-3 py-2 text-left transition-colors duration-150 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Avatar className="size-9 shrink-0">
        <AvatarFallback className="text-[10px]">{member.avatar}</AvatarFallback>
      </Avatar>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[14px] text-foreground">{member.name}</span>
        <span className="block truncate text-[12px] text-muted-foreground">
          {member.jobTitle} · {member.department}
        </span>
      </span>
      <Badge variant={MEMBER_ROLE[member.role].variant}>{MEMBER_ROLE[member.role].label}</Badge>
    </button>
  );
}

function Page() {
  const { memberId } = Route.useParams();
  const member = orgMemberById(memberId);
  const navigate = useNavigate();
  // État du module : loading / error / success (mock statique).
  const [state] = useState<"loading" | "error" | "success">("success");
  const [confirmRemove, setConfirmRemove] = useState(false);

  const manager = orgMemberById(member?.managerId ?? null);
  const reports = member ? directReports(member.id) : [];
  const agents = member ? agentsInDepartment(member.department) : [];

  useContextPanelContent(
    () =>
      member ? (
        <OrgMemberSummaryPanel
          member={member}
          manager={manager}
          reportCount={reports.length}
          agentCount={agents.length}
        />
      ) : null,
    [member?.id, reports.length, agents.length],
  );

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
            <Link to="/organization">Retour à l'organisation</Link>
          </Button>
        </div>
      </section>
    );
  }

  const role = MEMBER_ROLE[member.role];
  const status = MEMBER_STATUS[member.status];

  return (
    <>
      <section className="col-span-12 min-w-0 space-y-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/organization">
            <ArrowLeft />
            Retour à l'organisation
          </Link>
        </Button>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <Avatar className="size-12 shrink-0">
              <AvatarFallback className="text-[13px]">{member.avatar}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 space-y-2">
              <h1 className="text-foreground">{member.name}</h1>
              <p className="text-[14px] text-muted-foreground">
                {member.jobTitle} · Arrivé·e le {formatOrgDate(member.joinedAt)}
              </p>
              <div className="flex flex-wrap gap-1">
                <Badge variant="info">{member.department}</Badge>
                <Badge variant={role.variant}>{role.label}</Badge>
                <Badge variant={status.variant}>{status.label}</Badge>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => toast(`Modification du rôle de ${member.name} (mock)`)}
            >
              <ShieldCheck />
              Modifier le rôle
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => toast(`${member.name} suspendu·e (mock)`)}
            >
              <PauseCircle />
              Suspendre
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setConfirmRemove(true)}>
              <UserMinus />
              Retirer de l'organisation
            </Button>
          </div>
        </div>
      </section>

      <section className="col-span-12 min-w-0">
        {state === "loading" ? (
          <DetailSkeleton />
        ) : (
          <div className="space-y-6 rounded-xl border border-border bg-surface p-6">
            <div className="space-y-2">
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

            <Separator />

            <div className="space-y-2">
              <h2 className="text-[14px] font-medium text-foreground">Manager</h2>
              {manager ? (
                <div className="@2xl:max-w-md">
                  <MemberLinkCard member={manager} />
                </div>
              ) : (
                <p className="text-[14px] text-muted-foreground">
                  Aucun manager — ce membre est au sommet de la hiérarchie.
                </p>
              )}
            </div>

            <Separator />

            <div className="space-y-2">
              <h2 className="text-[14px] font-medium text-foreground">Membres rattachés</h2>
              {reports.length === 0 ? (
                <p className="text-[14px] text-muted-foreground">
                  Aucun membre ne reporte à cette personne.
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-3 @2xl:grid-cols-2">
                  {reports.map((r) => (
                    <MemberLinkCard key={r.id} member={r} />
                  ))}
                </div>
              )}
            </div>

            <Separator />

            <div className="space-y-2">
              <h2 className="text-[14px] font-medium text-foreground">
                Agents IA du département {member.department}
              </h2>
              {agents.length === 0 ? (
                <p className="text-[14px] text-muted-foreground">
                  Aucun agent IA rattaché à ce département.
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-3 @2xl:grid-cols-2">
                  {agents.map((agent) => (
                    <button
                      key={agent.id}
                      type="button"
                      onClick={() =>
                        navigate({ to: "/agents/$agentId", params: { agentId: agent.id } })
                      }
                      className="flex w-full cursor-pointer items-center gap-3 rounded-lg border border-border bg-card px-3 py-2 text-left transition-colors duration-150 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <Avatar className="size-9 shrink-0">
                        <AvatarFallback className="text-[10px]">{agent.avatar}</AvatarFallback>
                      </Avatar>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[14px] text-foreground">
                          {agent.name}
                        </span>
                        <span className="block truncate text-[12px] text-muted-foreground">
                          {agent.role}
                        </span>
                      </span>
                      <Bot className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      <AlertDialog open={confirmRemove} onOpenChange={setConfirmRemove}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Retirer {member.name} de l'organisation ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action retirerait l'accès de ce membre à NASSFLOW OS. Elle est simulée à ce
              stade et ne modifie aucune donnée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => toast(`${member.name} retiré·e de l'organisation (mock)`)}
            >
              Retirer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
