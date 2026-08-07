import { useQuery } from "@tanstack/react-query";

import { useSession } from "@/components/providers/session-provider";
import { scopeKey } from "@/lib/tenancy/keys";
import * as knowledgeService from "@/services/knowledge";

export function useKnowledge() {
  const { scope } = useSession();
  return useQuery({
    queryKey: [...scopeKey(scope), "knowledge", "list"],
    queryFn: () => knowledgeService.getKnowledge(scope),
  });
}

export function useKnowledgeItem(itemId: string) {
  const { scope } = useSession();
  return useQuery({
    queryKey: [...scopeKey(scope), "knowledge", "detail", itemId],
    queryFn: () => knowledgeService.getKnowledgeItem(scope, itemId),
    enabled: Boolean(itemId),
  });
}
