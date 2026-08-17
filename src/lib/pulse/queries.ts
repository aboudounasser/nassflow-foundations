import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useSession } from "@/components/providers/session-provider";
import { scopeKey } from "@/lib/tenancy/keys";
import type { Scope } from "@/lib/tenancy/types";
import * as pulseService from "@/services/pulse";

function pulseKey(scope: Scope): readonly unknown[] {
  return [...scopeKey(scope), "pulse", "today"];
}

export function usePulse() {
  const { scope } = useSession();
  return useQuery({
    queryKey: pulseKey(scope),
    queryFn: () => pulseService.getTodayPulse(scope),
  });
}

/**
 * Génère le pulse du jour. La clé du jour est invalidée au succès : la carte
 * relit la ligne fraîchement écrite, la contrainte unique sur
 * (organization_id, pulse_date) garantissant qu'il n'y en a qu'une à trouver.
 */
export function useGeneratePulse() {
  const { scope } = useSession();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => pulseService.generatePulse(scope),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: pulseKey(scope) }),
  });
}
