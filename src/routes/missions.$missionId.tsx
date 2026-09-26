import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowLeft, Lock, MailSearch, Target, TriangleAlert, Users } from "lucide-react";

import { EmptyState } from "@/components/common/empty-state";
import { WidgetShell } from "@/components/dashboard/widget-shell";
import { useContextPanelContent } from "@/components/layout/context-panel";
import { MissionActions } from "@/components/missions/mission-actions";
import { MissionDetailPanel } from "@/components/missions/mission-detail-panel";
import { useSession } from "@/components/providers/session-provider";
import { RunResultCard } from "@/components/scans/run-result-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { WidgetState } from "@/lib/dashboard/types";
import { MISSION_STATUS, formatAiCost, formatElapsed } from "@/lib/missions/meta";
import { useMission } from "@/lib/missions/queries";
import type { Mission } from "@/lib/missions/types";
import { PRIVILEGED_ROLES } from "@/lib/organization/meta";
import { RUN_STATUS, formatScanDateTime, pluralize } from "@/lib/scans/meta";
import { useRunResults } from "@/lib/scans/queries";

const DESCRIPTION =
  "Fiche d'une mission : l'analyse de la boîte e-mail qui l'a ouverte, son résultat et les prospects trouvés.";

export const Route = createFileRoute("/missions/$missionId")({
  head: () => ({
    meta: [
      { title: "Détail de mission — NASSFLOW OS" },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: "Détail de mission — NASSFLOW OS" },
      { property: "og:description", content: DESCRIPTION },
    ],
  }),
  component: Page,
});

/**
 * Fiche mission — trois sections sur données réelles : Résumé, Analyse (le run
 * lié) et Prospects trouvés. Toute la fiche est réservée aux owner et admin,
 * comme la RLS de `missions`, `runs` et `run_results`.
 */
function Page() {
  const { session } = useSession();

  if (!PRIVILEGED_ROLES.includes(session.role)) {
    return (
      <>
        <BackLink />
        <section className="col-span-12 min-w-0">
          <Card className="border-border bg-card p-4">
            <EmptyState icon={Lock} title="Réservé aux propriétaires et administrateurs." />
          </Card>
        </section>
      </>
    );
  }

  return <MissionPage />;
}

function BackLink() {
  return (
    <section className="col-span-12">
      <Button variant="ghost" size="sm" asChild>
        <Link to="/missions">
          <ArrowLeft />
          Retour aux Missions
        </Link>
      </Button>
    </section>
  );
}

function MissionPage() {
  const { missionId } = Route.useParams();
  const missionQuery = useMission(missionId);
  const mission = missionQuery.data ?? null;

  useContextPanelContent(
    () => (mission ? <MissionDetailPanel mission={mission} /> : null),
    [mission],
  );

  if (missionQuery.isError) {
    return (
      <section className="col-span-12 min-w-0">
        <Card className="border-border bg-card p-4">
          <EmptyState
            icon={TriangleAlert}
            title="Impossible de charger la mission"
            description="Les données de la mission n'ont pas pu être récupérées. Réessayez."
          />
          <div className="flex justify-center">
            <Button type="button" size="sm" onClick={() => void missionQuery.refetch()}>
              Réessayer
            </Button>
          </div>
        </Card>
      </section>
    );
  }

  if (missionQuery.isPending) {
    return (
      <section className="col-span-12 space-y-4">
        <Skeleton className="h-10 w-full max-w-md rounded-lg" />
        <Skeleton className="h-32 w-full rounded-lg" />
        <Skeleton className="h-32 w-full rounded-lg" />
      </section>
    );
  }

  if (!mission) {
    return (
      <section className="col-span-12">
        <EmptyState
          icon={Target}
          title="Mission introuvable"
          description="Cette mission n'existe pas ou a été supprimée."
        />
        <div className="flex justify-center">
          <Button variant="secondary" size="sm" asChild>
            <Link to="/missions">Retour aux Missions</Link>
          </Button>
        </div>
      </section>
    );
  }

  return (
    <>
      <BackLink />
      <SummarySection mission={mission} />
      <section className="col-span-12">
        <RunSection mission={mission} />
      </section>
      <section className="col-span-12">
        <ProspectsSection runId={mission.runId} />
      </section>
    </>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[12px] text-muted-foreground">{label}</p>
      <p className="truncate text-[14px] text-foreground">{value}</p>
    </div>
  );
}

