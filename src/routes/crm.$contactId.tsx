import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArchiveIcon, ArrowLeft, Send, UserPlus, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { EmptyState } from "@/components/common/empty-state";
import { ContactSummaryPanel } from "@/components/crm/contact-summary-panel";
import { DealCard } from "@/components/crm/deal-card";
import { MissionSummaryCard } from "@/components/dashboard/mission-summary-card";
import { useContextPanelContent } from "@/components/layout/context-panel";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ACTIVITY_TYPE,
  CONTACT_STATUS,
  CONTACT_TYPE,
  contactInitials,
  formatCrmDate,
  formatCrmDateTime,
} from "@/lib/crm/meta";
import { contactById, crmAgentById, crmMissionById, dealsOfContact } from "@/lib/crm/mocks";
import { contactsMock } from "@/lib/crm/mocks";

const DESCRIPTION =
  "Fiche complète d'un contact CRM : coordonnées, opportunités, journal d'activités, mission liée et agent IA assigné.";

export const Route = createFileRoute("/crm/$contactId")({
  head: () => ({
    meta: [
      { title: "Fiche contact — CRM — NASSFLOW OS" },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: "Fiche contact — CRM — NASSFLOW OS" },
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
  const { contactId } = Route.useParams();
  const contact = contactById(contactId);
  const navigate = useNavigate();
  // État du module : loading / error / success (mock statique).
  const [state] = useState<"loading" | "error" | "success">("success");

  const deals = useMemo(() => dealsOfContact(contactId), [contactId]);
  const mission = crmMissionById(contact?.relatedMissionId ?? null);
  const agent = crmAgentById(contact?.agentId ?? null);

  useContextPanelContent(
    () =>
      contact ? <ContactSummaryPanel contact={contact} dealCount={deals.length} /> : null,
    [contact?.id, deals.length],
  );

  if (!contact) {
    return (
      <section className="col-span-12 min-w-0">
        <EmptyState
          icon={Users}
          title="Contact introuvable"
          description="Ce contact n'existe pas ou a été retiré du CRM."
        />
        <div className="flex justify-center">
          <Button variant="secondary" size="sm" asChild>
            <Link to="/crm">Retour au CRM</Link>
          </Button>
        </div>
      </section>
    );
  }

  const type = CONTACT_TYPE[contact.type];
  const status = CONTACT_STATUS[contact.status];
  const activities = [...contact.activities].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );

  return (
    <>
      <section className="col-span-12 min-w-0 space-y-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/crm">
            <ArrowLeft />
            Retour au CRM
          </Link>
        </Button>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <Avatar className="size-12 shrink-0">
              <AvatarFallback className="text-[13px]">
                {contactInitials(contact.name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 space-y-2">
              <h1 className="text-foreground">{contact.name}</h1>
              <p className="text-[14px] text-muted-foreground">
                {contact.role} · {contact.company} · Client depuis le{" "}
                {formatCrmDate(contact.createdAt)}
              </p>
              <div className="flex flex-wrap gap-1">
                <Badge variant={type.variant}>{type.label}</Badge>
                <Badge variant={status.variant}>{status.label}</Badge>
                {contact.tags.map((tag) => (
                  <Badge key={tag}>#{tag}</Badge>
                ))}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => toast(`Message envoyé à ${contact.name} (mock)`)}
            >
              <Send />
              Contacter
            </Button>
            {contact.type === "prospect" ? (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => toast.success(`${contact.name} converti en client (mock)`)}
              >
                <UserPlus />
                Convertir en client
              </Button>
            ) : null}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toast(`${contact.name} archivé (mock)`)}
            >
              <ArchiveIcon />
              Archiver
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
              <h2 className="text-[14px] font-medium text-foreground">Informations de contact</h2>
              <Card className="grid gap-3 border-border bg-card p-4 @2xl:grid-cols-2">
                <div className="min-w-0">
                  <p className="text-[12px] text-muted-foreground">E-mail</p>
                  <p className="truncate text-[14px] text-foreground">{contact.email}</p>
                </div>
                <div className="min-w-0">
                  <p className="text-[12px] text-muted-foreground">Téléphone</p>
                  <p className="truncate text-[14px] text-foreground">{contact.phone}</p>
                </div>
              </Card>
            </div>

            <Separator />

            <div className="space-y-2">
              <h2 className="text-[14px] font-medium text-foreground">Opportunités associées</h2>
              {deals.length === 0 ? (
                <p className="text-[14px] text-muted-foreground">
                  Aucune opportunité rattachée à ce contact.
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-3 @2xl:grid-cols-2">
                  {deals.map((deal) => (
                    <DealCard key={deal.id} deal={deal} contact={contact} />
                  ))}
                </div>
              )}
            </div>

            <Separator />

            <div className="space-y-2">
              <h2 className="text-[14px] font-medium text-foreground">Journal d'activités</h2>
              {activities.length === 0 ? (
                <p className="text-[14px] text-muted-foreground">Aucune activité enregistrée.</p>
              ) : (
                <ol className="space-y-3">
                  {activities.map((activity) => {
                    const meta = ACTIVITY_TYPE[activity.type];
                    const ActivityIcon = meta.icon;
                    return (
                      <li key={activity.id} className="flex gap-3">
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-border bg-card">
                          <ActivityIcon
                            className="size-4 text-muted-foreground"
                            aria-hidden="true"
                          />
                        </span>
                        <div className="min-w-0 space-y-1">
                          <p className="text-[14px] leading-6 text-foreground">
                            {activity.summary}
                          </p>
                          <p className="text-[12px] text-muted-foreground">
                            {meta.label} · {activity.actor} ·{" "}
                            {formatCrmDateTime(activity.timestamp)}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              )}
            </div>

            {mission ? (
              <>
                <Separator />
                <div className="space-y-2">
                  <h2 className="text-[14px] font-medium text-foreground">Mission liée</h2>
                  <MissionSummaryCard
                    mission={mission}
                    onSelect={() =>
                      navigate({ to: "/missions/$missionId", params: { missionId: mission.id } })
                    }
                  />
                </div>
              </>
            ) : null}

            {agent ? (
              <>
                <Separator />
                <div className="space-y-2">
                  <h2 className="text-[14px] font-medium text-foreground">Agent assigné</h2>
                  <button
                    type="button"
                    onClick={() =>
                      navigate({ to: "/agents/$agentId", params: { agentId: agent.id } })
                    }
                    className="flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-left transition-colors duration-150 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <Avatar className="size-8">
                      <AvatarFallback className="text-[10px]">{agent.avatar}</AvatarFallback>
                    </Avatar>
                    <span className="min-w-0">
                      <span className="block truncate text-[14px] text-foreground">
                        {agent.name}
                      </span>
                      <span className="block truncate text-[12px] text-muted-foreground">
                        {agent.role}
                      </span>
                    </span>
                  </button>
                </div>
              </>
            ) : null}
          </div>
        )}
      </section>
    </>
  );
}

void contactsMock;