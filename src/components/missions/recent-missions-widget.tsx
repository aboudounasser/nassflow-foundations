import { Link } from "@tanstack/react-router";
import { ArrowUpRight, History, Lock, Target } from "lucide-react";

import { EmptyState } from "@/components/common/empty-state";
import { WidgetShell } from "@/components/dashboard/widget-shell";
import { RecentMissionRow } from "@/components/missions/recent-mission-row";
import { useSession } from "@/components/providers/session-provider";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { WidgetState } from "@/lib/dashboard/types";
import { useRecentMissions } from "@/lib/missions/queries";
import { PRIVILEGED_ROLES } from "@/lib/organization/meta";

function RecentSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <Skeleton className="h-16 w-full rounded-lg" />
      <Skeleton className="h-16 w-full rounded-lg" />
      <Skeleton className="h-16 w-full rounded-lg" />
    </div>
  );
}

/**
 * « Dernière activité » — les dernières missions non archivées de l'accueil.
 *
 * La RLS de `missions` est réservée aux owner et admin : pour les autres rôles,
 * la requête reviendrait vide, et « aucune mission » serait faux.
 */
export function RecentMissionsWidget() {
  const { session } = useSession();
  const canRead = PRIVILEGED_ROLES.includes(session.role);
  const missionsQuery = useRecentMissions();
  const missions = missionsQuery.data ?? [];

  const state: WidgetState = !canRead
    ? "success"
    : missionsQuery.isError
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
        canRead ? (
          <Button asChild size="sm" variant="ghost">
            <Link to="/missions">
              Voir toutes les missions
              <ArrowUpRight aria-hidden="true" />
            </Link>
          </Button>
        ) : null
      }
      emptyIcon={Target}
      emptyTitle="Aucune mission pour l'instant"
      emptyDescription="Chaque analyse de vos e-mails ouvre une mission : elle apparaîtra ici."
      skeleton={<RecentSkeleton />}
    >
      {canRead ? (
        <ul className="flex flex-col gap-3">
          {missions.map((mission) => (
            <RecentMissionRow key={mission.id} mission={mission} />
          ))}
        </ul>
      ) : (
        <EmptyState
          icon={Lock}
          title="Réservé aux propriétaires et administrateurs."
          className="py-10"
        />
      )}
    </WidgetShell>
  );
}
