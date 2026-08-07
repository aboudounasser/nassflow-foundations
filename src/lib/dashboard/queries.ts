import { useQuery } from "@tanstack/react-query";

import { useSession } from "@/components/providers/session-provider";
import { scopeKey } from "@/lib/tenancy/keys";
import * as dashboardService from "@/services/dashboard";

export function useDashboardPulse() {
  const { scope } = useSession();
  return useQuery({
    queryKey: [...scopeKey(scope), "dashboard", "pulse"],
    queryFn: () => dashboardService.getDashboardPulse(scope),
  });
}

export function useDashboardOperations() {
  const { scope } = useSession();
  return useQuery({
    queryKey: [...scopeKey(scope), "dashboard", "operations"],
    queryFn: () => dashboardService.getDashboardOperations(scope),
  });
}

export function useDashboardWorkforce() {
  const { scope } = useSession();
  return useQuery({
    queryKey: [...scopeKey(scope), "dashboard", "workforce"],
    queryFn: () => dashboardService.getDashboardWorkforce(scope),
  });
}

export function useDashboardOutlook() {
  const { scope } = useSession();
  return useQuery({
    queryKey: [...scopeKey(scope), "dashboard", "outlook"],
    queryFn: () => dashboardService.getDashboardOutlook(scope),
  });
}
