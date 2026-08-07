import { useQuery } from "@tanstack/react-query";

import { useSession } from "@/components/providers/session-provider";
import { scopeKey } from "@/lib/tenancy/keys";
import * as missionsService from "@/services/missions";

export function useMissions() {
  const { scope } = useSession();
  return useQuery({
    queryKey: [...scopeKey(scope), "missions", "list"],
    queryFn: () => missionsService.getMissions(scope),
  });
}

export function useMission(missionId: string) {
  const { scope } = useSession();
  return useQuery({
    queryKey: [...scopeKey(scope), "missions", "detail", missionId],
    queryFn: () => missionsService.getMission(scope, missionId),
    enabled: Boolean(missionId),
  });
}
