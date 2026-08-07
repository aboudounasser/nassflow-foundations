import { useQuery } from "@tanstack/react-query";

import { useSession } from "@/components/providers/session-provider";
import { scopeKey } from "@/lib/tenancy/keys";
import * as securityService from "@/services/security";

export function useSecurity() {
  const { scope } = useSession();
  return useQuery({
    queryKey: [...scopeKey(scope), "security", "overview"],
    queryFn: () => securityService.getSecurity(scope),
  });
}
