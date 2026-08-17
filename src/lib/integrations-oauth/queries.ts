import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useSession } from "@/components/providers/session-provider";
import { scopeKey } from "@/lib/tenancy/keys";
import type { Scope } from "@/lib/tenancy/types";
import * as integrationsOAuthService from "@/services/integrations-oauth";

function connectionsKey(scope: Scope): readonly unknown[] {
  return [...scopeKey(scope), "integrations", "connections"];
}

export function useConnections() {
  const { scope } = useSession();
  return useQuery({
    queryKey: connectionsKey(scope),
    queryFn: () => integrationsOAuthService.listConnections(scope),
  });
}

/**
 * Prépare la redirection vers Google. La mutation ne navigue pas elle-même :
 * l'appelant décide quoi faire de l'URL retournée.
 */
export function useStartGmailConnection() {
  const { scope } = useSession();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => integrationsOAuthService.startGmailConnection(scope.organizationId),
    // Le compte n'apparaîtra qu'au retour du callback ; la liste est marquée
    // périmée dès maintenant pour le cas où l'onglet resterait monté.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: connectionsKey(scope) }),
  });
}

/**
 * Révoque l'accès à un compte Gmail. La liste est invalidée au succès : la
 * ligne revient au statut `revoked` plutôt que de disparaître.
 */
export function useDisconnectGmail() {
  const { scope } = useSession();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (integrationId: string) =>
      integrationsOAuthService.disconnectGmail(scope, integrationId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: connectionsKey(scope) }),
  });
}
