import { Link } from "@tanstack/react-router";
import { Inbox, Lock } from "lucide-react";

import { EmptyState } from "@/components/common/empty-state";
import { WidgetShell } from "@/components/dashboard/widget-shell";
import { useSession } from "@/components/providers/session-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { WidgetState } from "@/lib/dashboard/types";
import { INBOX_CATEGORY, senderLabel } from "@/lib/inbox/meta";
import { useInboxSummary } from "@/lib/inbox/queries";
import { PRIVILEGED_ROLES } from "@/lib/organization/meta";
import { formatRelativeScanDate, pluralize } from "@/lib/scans/meta";

function SummarySkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <Skeleton className="h-16 w-full rounded-lg" />
      <Skeleton className="h-16 w-full rounded-lg" />
    </div>
  );
}

/**
 * « Boîte triée » de l'accueil : combien de messages attendent une action,
 * dont combien sont prioritaires, et les trois plus récents de ceux-là. Le
 * détail et les réponses vivent sur la fiche Email Agent.
 *
 * `inbox_messages` est réservé aux owner et admin par la RLS : pour les autres
 * rôles, le bloc le dit plutôt que d'afficher des zéros.
 */
export function InboxSummaryWidget() {
  const { session } = useSession();
  const canRead = PRIVILEGED_ROLES.includes(session.role);
  const summaryQuery = useInboxSummary();
  const summary = summaryQuery.data ?? null;

  const state: WidgetState = !canRead
    ? "success"
    : summaryQuery.isError
      ? "error"
      : summaryQuery.isPending
        ? "loading"
        : "success";

  const description =
    canRead && summary && summary.toHandle > 0
      ? `${pluralize(summary.toHandle, "message à traiter", "messages à traiter")}, dont ${pluralize(summary.highPriority, "prioritaire", "prioritaires")}`
      : "Les e-mails triés par l'Email Agent qui attendent une action.";

  return (
    <WidgetShell
      title="Boîte triée"
      description={description}
      icon={Inbox}
      state={state}
      onRetry={() => void summaryQuery.refetch()}
      headerAction={
        canRead ? (
          <Button asChild size="sm" variant="ghost">
            <Link to="/agents/$agentId" params={{ agentId: "a-email" }}>
              Ouvrir la boîte triée
            </Link>
          </Button>
        ) : null
      }
      emptyIcon={Inbox}
      emptyTitle="Aucun message à traiter"
      skeleton={<SummarySkeleton />}
    >
      {!canRead ? (
        <EmptyState
          icon={Lock}
          title="Réservé aux propriétaires et administrateurs."
          className="py-10"
        />
      ) : !summary || summary.toHandle === 0 ? (
        <EmptyState
          icon={Inbox}
          title="Aucun message à traiter"
          description="Les e-mails triés après chaque analyse de votre boîte apparaîtront ici."
          className="py-10"
        />
      ) : summary.topHighPriority.length === 0 ? (
        <p className="rounded-lg border border-border bg-surface p-3 text-[14px] text-muted-foreground">
          Aucun message prioritaire.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {summary.topHighPriority.map((message) => (
            <li key={message.id} className="rounded-lg border border-border bg-surface p-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-[14px] font-medium text-foreground">
                    {senderLabel(message.fromHeader)}
                  </p>
                  <p className="truncate text-[12px] text-muted-foreground">
                    {message.subject?.trim() || "(sans objet)"}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Badge variant="neutral">{INBOX_CATEGORY[message.category].label}</Badge>
                  <span className="text-[12px] text-muted-foreground">
                    {formatRelativeScanDate(message.receivedAt)}
                  </span>
                </div>
              </div>
              {message.summary ? (
                <p className="mt-2 text-[14px] leading-6 break-words text-foreground">
                  {message.summary}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </WidgetShell>
  );
}
