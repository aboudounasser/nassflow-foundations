import { useQueryClient } from "@tanstack/react-query";
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

import { organizationRootKey } from "@/lib/tenancy/keys";
import {
  defaultOrganization,
  organizationsMock,
  sessionForOrganization,
} from "@/lib/tenancy/mocks";
import type { Organization, Scope, Session } from "@/lib/tenancy/types";

interface SessionApi {
  session: Session;
  scope: Scope;
  organizations: Organization[];
  switchOrganization: (id: string) => void;
}

const SessionCtx = createContext<SessionApi | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [organization, setOrganization] = useState<Organization>(defaultOrganization);
  const queryClient = useQueryClient();

  const switchOrganization = useCallback(
    (id: string) => {
      const next = organizationsMock.find((o) => o.id === id);
      if (!next || next.id === organization.id) return;
      // Purge le cache de l'organisation quittée AVANT le changement d'état.
      queryClient.removeQueries({ queryKey: organizationRootKey(organization.id) });
      setOrganization(next);
    },
    [organization.id, queryClient],
  );

  const value = useMemo<SessionApi>(
    () => ({
      session: sessionForOrganization(organization),
      scope: { organizationId: organization.id },
      organizations: organizationsMock,
      switchOrganization,
    }),
    [organization, switchOrganization],
  );

  return <SessionCtx.Provider value={value}>{children}</SessionCtx.Provider>;
}

export function useSession(): SessionApi {
  const ctx = useContext(SessionCtx);
  if (!ctx) throw new Error("useSession doit être utilisé dans SessionProvider.");
  return ctx;
}
