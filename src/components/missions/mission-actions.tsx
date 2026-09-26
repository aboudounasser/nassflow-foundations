import { Archive, ArchiveRestore } from "lucide-react";
import { toast } from "sonner";

import { useSession } from "@/components/providers/session-provider";
import { Button } from "@/components/ui/button";
import { ARCHIVABLE_STATUSES } from "@/lib/missions/meta";
import { useArchiveMission, useRestoreMission } from "@/lib/missions/queries";
import type { Mission, MissionStatus } from "@/lib/missions/types";
import { PRIVILEGED_ROLES } from "@/lib/organization/meta";

/**
 * Actions réelles sur une mission : archiver un état final, restaurer une
 * mission archivée. Partagées par le panneau de contexte et la fiche.
 *
 * La RLS `missions_update` les réserve aux owner et admin : les autres rôles ne
 * les voient pas. Pas d'« Annuler » : l'analyse ne s'arrêterait pas, et sa
 * clôture écraserait le statut.
 */
export function MissionActions({ mission }: { mission: Mission }) {
  const { session } = useSession();
  const archiveMutation = useArchiveMission();
  const restoreMutation = useRestoreMission();

  if (!PRIVILEGED_ROLES.includes(session.role)) return null;

  const archive = () => {
    archiveMutation.mutate(
      { missionId: mission.id, fromStatus: mission.status },
      {
        onSuccess: () => toast.success("Mission archivée"),
        onError: (e) =>
          toast.error(e instanceof Error ? e.message : "Impossible d'archiver la mission."),
      },
    );
  };

  const restore = (toStatus: MissionStatus) => {
    restoreMutation.mutate(
      { missionId: mission.id, toStatus },
      {
        onSuccess: () => toast.success("Mission restaurée"),
        onError: (e) =>
          toast.error(e instanceof Error ? e.message : "Impossible de restaurer la mission."),
      },
    );
  };

  const archivedFrom = mission.archivedFromStatus;

  if (ARCHIVABLE_STATUSES.includes(mission.status)) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={archive}
        loading={archiveMutation.isPending}
        disabled={archiveMutation.isPending}
      >
        <Archive />
        Archiver
      </Button>
    );
  }

  if (mission.status === "archived" && archivedFrom) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => restore(archivedFrom)}
        loading={restoreMutation.isPending}
        disabled={restoreMutation.isPending}
      >
        <ArchiveRestore />
        Restaurer
      </Button>
    );
  }

  return null;
}
