import { useSession } from "@/components/providers/session-provider";
import type { ProductAgentId } from "@/lib/agents/catalog";
import { useConnections } from "@/lib/integrations-oauth/queries";
import { PRIVILEGED_ROLES } from "@/lib/organization/meta";
import { usePulse } from "@/lib/pulse/queries";

type BadgeVariant = "neutral" | "primary" | "success" | "warning" | "destructive" | "info";

export interface AgentState {
  label: string;
  variant: BadgeVariant;
}

/**
 * État d'un agent, dérivé des tables réelles — jamais un statut déclaré.
 *
 * - CEO Agent : un résumé existe-t-il pour aujourd'hui (`pulses`) ?
 * - Sales Agent : une boîte Gmail est-elle active (`integrations`) ? La RLS
 *   réserve cette table aux owner et admin : pour les autres rôles, l'état est
 *   inconnu et rien n'est affiché plutôt qu'un « non connecté » erroné.
 *
 * `null` pendant le chargement, en erreur, ou quand rien d'honnête ne peut être
 * dit. Les deux requêtes sont partagées avec l'accueil et l'Integrations Hub.
 */
export function useAgentState(agentId: ProductAgentId): AgentState | null {
  const { session } = useSession();
  const pulseQuery = usePulse();
  const connectionsQuery = useConnections();

  if (agentId === "a-ceo") {
    if (pulseQuery.isPending || pulseQuery.isError) return null;
    return pulseQuery.data
      ? { label: "Résumé du jour disponible", variant: "success" }
      : { label: "Aucun résumé aujourd'hui", variant: "neutral" };
  }

  if (agentId === "a-sales") {
    if (!PRIVILEGED_ROLES.includes(session.role)) return null;
    if (connectionsQuery.isPending || connectionsQuery.isError) return null;
    const gmailActive = connectionsQuery.data.some(
      (connection) => connection.provider === "gmail" && connection.status === "active",
    );
    return gmailActive
      ? { label: "Prêt", variant: "success" }
      : { label: "Gmail non connecté", variant: "warning" };
  }

  return null;
}
