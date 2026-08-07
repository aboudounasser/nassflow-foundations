import { useQuery } from "@tanstack/react-query";

import { useSession } from "@/components/providers/session-provider";
import { scopeKey } from "@/lib/tenancy/keys";
import * as crmService from "@/services/crm";

export function useContacts() {
  const { scope } = useSession();
  return useQuery({
    queryKey: [...scopeKey(scope), "crm", "contacts", "list"],
    queryFn: () => crmService.getContacts(scope),
  });
}

export function useContact(contactId: string) {
  const { scope } = useSession();
  return useQuery({
    queryKey: [...scopeKey(scope), "crm", "contacts", "detail", contactId],
    queryFn: () => crmService.getContact(scope, contactId),
    enabled: Boolean(contactId),
  });
}

export function useDeals() {
  const { scope } = useSession();
  return useQuery({
    queryKey: [...scopeKey(scope), "crm", "deals"],
    queryFn: () => crmService.getDeals(scope),
  });
}
