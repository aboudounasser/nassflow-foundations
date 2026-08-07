import { useQuery } from "@tanstack/react-query";

import { useSession } from "@/components/providers/session-provider";
import { scopeKey } from "@/lib/tenancy/keys";
import * as organizationService from "@/services/organization";

export function useCompanyProfile() {
  const { scope } = useSession();
  return useQuery({
    queryKey: [...scopeKey(scope), "organization", "profile"],
    queryFn: () => organizationService.getCompanyProfile(scope),
  });
}

export function useDepartments() {
  const { scope } = useSession();
  return useQuery({
    queryKey: [...scopeKey(scope), "organization", "departments"],
    queryFn: () => organizationService.getDepartments(scope),
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
