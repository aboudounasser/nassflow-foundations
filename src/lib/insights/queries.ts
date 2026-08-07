import { useQuery } from "@tanstack/react-query";

import { useSession } from "@/components/providers/session-provider";
import { scopeKey } from "@/lib/tenancy/keys";
import * as insightsService from "@/services/insights";
import type { InsightsPeriod } from "@/services/insights";

export function useInsights(period: InsightsPeriod) {
  const { scope } = useSession();
  return useQuery({
    queryKey: [...scopeKey(scope), "insights", "overview", period.weeks, period.days],
    queryFn: () => insightsService.getInsights(scope, period),
  });
}
