import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useSession } from "@/components/providers/session-provider";
import { scopeKey } from "@/lib/tenancy/keys";
import type { Scope } from "@/lib/tenancy/types";
import * as inboxService from "@/services/inbox";

import type { InboxFilters, InboxStatus } from "./types";

/** Préfixe commun au tri : une analyse ou un changement de statut l'invalide en entier. */
export function inboxRootKey(scope: Scope): readonly unknown[] {
  return [...scopeKey(scope), "inbox"];
}

function inboxMessagesKey(scope: Scope, filters: InboxFilters): readonly unknown[] {
  return [...inboxRootKey(scope), "messages", filters];
}

function inboxSummaryKey(scope: Scope): readonly unknown[] {
  return [...inboxRootKey(scope), "summary"];
}

function latestDraftKey(scope: Scope, messageId: string): readonly unknown[] {
  return [...inboxRootKey(scope), "drafts", messageId];
}

export function useInboxMessages(filters: InboxFilters) {
  const { scope } = useSession();
  return useQuery({
    queryKey: inboxMessagesKey(scope, filters),
    queryFn: () => inboxService.listInboxMessages(scope, filters),
    // Changer de filtre garde la liste précédente affichée le temps de la réponse.
    placeholderData: (previous) => previous,
  });
}

export function useInboxSummary() {
  const { scope } = useSession();
  return useQuery({
    queryKey: inboxSummaryKey(scope),
    queryFn: () => inboxService.getInboxSummary(scope),
  });
}

/** Statut d'un message : listes et résumé de Mission Control sont invalidés. */
export function useUpdateInboxStatus() {
  const { scope } = useSession();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ messageId, status }: { messageId: string; status: InboxStatus }) =>
      inboxService.updateInboxStatus(scope, messageId, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: inboxRootKey(scope) }),
  });
}

/** Dernière proposition conservée, chargée seulement à l'ouverture du panneau. */
export function useLatestDraft(messageId: string, enabled: boolean) {
  const { scope } = useSession();
  return useQuery({
    queryKey: latestDraftKey(scope, messageId),
    queryFn: () => inboxService.getLatestDraft(scope, messageId),
    enabled,
  });
}

/** Nouvelle proposition : elle remplace directement la précédente dans le cache. */
export function useGenerateReplyDraft(messageId: string) {
  const { scope } = useSession();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => inboxService.generateReplyDraft(scope, messageId),
    onSuccess: (draft) => {
      queryClient.setQueryData(latestDraftKey(scope, messageId), draft);
    },
  });
}
