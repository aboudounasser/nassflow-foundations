import { Link } from "@tanstack/react-router";
import { Mail, MailSearch, TriangleAlert, type LucideIcon } from "lucide-react";

import { EmptyState } from "@/components/common/empty-state";
import { WidgetShell } from "@/components/dashboard/widget-shell";
import { RunResultCard } from "@/components/scans/run-result-card";
import { useGmailScanLauncher } from "@/components/scans/use-gmail-scan-launcher";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { WidgetState } from "@/lib/dashboard/types";
import {
  RUN_STATUS,
  formatRelativeScanDate,
  formatScanDateTime,
  pluralize,
} from "@/lib/scans/meta";
import { useRecentProspects, useRuns } from "@/lib/scans/queries";
import type { Run } from "@/lib/scans/types";
import type { ProspectRunGroup } from "@/services/scans";

const DESCRIPTION =
  "Vos derniers e-mails lus par un agent, avec la trace de ce qu'il a compris de chacun.";

function ResultsSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <Skeleton className="h-24 w-full rounded-lg" />
      <Skeleton className="h-24 w-full rounded-lg" />
    </div>
  );
}

function RetryBlock({ title, onRetry }: { title: string; onRetry: () => void }) {
  return (
    <>
      <EmptyState
        icon={TriangleAlert}
        title={title}
        description="Les données n'ont pas pu être récupérées. Vérifiez votre connexion puis réessayez."
        className="py-10"
      />
      <div className="flex justify-center">
        <Button type="button" size="sm" variant="secondary" onClick={onRetry}>
          Réessayer
        </Button>
      </div>
    </>
  );
}

function RunSummary({ run }: { run: Run }) {
  const status = RUN_STATUS[run.status];

  return (
    <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-card p-3">
      <div className="min-w-0">
        <p className="text-[14px] text-foreground">
          Dernière analyse {formatRelativeScanDate(run.startedAt)}
        </p>
        <p className="text-[12px] text-muted-foreground">
          {pluralize(run.emailsScanned, "e-mail lu", "e-mails lus")} ·{" "}
          {pluralize(run.emailsAnalyzed, "analysé", "analysés")} ·{" "}
          {pluralize(run.prospectsFound, "prospect trouvé", "prospects trouvés")}
        </p>
      </div>
      <Badge variant={status.variant}>{status.label}</Badge>
    </div>
  );
}

/**
 * Verdict de la dernière analyse, resserré à dessein.
 *
 * Ce n'est plus un `EmptyState` pleine hauteur : depuis que les prospects sont
 * listés en dessous, l'écran n'est jamais vide et un bloc centré de 80 px
 * repousserait la liste hors de vue. Le verdict porte sur la dernière analyse
 * seule, pas sur le stock.
 */
