import { useQuery } from "@tanstack/react-query";

import { useSession } from "@/components/providers/session-provider";
import { scopeKey } from "@/lib/tenancy/keys";
import * as integrationsService from "@/services/integrations";

export function useIntegrations() {
  const { scope } = useSession();
  return useQuery({
    queryKey: [...scopeKey(scope), "integrations", "list"],
    queryFn: () => integrationsService.getIntegrations(scope),
  });
}

export function useIntegration(integrationId: string) {
  const { scope } = useSession();
  return useQuery({
    queryKey: [...scopeKey(scope), "integrations", "detail", integrationId],
    queryFn: () => integrationsService.getIntegration(scope, integrationId),
    enabled: Boolean(integrationId),
  });
}
