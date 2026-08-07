import { useQuery } from "@tanstack/react-query";

import { useSession } from "@/components/providers/session-provider";
import { scopeKey } from "@/lib/tenancy/keys";
import * as helpService from "@/services/help";

export function useHelpCenter() {
  const { scope } = useSession();
  return useQuery({
    queryKey: [...scopeKey(scope), "help", "center"],
    queryFn: () => helpService.getHelpCenter(scope),
  });
}

export function useHelpArticle(articleId: string) {
  const { scope } = useSession();
  return useQuery({
    queryKey: [...scopeKey(scope), "help", "articles", "detail", articleId],
    queryFn: () => helpService.getHelpArticle(scope, articleId),
    enabled: Boolean(articleId),
  });
}
