import { Link } from "@tanstack/react-router";
import { Inbox, Mail, Sparkles } from "lucide-react";

import { EmptyState } from "@/components/common/empty-state";
import { WidgetShell } from "@/components/dashboard/widget-shell";
import { RunResultCard } from "@/components/scans/run-result-card";
import { RunningBanner } from "@/components/scans/scan-running-banner";
import { useGmailScanLauncher } from "@/components/scans/use-gmail-scan-launcher";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { WidgetState } from "@/lib/dashboard/types";
import { pluralize } from "@/lib/scans/meta";
import { usePendingProspects } from "@/lib/scans/queries";

const DESCRIPTION = "Les prospects détectés dans vos e-mails, en attente d'envoi au CRM.";

function PendingSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <Skeleton className="h-24 w-full rounded-lg" />
      <Skeleton className="h-24 w-full rounded-lg" />
    </div>
  );
}

/**
 * « À valider » — les décisions en tête de l'accueil.
 *
 * Porte aussi le lancement de l'analyse : lancer, voir apparaître les
 * prospects, les envoyer au CRM tient sur un seul écran. Un envoi réussi retire
 * la carte de la liste (invalidation du préfixe des résultats).
 *
 * Des prospects en attente restent affichés même sans boîte Gmail active : ils
 * partent vers HubSpot, pas vers Gmail, et demeurent donc traitables.
 */
export function PendingProspectsWidget() {
  const { canScan, connectionsQuery, gmailConnection, launch, isLaunching } =
    useGmailScanLauncher();
  const pendingQuery = usePendingProspects();

  const pending = pendingQuery.data ?? null;
  const total = pending?.total ?? 0;

  const state: WidgetState =
    connectionsQuery.isError || pendingQuery.isError
      ? "error"
      : connectionsQuery.isPending || pendingQuery.isPending
        ? "loading"
        : "success";

  const retry = () => {
    if (connectionsQuery.isError) void connectionsQuery.refetch();
    if (pendingQuery.isError) void pendingQuery.refetch();
  };

  const description =
    canScan && pending && total > 0
      ? total > pending.results.length
        ? `${pending.results.length} affichés sur ${total} prospects à valider`
        : pluralize(total, "prospect à valider", "prospects à valider")
      : DESCRIPTION;

  return (
    <WidgetShell
      title="À valider"
      description={description}
      icon={Inbox}
      state={canScan ? state : "success"}
      showMenu={false}
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
      emptyTitle="Rien à valider pour l'instant"
      skeleton={<PendingSkeleton />}
    >
      {!canScan ? (
        // La RLS renverrait une liste vide : sans ce message, un membre lirait
        // « aucune boîte connectée », ce qui serait faux.
        <EmptyState
          icon={Inbox}
          title="Seuls les propriétaires et administrateurs traitent les prospects détectés."
          className="py-10"
        />
      ) : (
        <>
          {isLaunching ? <RunningBanner /> : null}

          {pending && pending.results.length > 0 ? (
            <ul className="flex flex-col gap-3">
              {pending.results.map((result) => (
                <RunResultCard key={result.id} result={result} />
              ))}
            </ul>
          ) : !gmailConnection ? (
            <>
              <EmptyState
                icon={Mail}
                title="Aucune boîte Gmail connectée"
                description="Connectez un compte Gmail pour qu'un agent puisse y repérer vos demandes entrantes."
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
              title="Rien à valider pour l'instant"
              description="Les demandes commerciales détectées dans vos e-mails apparaîtront ici."
              className="py-10"
            />
          )}
        </>
      )}
    </WidgetShell>
  );
}
