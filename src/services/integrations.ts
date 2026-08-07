import type { IntegrationAgentUsage } from "@/lib/integrations/mocks";
import {
  agentsUsingIntegration,
  integrationById,
  integrationsMock,
} from "@/lib/integrations/mocks";
import type { Integration } from "@/lib/integrations/types";
import type { Scope } from "@/lib/tenancy/types";
import { delay } from "@/services/latency";

/** Liste + usages agents précalculés : la vue ne fait plus d'agrégation. */
export interface IntegrationsListData {
  integrations: Integration[];
  usageByIntegration: Record<string, IntegrationAgentUsage[]>;
}

export async function getIntegrations(_scope: Scope): Promise<IntegrationsListData> {
  return delay({
    integrations: integrationsMock,
    usageByIntegration: Object.fromEntries(
      integrationsMock.map((i) => [i.id, agentsUsingIntegration(i.name)]),
    ),
  });
}

/** Agrégat de la vue détail : un seul aller-retour par identifiant (option B). */
export interface IntegrationDetailData {
  integration: Integration;
  agentUsage: IntegrationAgentUsage[];
}

export async function getIntegration(
  _scope: Scope,
  integrationId: string,
): Promise<IntegrationDetailData | null> {
  const integration = integrationById(integrationId);
  if (!integration) return delay(null);
  return delay({ integration, agentUsage: agentsUsingIntegration(integration.name) });
}
