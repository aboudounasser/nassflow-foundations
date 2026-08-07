import { useQuery } from "@tanstack/react-query";

import { useSession } from "@/components/providers/session-provider";
import { scopeKey } from "@/lib/tenancy/keys";
import * as workflowsService from "@/services/workflows";

export function useWorkflows() {
  const { scope } = useSession();
  return useQuery({
    queryKey: [...scopeKey(scope), "workflows", "list"],
    queryFn: () => workflowsService.getWorkflows(scope),
  });
}

export function useWorkflow(workflowId: string) {
  const { scope } = useSession();
  return useQuery({
    queryKey: [...scopeKey(scope), "workflows", "detail", workflowId],
    queryFn: () => workflowsService.getWorkflow(scope, workflowId),
    enabled: Boolean(workflowId),
  });
}
