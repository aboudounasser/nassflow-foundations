import { Link } from "@tanstack/react-router";
import { Activity, Lock } from "lucide-react";

import { EmptyState } from "@/components/common/empty-state";
import { WidgetShell } from "@/components/dashboard/widget-shell";
import { RecentMissionRow } from "@/components/missions/recent-mission-row";
import { useSession } from "@/components/providers/session-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { WidgetState } from "@/lib/dashboard/types";
import { useRecentMissions } from "@/lib/missions/queries";
import { PRIVILEGED_ROLES } from "@/lib/organization/meta";
import { RUN_STATUS, formatRelativeScanDate, pluralize } from "@/lib/scans/meta";
import { usePendingProspects, useRuns } from "@/lib/scans/queries";

/**
 * « Activité » de la fiche Sales Agent : dernière analyse Gmail, prospects en
 * attente et dernières missions. Mêmes requêtes que l'accueil — les chiffres
 * ne peuvent pas diverger.
 *
 * `runs` et `run_results` sont réservés aux owner et admin par la RLS : pour
 * les autres rôles, la section le dit plutôt que d'afficher des zéros.
 */
export function AgentSalesActivity() {
  const { session } = useSession();
  const canRead = PRIVILEGED_ROLES.includes(session.role);

  const runsQuery = useRuns();
  const pendingQuery = usePendingProspects();
  const missionsQuery = useRecentMissions();

  const queries = [runsQuery, pendingQuery, missionsQuery];
  const state: WidgetState = !canRead
    ? "success"
    : queries.some((q) => q.isError)
      ? "error"
      : queries.some((q) => q.isPending)
        ? "loading"
        : "success";

  const retry = () => {
    for (const query of queries) if (query.isError) void query.refetch();
  };

  const latestRun = runsQuery.data?.[0] ?? null;
  const pendingTotal = pendingQuery.data?.total ?? 0;
  const missions = missionsQuery.data ?? [];

  return (
    <WidgetShell
      title="Activité"
      description="Analyses de la boîte e-mail, prospects en attente et dernières missions."
      icon={Activity}
      state={state}
      showMenu={false}
      onRetry={retry}
      emptyIcon={Activity}
      emptyTitle="Aucune activité"
    >
      {!canRead ? (
        <EmptyState
          icon={Lock}
          title="Réservé aux propriétaires et administrateurs."
          className="py-10"
        />
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-surface p-3">
            {latestRun ? (
              <>
                <div className="min-w-0">
                  <p className="text-[14px] text-foreground">
                    Dernière analyse {formatRelativeScanDate(latestRun.startedAt)}
                  </p>
                  <p className="text-[12px] text-muted-foreground">
                    {pluralize(latestRun.emailsScanned, "e-mail lu", "e-mails lus")} ·{" "}
                    {pluralize(latestRun.prospectsFound, "prospect trouvé", "prospects trouvés")}
                  </p>
                </div>
                <Badge variant={RUN_STATUS[latestRun.status].variant}>
                  {RUN_STATUS[latestRun.status].label}
                </Badge>
              </>
            ) : (
              <p className="text-[14px] text-muted-foreground">Aucune analyse pour l'instant.</p>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-surface p-3">
            <p className="text-[14px] text-foreground">
              {pendingTotal > 0
                ? pluralize(pendingTotal, "prospect à valider", "prospects à valider")
                : "Aucun prospect à valider"}
            </p>
            <Button asChild size="sm" variant="secondary">
              <Link to="/">Ouvrir Mission Control</Link>
            </Button>
          </div>

          <div className="space-y-2">
            <p className="text-[12px] text-muted-foreground">Dernières missions</p>
            {missions.length > 0 ? (
              <ul className="flex flex-col gap-3">
                {missions.map((mission) => (
                  <RecentMissionRow key={mission.id} mission={mission} />
                ))}
              </ul>
            ) : (
              <p className="text-[14px] text-muted-foreground">Aucune mission pour l'instant.</p>
            )}
          </div>
        </div>
      )}
    </WidgetShell>
  );
}
