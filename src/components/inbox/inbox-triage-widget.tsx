import { Link } from "@tanstack/react-router";
import { Inbox, Lock, Mail, SearchX, Sparkles } from "lucide-react";
import { useDeferredValue, useMemo, useState } from "react";

import { EmptyState } from "@/components/common/empty-state";
import { ModuleToolbar } from "@/components/common/module-toolbar";
import { WidgetShell } from "@/components/dashboard/widget-shell";
import { InboxMessageCard } from "@/components/inbox/inbox-message-card";
import { RunningBanner } from "@/components/scans/scan-running-banner";
import { useGmailScanLauncher } from "@/components/scans/use-gmail-scan-launcher";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { WidgetState } from "@/lib/dashboard/types";
import { DEFAULT_INBOX_FILTERS, INBOX_FILTER_DESCRIPTORS, PRIORITY_RANK } from "@/lib/inbox/meta";
import { useInboxMessages } from "@/lib/inbox/queries";
import type { InboxFilters } from "@/lib/inbox/types";
import { pluralize } from "@/lib/scans/meta";

function TriageSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <Skeleton className="h-11 w-full rounded-xl" />
      <Skeleton className="h-24 w-full rounded-lg" />
      <Skeleton className="h-24 w-full rounded-lg" />
    </div>
  );
}

function isDefault(filters: InboxFilters): boolean {
  return (
    filters.search.trim() === "" &&
    filters.status === DEFAULT_INBOX_FILTERS.status &&
    filters.category === DEFAULT_INBOX_FILTERS.category &&
    filters.priority === DEFAULT_INBOX_FILTERS.priority
  );
}

/**
 * « Boîte triée » de la fiche Email Agent.
 *
 * Le tri est écrit par l'analyse Gmail, la même que celle du Sales Agent : le
 * bouton « Analyser mes e-mails » lance donc les deux à la fois, sans second
 * appel au modèle. Les messages déjà analysés avant la mise en service de
 * l'Email Agent ne sont pas triés.
 *
 * Les filtres sont appliqués en base ; l'ordre par priorité, sur la page reçue
 * (les 50 plus récents correspondant aux filtres).
 */
export function InboxTriageWidget() {
  const { canScan, connectionsQuery, gmailConnection, launch, isLaunching } =
    useGmailScanLauncher();
  const [filters, setFilters] = useState<InboxFilters>(DEFAULT_INBOX_FILTERS);
  // La saisie reste fluide : la requête suit avec un temps de retard.
  const deferredFilters = useDeferredValue(filters);
  const messagesQuery = useInboxMessages(deferredFilters);

  const accountEmails = useMemo(
    () =>
      new Map(
        (connectionsQuery.data ?? []).map((connection) => [connection.id, connection.accountEmail]),
      ),
    [connectionsQuery.data],
  );

  const page = messagesQuery.data ?? null;
  const messages = useMemo(
    () =>
      [...(page?.messages ?? [])].sort(
        (a, b) =>
          PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] ||
          (b.receivedAt ?? "").localeCompare(a.receivedAt ?? ""),
      ),
    [page],
  );
  const total = page?.total ?? 0;

  const state: WidgetState = !canScan
    ? "success"
    : messagesQuery.isError || connectionsQuery.isError
      ? "error"
      : messagesQuery.isPending || connectionsQuery.isPending
        ? "loading"
        : "success";

  const retry = () => {
    if (messagesQuery.isError) void messagesQuery.refetch();
    if (connectionsQuery.isError) void connectionsQuery.refetch();
  };

  const resultLabel = (count: number) =>
    count > messages.length
      ? `${messages.length} affichés sur ${count} messages`
      : pluralize(count, "message", "messages");

  return (
    <WidgetShell
      title="Boîte triée"
      description="Vos e-mails classés par catégorie et priorité, résumés en une phrase."
      icon={Inbox}
      state={state}
      onRetry={retry}
      headerAction={
        canScan && gmailConnection ? (
          <Button
            type="button"
            size="sm"
            loading={isLaunching}
            disabled={isLaunching}
            onClick={launch}
          >
            <Sparkles />
            Analyser mes e-mails
          </Button>
        ) : null
      }
      emptyIcon={Inbox}
      emptyTitle="Aucun message trié"
      skeleton={<TriageSkeleton />}
    >
      {!canScan ? (
        <EmptyState
          icon={Lock}
          title="Réservé aux propriétaires et administrateurs."
          className="py-10"
        />
      ) : (
        <div className="flex flex-col gap-4">
          {isLaunching ? <RunningBanner /> : null}

          <ModuleToolbar
            filters={filters}
            onChange={setFilters}
            onReset={() => setFilters(DEFAULT_INBOX_FILTERS)}
            searchKey="search"
            searchPlaceholder="Rechercher un expéditeur ou un objet…"
            searchAriaLabel="Rechercher un message"
            descriptors={INBOX_FILTER_DESCRIPTORS}
            views={[]}
            view="list"
            onViewChange={() => undefined}
            resultCount={total}
            resultLabel={resultLabel}
          />

          {messages.length > 0 ? (
            <ul className="flex flex-col gap-3">
              {messages.map((message) => (
                <InboxMessageCard
                  key={message.id}
                  message={message}
                  accountEmail={accountEmails.get(message.integrationId) ?? null}
                />
              ))}
            </ul>
          ) : !isDefault(filters) ? (
            <>
              <EmptyState
                icon={SearchX}
                title="Aucun message ne correspond à ces filtres"
                className="py-10"
              />
              <div className="flex justify-center">
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => setFilters(DEFAULT_INBOX_FILTERS)}
                >
                  Réinitialiser les filtres
                </Button>
              </div>
            </>
          ) : !gmailConnection ? (
            <>
              <EmptyState
                icon={Mail}
                title="Aucune boîte Gmail connectée"
                description="Connectez un compte Gmail pour que l'Email Agent trie vos messages."
                className="py-10"
              />
              <div className="flex justify-center">
                <Button asChild size="sm" variant="secondary">
                  <Link to="/integrations-hub">Connecter Gmail</Link>
                </Button>
              </div>
            </>
          ) : (
            <EmptyState
              icon={Inbox}
              title="Rien à traiter pour l'instant"
              description="Les nouveaux messages apparaîtront ici, triés, après la prochaine analyse de votre boîte."
              className="py-10"
            />
          )}
        </div>
      )}
    </WidgetShell>
  );
}
