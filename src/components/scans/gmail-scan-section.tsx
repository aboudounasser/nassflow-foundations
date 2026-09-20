import { Link } from "@tanstack/react-router";
import { Loader2, Mail, MailSearch, Sparkles, TriangleAlert, type LucideIcon } from "lucide-react";
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
import {
  RUN_STATUS,
  formatRelativeScanDate,
  formatScanDateTime,
  pluralize,
} from "@/lib/scans/meta";
import { useRecentProspects, useRuns, useStartGmailScan } from "@/lib/scans/queries";
import type { Run } from "@/lib/scans/types";
import type { ProspectRunGroup } from "@/services/scans";

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
  // Indépendant de `latestRun` : c'est tout l'objet du changement — une
  // dernière analyse sans trouvaille ne doit plus masquer le stock.
  const prospectsQuery = useRecentProspects();

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
