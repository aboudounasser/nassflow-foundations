import { Link } from "@tanstack/react-router";
import { ArrowUpRight, History, Target } from "lucide-react";

import { WidgetShell } from "@/components/dashboard/widget-shell";
import { RecentMissionRow } from "@/components/missions/recent-mission-row";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { WidgetState } from "@/lib/dashboard/types";
import { useRecentMissions } from "@/lib/missions/queries";

function RecentSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <Skeleton className="h-16 w-full rounded-lg" />
      <Skeleton className="h-16 w-full rounded-lg" />
      <Skeleton className="h-16 w-full rounded-lg" />
    </div>
  );
}

/** « Dernière activité » — les dernières missions non archivées de l'accueil. */
export function RecentMissionsWidget() {
  const missionsQuery = useRecentMissions();
  const missions = missionsQuery.data ?? [];

  const state: WidgetState = missionsQuery.isError
    ? "error"
    : missionsQuery.isPending
      ? "loading"
      : missions.length === 0
        ? "empty"
        : "success";

  return (
    <WidgetShell
      title="Dernière activité"
      description="Les dernières analyses de votre boîte e-mail et leur résultat."
      icon={History}
      state={state}
      showMenu={false}
      onRetry={() => void missionsQuery.refetch()}
      headerAction={
        <Button asChild size="sm" variant="ghost">
          <Link to="/missions">
            Voir toutes les missions
            <ArrowUpRight aria-hidden="true" />
          </Link>
        </Button>
      }
      emptyIcon={Target}
      emptyTitle="Aucune mission pour l'instant"
      emptyDescription="Chaque analyse de vos e-mails ouvre une mission : elle apparaîtra ici."
      skeleton={<RecentSkeleton />}
    >
      <ul className="flex flex-col gap-3">
        {missions.map((mission) => (
          <RecentMissionRow key={mission.id} mission={mission} />
        ))}
      </ul>
    </WidgetShell>
  );
}
