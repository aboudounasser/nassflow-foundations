import { useQuery } from "@tanstack/react-query";

import { useSession } from "@/components/providers/session-provider";
import { scopeKey } from "@/lib/tenancy/keys";
import type { Scope } from "@/lib/tenancy/types";
import * as agentsService from "@/services/agents";

/** Préfixe commun à la liste et aux fiches — exporté pour l'invalidation croisée depuis `pulse/queries.ts`. */
export function agentsKey(scope: Scope): readonly unknown[] {
  return [...scopeKey(scope), "agents"];
}

export function useAgents() {
  const { scope } = useSession();
  return useQuery({
    queryKey: [...agentsKey(scope), "list"],
    queryFn: () => agentsService.getAgents(scope),
  });
}

export function useAgent(agentId: string) {
  const { scope } = useSession();
  return useQuery({
    queryKey: [...agentsKey(scope), "detail", agentId],
    queryFn: () => agentsService.getAgent(scope, agentId),
    enabled: Boolean(agentId),
  });
}
