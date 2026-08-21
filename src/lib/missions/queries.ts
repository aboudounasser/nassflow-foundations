import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useSession } from "@/components/providers/session-provider";
import type { MissionStatus } from "@/lib/missions/types";
import { scopeKey } from "@/lib/tenancy/keys";
import type { Scope } from "@/lib/tenancy/types";
import * as missionsService from "@/services/missions";

/** Préfixe commun à la liste et aux fiches : une invalidation couvre les deux. */
function missionsKey(scope: Scope): readonly unknown[] {
  return [...scopeKey(scope), "missions"];
}

export function useMissions() {
  const { scope } = useSession();
  return useQuery({
    queryKey: [...missionsKey(scope), "list"],
    queryFn: () => missionsService.getMissions(scope),
  });
}

export function useMission(missionId: string) {
  const { scope } = useSession();
  return useQuery({
    queryKey: [...missionsKey(scope), "detail", missionId],
    queryFn: () => missionsService.getMission(scope, missionId),
    enabled: Boolean(missionId),
  });
}

export function useCancelMission() {
  const { scope } = useSession();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (missionId: string) => missionsService.cancelMission(scope, missionId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: missionsKey(scope) }),
  });
}

export function useArchiveMission() {
  const { scope } = useSession();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ missionId, fromStatus }: { missionId: string; fromStatus: MissionStatus }) =>
      missionsService.archiveMission(scope, missionId, fromStatus),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: missionsKey(scope) }),
  });
}

export function useRestoreMission() {
  const { scope } = useSession();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ missionId, toStatus }: { missionId: string; toStatus: MissionStatus }) =>
      missionsService.restoreMission(scope, missionId, toStatus),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: missionsKey(scope) }),
  });
}
