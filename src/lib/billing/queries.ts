import { useQuery } from "@tanstack/react-query";

import { useSession } from "@/components/providers/session-provider";
import { scopeKey } from "@/lib/tenancy/keys";
import * as billingService from "@/services/billing";

export function useBillingPlans() {
  const { scope } = useSession();
  return useQuery({
    queryKey: [...scopeKey(scope), "billing", "plans"],
    queryFn: () => billingService.getBillingPlans(scope),
  });
}

export function useInvoices() {
  const { scope } = useSession();
  return useQuery({
    queryKey: [...scopeKey(scope), "billing", "invoices"],
    queryFn: () => billingService.getInvoices(scope),
  });
}

export function usePaymentMethods() {
  const { scope } = useSession();
  return useQuery({
    queryKey: [...scopeKey(scope), "billing", "payment-methods"],
    queryFn: () => billingService.getPaymentMethods(scope),
  });
}

export function useConsumption() {
  const { scope } = useSession();
  return useQuery({
    queryKey: [...scopeKey(scope), "billing", "consumption"],
    queryFn: () => billingService.getConsumption(scope),
  });
}