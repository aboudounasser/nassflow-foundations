import { Link } from "@tanstack/react-router";
import { Loader2, Mail, MailSearch, Sparkles, TriangleAlert } from "lucide-react";
import { toast } from "sonner";

import { EmptyState } from "@/components/common/empty-state";
import { WidgetShell } from "@/components/dashboard/widget-shell";
import { useSession } from "@/components/providers/session-provider";
import { RunResultCard } from "@/components/scans/run-result-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { WidgetState } from "@/lib/dashboard/types";
import { useConnections } from "@/lib/integrations-oauth/queries";
import { RUN_STATUS, formatRelativeScanDate, pluralize } from "@/lib/scans/meta";
import { useRunResults, useRuns, useStartGmailScan } from "@/lib/scans/queries";
import type { Run } from "@/lib/scans/types";

const DESCRIPTION =
  "Vos derniers e-mails lus par un agent, avec la trace de ce qu'il a compris de chacun.";

/** Rôles autorisés par la RLS à lire les exécutions et par l'Edge Function à en lancer une. */
const SCAN_ROLES = ["owner", "admin"];

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

/**
 * Bandeau d'attente. L'appel à `run-gmail-scan` dure 30 à 60 secondes sans
 * étape intermédiaire : sans ce message, l'utilisateur reste devant une
 * interface immobile et conclut à une panne.
 */
function RunningBanner() {
  return (
    <div
      className="mb-3 flex items-start gap-2 rounded-lg border border-info/30 bg-info/10 p-3"
      role="status"
      aria-live="polite"
    >
      <Loader2 className="size-5 shrink-0 animate-spin text-info" aria-hidden="true" />
      <div className="min-w-0">
        <p className="text-[14px] text-foreground">
          Analyse en cours, cela peut prendre une minute.
        </p>
        <p className="text-[12px] text-muted-foreground">
          L'agent lit vos 50 derniers messages un par un, puis rédige une fiche pour chaque demande
          qu'il identifie. Vous pouvez quitter cette page, l'analyse se poursuit.
        </p>
      </div>
    </div>
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
 * Analyses Gmail — la première brique réellement branchée sur la base, posée
 * avant les Missions mockées qu'elle a vocation à alimenter.
 *
 * L'action n'est proposée qu'aux rôles que l'Edge Function accepte : masquer le
 * bouton ailleurs évite un 403 promis d'avance, la vérification faisant
 * autorité restant côté serveur.
 */
export function GmailScanSection() {
  const { session } = useSession();
  const connectionsQuery = useConnections();
  const runsQuery = useRuns();
  const startMutation = useStartGmailScan();

  const canScan = SCAN_ROLES.includes(session.role);
  const gmailConnection =
    (connectionsQuery.data ?? []).find(
      (connection) => connection.provider === "gmail" && connection.status === "active",
    ) ?? null;

  const latestRun = runsQuery.data?.[0] ?? null;
  const resultsQuery = useRunResults(latestRun?.id ?? null);

  const launch = () => {
    if (!gmailConnection) return;
    startMutation.mutate(gmailConnection.id, {
      onSuccess: (summary) =>
        toast.success(
          summary.prospectsFound > 0
            ? `Analyse terminée : ${pluralize(summary.prospectsFound, "prospect trouvé", "prospects trouvés")}.`
            : "Analyse terminée : aucune demande commerciale détectée.",
        ),
      // Les corps 403 / 404 / 409 portent un message rédigé pour l'utilisateur :
      // il est affiché tel quel.
      onError: (e) =>
        toast.error(e instanceof Error ? e.message : "L'analyse n'a pas pu être lancée."),
    });
  };

  // L'erreur est rendue dans le corps du widget plutôt que par l'état "error" du
  // shell, afin de conserver le bouton dans l'en-tête : il ne dépend pas de la
  // lecture qui vient d'échouer.
  const state: WidgetState =
    connectionsQuery.isPending || runsQuery.isPending ? "loading" : "success";

  return (
    <WidgetShell
      title="Analyses Gmail"
      description={DESCRIPTION}
      icon={MailSearch}
      state={state}
      showMenu={false}
      headerAction={
        canScan && gmailConnection ? (
          <Button
            type="button"
            size="sm"
            loading={startMutation.isPending}
            disabled={startMutation.isPending}
            onClick={launch}
          >
            <Sparkles />
            Analyser mes e-mails
          </Button>
        ) : null
      }
      emptyIcon={MailSearch}
      emptyTitle="Aucune analyse"
      skeleton={<ResultsSkeleton />}
    >
      {startMutation.isPending ? <RunningBanner /> : null}

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
          description="Lancez une première analyse : l'agent lira vos 50 derniers messages et en extraira les demandes commerciales."
          className="py-10"
        />
      ) : (
        <>
          <RunSummary run={latestRun} />

          {latestRun.status === "failed" ? (
            <EmptyState
              icon={TriangleAlert}
              title="La dernière analyse a échoué"
              description={latestRun.errorMessage ?? "Relancez une analyse."}
              className="py-10"
            />
          ) : resultsQuery.isError ? (
            <RetryBlock
              title="Impossible de charger les résultats"
              onRetry={() => void resultsQuery.refetch()}
            />
          ) : resultsQuery.isPending ? (
            <ResultsSkeleton />
          ) : resultsQuery.data.length === 0 ? (
            <EmptyState
              icon={MailSearch}
              title={
                latestRun.emailsScanned > 0
                  ? `Aucune demande commerciale trouvée dans les ${latestRun.emailsScanned} derniers messages`
                  : "Aucune demande commerciale trouvée dans les 50 derniers messages"
              }
              description="Ce n'est pas une erreur : l'agent a bien lu la boîte, il n'y a simplement rien à traiter."
              className="py-10"
            />
          ) : (
            <ul className="flex flex-col gap-3">
              {resultsQuery.data.map((result) => (
                <RunResultCard key={result.id} result={result} />
              ))}
            </ul>
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
