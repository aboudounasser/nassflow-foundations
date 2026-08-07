import { useQuery } from "@tanstack/react-query";

import { useSession } from "@/components/providers/session-provider";
import { scopeKey } from "@/lib/tenancy/keys";
import * as settingsService from "@/services/settings";

export function useSettings() {
  const { scope } = useSession();
  return useQuery({
    queryKey: [...scopeKey(scope), "settings", "all"],
    queryFn: () => settingsService.getSettings(scope),
  });
}