function LastRunVerdict({
  icon: Icon,
  tone,
  title,
  description,
}: {
  icon: LucideIcon;
  tone: "neutral" | "destructive";
  title: string;
  description: string;
}) {
  const border = tone === "destructive" ? "border-destructive/30" : "border-border";
  const iconColor = tone === "destructive" ? "text-destructive" : "text-muted-foreground";

  return (
    <div className={`mb-3 flex items-start gap-2 rounded-lg border ${border} bg-surface p-3`}>
      <Icon className={`size-5 shrink-0 ${iconColor}`} aria-hidden="true" />
      <div className="min-w-0">
        <p className="text-[14px] text-foreground">{title}</p>
        <p className="text-[12px] text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

/**
 * Les prospects d'une analyse, sous sa date.
 *
 * Date absolue et non relative : « il y a 1 mois » sur deux en-têtes successifs
 * ne les distinguerait pas, alors que le groupe existe précisément pour dire de
 * quelle analyse vient chaque fiche.
 */
function ProspectGroup({ group }: { group: ProspectRunGroup }) {
  return (
    <section>
      <p className="mb-2 text-[12px] text-muted-foreground">
        {formatScanDateTime(group.startedAt)} ·{" "}
        {pluralize(group.results.length, "prospect", "prospects")}
      </p>
      <ul className="flex flex-col gap-3">
        {group.results.map((result) => (
          <RunResultCard key={result.id} result={result} />
        ))}
      </ul>
    </section>
  );
}

/**
 * Analyses Gmail — l'historique : dernière analyse, son verdict et tous les
 * prospects, y compris ceux déjà envoyés au CRM.
 *
 * Le lancement d'une analyse et les prospects en attente vivent sur l'accueil
 * (« À valider ») : ici, on consulte ; là-bas, on décide.
 */
export function GmailScanSection() {
  const { canScan, connectionsQuery, gmailConnection } = useGmailScanLauncher();
  const runsQuery = useRuns();

  const latestRun = runsQuery.data?.[0] ?? null;
  // Indépendant de `latestRun` : c'est tout l'objet du changement — une
  // dernière analyse sans trouvaille ne doit plus masquer le stock.
  const prospectsQuery = useRecentProspects();

  // L'erreur est rendue dans le corps du widget plutôt que par l'état "error" du
  // shell : l'échec d'une lecture ne doit pas masquer les autres.
  const state: WidgetState =
    connectionsQuery.isPending || runsQuery.isPending ? "loading" : "success";

  return (
    <WidgetShell
      title="Analyses Gmail"
      description={DESCRIPTION}
      icon={MailSearch}
      state={state}
      showMenu={false}
      emptyIcon={MailSearch}
      emptyTitle="Aucune analyse"
      skeleton={<ResultsSkeleton />}
    >
      {runsQuery.isError ? (
        <RetryBlock
          title="Impossible de charger les analyses"
          onRetry={() => void runsQuery.refetch()}
        />
      ) : !gmailConnection ? (
        <EmptyState
          icon={Mail}
          title="Aucune boîte Gmail connectée"
          description={
            canScan
              ? "Connectez un compte Gmail pour qu'un agent puisse y repérer vos demandes entrantes."
              : "Seuls les propriétaires et administrateurs peuvent connecter une boîte et lancer une analyse."
          }
          className="py-10"
        />
      ) : latestRun === null ? (
        <EmptyState
          icon={MailSearch}
          title="Aucune analyse pour l'instant"
          description="Lancez une première analyse depuis l'accueil : l'agent lira vos 50 derniers messages et en extraira les demandes commerciales."
          className="py-10"
        />
      ) : (
        <>
          <RunSummary run={latestRun} />

          {/* Zone 1 — le sort de la dernière analyse, qui ne dit rien du stock.
              Le verdict se lit sur `prospectsFound`, compteur écrit par l'Edge
              Function, et non plus sur la longueur d'une liste : c'est ce qui
              rend les deux zones indépendantes. */}
          {latestRun.status === "failed" ? (
            <LastRunVerdict
              icon={TriangleAlert}
              tone="destructive"
              title="La dernière analyse a échoué"
              description={latestRun.errorMessage ?? "Relancez une analyse."}
            />
          ) : latestRun.prospectsFound === 0 ? (
            <LastRunVerdict
              icon={MailSearch}
              tone="neutral"
              title={
                latestRun.emailsScanned > 0
                  ? `Aucune demande commerciale trouvée dans les ${latestRun.emailsScanned} derniers messages`
                  : "Aucune demande commerciale trouvée dans les 50 derniers messages"
              }
              description="Ce n'est pas une erreur : l'agent a bien lu la boîte, il n'y a simplement rien à traiter."
            />
          ) : null}

          {/* Zone 2 — les prospects réellement en base, toutes analyses
              confondues. */}
          {prospectsQuery.isError ? (
            <RetryBlock
              title="Impossible de charger les prospects"
              onRetry={() => void prospectsQuery.refetch()}
            />
          ) : prospectsQuery.isPending ? (
            <ResultsSkeleton />
          ) : prospectsQuery.data.length === 0 ? (
            <EmptyState
              icon={MailSearch}
              title="Aucun prospect pour l'instant"
              description="Les demandes commerciales identifiées par l'agent apparaîtront ici, groupées par analyse."
              className="py-10"
            />
          ) : (
            <div className="flex flex-col gap-6">
              {prospectsQuery.data.map((group) => (
                <ProspectGroup key={group.runId} group={group} />
              ))}
            </div>
          )}
        </>
      )}

      {!gmailConnection && canScan && !runsQuery.isError ? (
        <div className="flex justify-center">
          <Button asChild size="sm" variant="secondary">
            <Link to="/integrations-hub">Connecter Gmail</Link>
          </Button>
        </div>
      ) : null}
    </WidgetShell>
  );
}
