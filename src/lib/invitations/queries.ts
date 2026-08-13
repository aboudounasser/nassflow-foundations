import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useSession } from "@/components/providers/session-provider";
import type { MemberRoleDb } from "@/lib/supabase/database.types";
import { scopeKey } from "@/lib/tenancy/keys";
import type { Scope } from "@/lib/tenancy/types";
import * as invitationsService from "@/services/invitations";

function invitationsListKey(scope: Scope): readonly unknown[] {
  return [...scopeKey(scope), "invitations", "list"];
}

export function useInvitations() {
  const { scope } = useSession();
  return useQuery({
    queryKey: invitationsListKey(scope),
    queryFn: () => invitationsService.listInvitations(scope),
  });
}

export function useCreateInvitation() {
  const { scope } = useSession();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ email, role }: { email: string; role: MemberRoleDb }) =>
      invitationsService.createInvitation(scope, email, role),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: invitationsListKey(scope) }),
  });
}

export function useRevokeInvitation() {
  const { scope } = useSession();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (invitationId: string) => invitationsService.revokeInvitation(scope, invitationId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: invitationsListKey(scope) }),
  });
}

/**
 * Aperçu public : appelé depuis /invite, hors SessionProvider, donc sans scope.
 * L'exception à la règle du scope en tête de clé est volontaire — il n'y a pas
 * encore d'organisation active, et la RPC ne renvoie aucune donnée d'organisation
 * au-delà du nom porté par le lien.
 */
export function useInvitationPreview(token: string) {
  return useQuery({
    queryKey: ["invitation-preview", token],
    queryFn: () => invitationsService.previewInvitation(token),
    enabled: Boolean(token),
    retry: false,
  });
}
