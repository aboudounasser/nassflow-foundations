import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useSession } from "@/components/providers/session-provider";
import { scopeKey } from "@/lib/tenancy/keys";
import type { Scope } from "@/lib/tenancy/types";
import * as scanSchedulesService from "@/services/scan-schedules";

import type { ScanScheduleSettings } from "./types";

function scanScheduleKey(scope: Scope, integrationId: string): readonly unknown[] {
  return [...scopeKey(scope), "scan-schedules", integrationId];
}

export function useScanSchedule(integrationId: string) {
  const { scope } = useSession();
  return useQuery({
    queryKey: scanScheduleKey(scope, integrationId),
    queryFn: () => scanSchedulesService.getScanSchedule(scope, integrationId),
  });
}

/**
 * Modifie les réglages d'une boîte. La réponse porte la ligne recalculée par la
 * base (échéance comprise) : elle remplace directement le cache, sans second
 * aller-retour.
 */
export function useUpdateScanSchedule(integrationId: string) {
  const { scope } = useSession();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (patch: Partial<ScanScheduleSettings>) =>
      scanSchedulesService.updateScanSchedule(scope, integrationId, patch),
    onSuccess: (schedule) => {
      queryClient.setQueryData(scanScheduleKey(scope, integrationId), schedule);
    },
  });
}
