import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useSession } from "@/components/providers/session-provider";
import type { MemberRole } from "@/lib/organization/types";
import { scopeKey } from "@/lib/tenancy/keys";
import type { Scope } from "@/lib/tenancy/types";
import * as organizationService from "@/services/organization";

/** Préfixe commun à la liste et aux fiches : une invalidation couvre les deux. */
function membersKey(scope: Scope): readonly unknown[] {
  return [...scopeKey(scope), "organization", "members"];
}

export function useCompanyProfile() {
  const { scope } = useSession();
  return useQuery({
    queryKey: [...scopeKey(scope), "organization", "profile"],
    queryFn: () => organizationService.getCompanyProfile(scope),
  });
}

/** Profil réel de l'organisation active — distinct de `useCompanyProfile()`, encore mocké. */
export function useOrganizationProfile() {
  const { scope } = useSession();
  return useQuery({
    queryKey: [...scopeKey(scope), "organization-profile"],
    queryFn: () => organizationService.getOrganizationProfile(scope),
  });
}

export function useDepartments() {
  const { scope } = useSession();
  return useQuery({
    queryKey: [...scopeKey(scope), "organization", "departments"],
    queryFn: () => organizationService.getDepartments(scope),
  });
}

export function useDepartmentSummaries() {
  const { scope } = useSession();
  return useQuery({
    queryKey: [...scopeKey(scope), "organization", "departments", "summaries"],
    queryFn: () => organizationService.getDepartmentSummaries(scope),
  });
}

export function useOrgMembers() {
  const { scope } = useSession();
  return useQuery({
    queryKey: [...scopeKey(scope), "organization", "members", "list"],
    queryFn: () => organizationService.getOrgMembers(scope),
  });
}

export function useOrgMember(memberId: string) {
  const { scope } = useSession();
  return useQuery({
    queryKey: [...scopeKey(scope), "organization", "members", "detail", memberId],
    queryFn: () => organizationService.getOrgMember(scope, memberId),
    enabled: Boolean(memberId),
  });
}

interface MemberMutationTarget {
  membershipId: string;
  /** Renseigné pour reconnaître sa propre ligne : le rôle affiché change alors. */
  userId?: string | undefined;
}

export function useUpdateMemberRole() {
  const { scope, session, refresh } = useSession();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ membershipId, role }: MemberMutationTarget & { role: MemberRole }) =>
      organizationService.updateMemberRole(scope, membershipId, role),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({ queryKey: membersKey(scope) });
      // La session n'est pas dans le cache React Query : c'est le provider qui
      // la détient, et lui seul peut rafraîchir le rôle affiché dans la Top Bar.
      if (variables.userId && variables.userId === session.userId) await refresh();
    },
  });
}

export function useRemoveMember() {
  const { scope, session, refresh } = useSession();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ membershipId }: MemberMutationTarget) =>
      organizationService.removeMember(scope, membershipId),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({ queryKey: membersKey(scope) });
      if (variables.userId && variables.userId === session.userId) await refresh();
    },
  });
}
