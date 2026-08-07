import { useQuery } from "@tanstack/react-query";

import { useSession } from "@/components/providers/session-provider";
import { scopeKey } from "@/lib/tenancy/keys";
import * as agentsService from "@/services/agents";

export function useAgents() {
  const { scope } = useSession();
  return useQuery({
    queryKey: [...scopeKey(scope), "agents", "list"],
    queryFn: () => agentsService.getAgents(scope),
  });
}

export function useAgent(agentId: string) {
  const { scope } = useSession();
  return useQuery({
    queryKey: [...scopeKey(scope), "agents", "detail", agentId],
    queryFn: () => agentsService.getAgent(scope, agentId),
    enabled: Boolean(agentId),
  });
}