/** Section 1 — Résumé : statut, objectif et dates, avec les actions réelles. */
function SummarySection({ mission }: { mission: Mission }) {
  const status = MISSION_STATUS[mission.status];
  const StatusIcon = status.icon;
  const duration = formatElapsed(mission.createdAt, mission.completedAt);
  const archivedFrom = mission.archivedFromStatus
    ? MISSION_STATUS[mission.archivedFromStatus].label
    : null;

  return (
    <section className="col-span-12 min-w-0 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 space-y-2">
          <h1 className="text-foreground">{mission.title}</h1>
          <div className="flex flex-wrap gap-1">
            <Badge variant={status.variant}>
              <StatusIcon aria-hidden="true" />
              {status.label}
            </Badge>
            {archivedFrom ? <Badge>Archivée depuis « {archivedFrom} »</Badge> : null}
          </div>
        </div>
        <MissionActions mission={mission} />
      </div>

      <Card className="space-y-3 border-border bg-card p-4">
        <p className="text-[14px] leading-6 text-muted-foreground">{mission.objective}</p>
        <div className="grid gap-3 @2xl:grid-cols-3">
          <Fact label="Ouverte le" value={formatScanDateTime(mission.createdAt)} />
          <Fact label="Terminée le" value={formatScanDateTime(mission.completedAt)} />
          <Fact label="Durée" value={duration ?? "—"} />
        </div>
      </Card>
    </section>
  );
}

/** Section 2 — Analyse : le run qui a ouvert la mission (`runs`). */
function RunSection({ mission }: { mission: Mission }) {
  const run = mission.run;
  const runStatus = run ? RUN_STATUS[run.status] : null;

  return (
    <WidgetShell
      title="Analyse"
      description="L'analyse de la boîte e-mail qui a ouvert cette mission."
      icon={MailSearch}
      state={run ? "success" : "empty"}
      showMenu={false}
      headerAction={runStatus ? <Badge variant={runStatus.variant}>{runStatus.label}</Badge> : null}
      emptyIcon={MailSearch}
      emptyTitle="Aucune analyse liée à cette mission"
    >
      {run ? (
        <div className="space-y-3">
          <div className="grid gap-3 @2xl:grid-cols-3">
            <Fact label="Début" value={formatScanDateTime(run.startedAt)} />
            <Fact label="Fin" value={formatScanDateTime(run.finishedAt)} />
            <Fact label="Coût IA" value={formatAiCost(run.aiCostCents)} />
            <Fact label="E-mails lus" value={pluralize(run.emailsScanned, "e-mail", "e-mails")} />
            <Fact
              label="E-mails analysés"
              value={pluralize(run.emailsAnalyzed, "e-mail", "e-mails")}
            />
            <Fact
              label="Prospects trouvés"
              value={pluralize(run.prospectsFound, "prospect", "prospects")}
            />
          </div>
          {run.errorMessage ? (
            <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3">
              <TriangleAlert className="size-5 shrink-0 text-destructive" aria-hidden="true" />
              <p className="text-[14px] text-foreground">{run.errorMessage}</p>
            </div>
          ) : null}
        </div>
      ) : null}
    </WidgetShell>
  );
}

/** Section 3 — Prospects trouvés : les `run_results` de cette analyse. */
function ProspectsSection({ runId }: { runId: string }) {
  const resultsQuery = useRunResults(runId);
  const results = resultsQuery.data ?? [];

  const state: WidgetState = resultsQuery.isError
    ? "error"
    : resultsQuery.isPending
      ? "loading"
      : results.length === 0
        ? "empty"
        : "success";

  return (
    <WidgetShell
      title="Prospects trouvés"
      description={
        results.length > 0
          ? pluralize(results.length, "prospect dans cette analyse", "prospects dans cette analyse")
          : "Les demandes commerciales extraites par l'agent dans cette analyse."
      }
      icon={Users}
      state={state}
      showMenu={false}
      onRetry={() => void resultsQuery.refetch()}
      emptyIcon={Users}
      emptyTitle="Aucune demande commerciale dans cette analyse"
    >
      <ul className="flex flex-col gap-3">
        {results.map((result) => (
          <RunResultCard key={result.id} result={result} />
        ))}
      </ul>
    </WidgetShell>
  );
}
