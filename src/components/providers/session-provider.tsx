import { useQueryClient } from "@tanstack/react-query";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { CreateOrganizationScreen, SignInScreen } from "@/components/providers/auth-gate";
import { Skeleton } from "@/components/ui/skeleton";
import { organizationRootKey } from "@/lib/tenancy/keys";
import { initialsFrom } from "@/lib/tenancy/types";
import type { Organization, Scope, Session } from "@/lib/tenancy/types";
import * as authService from "@/services/auth";
import type { AuthUser, MembershipEntry } from "@/services/auth";

interface SessionApi {
  session: Session;
  scope: Scope;
  organizations: Organization[];
  switchOrganization: (id: string) => void;
  signOut: () => Promise<void>;
}

const SessionCtx = createContext<SessionApi | null>(null);

const ACTIVE_ORG_KEY = "nassflow.activeOrganizationId";

type GateState = "loading" | "signedOut" | "noOrg" | "ready";

function readStoredOrganizationId(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(ACTIVE_ORG_KEY);
}

function storeOrganizationId(id: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ACTIVE_ORG_KEY, id);
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [state, setState] = useState<GateState>("loading");
  const [user, setUser] = useState<AuthUser | null>(null);
  const [memberships, setMemberships] = useState<MembershipEntry[]>([]);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const reloadingRef = useRef(false);

  const reload = useCallback(async () => {
    if (reloadingRef.current) return;
    reloadingRef.current = true;
    try {
      const currentUser = await authService.getCurrentUser();
      if (!currentUser) {
        setUser(null);
        setMemberships([]);
        setOrganizationId(null);
        setState("signedOut");
        return;
      }
      setUser(currentUser);

      const entries = await authService.getMemberships();
      setMemberships(entries);
      if (entries.length === 0) {
        setOrganizationId(null);
        setState("noOrg");
        return;
      }

      const stored = readStoredOrganizationId();
      const active =
        entries.find((entry) => entry.organization.id === stored) ?? (entries[0] as MembershipEntry);
      setOrganizationId(active.organization.id);
      storeOrganizationId(active.organization.id);
      setState("ready");
    } catch {
      setState("signedOut");
    } finally {
      reloadingRef.current = false;
    }
  }, []);

  useEffect(() => {
    void reload();
    // Le callback ne doit lancer AUCUN appel Supabase dans le contexte verrouillé.
    return authService.onAuthChange(() => {
      setTimeout(() => {
        void reload();
      }, 0);
    });
  }, [reload]);

  const switchOrganization = useCallback(
    (id: string) => {
      if (!organizationId || id === organizationId) return;
      if (!memberships.some((entry) => entry.organization.id === id)) return;
      // Purge le cache de l'organisation quittée AVANT le changement d'état.
      queryClient.removeQueries({ queryKey: organizationRootKey(organizationId) });
      storeOrganizationId(id);
      setOrganizationId(id);
    },
    [memberships, organizationId, queryClient],
  );

  const signOut = useCallback(async () => {
    await authService.signOut();
    queryClient.clear();
    setUser(null);
    setMemberships([]);
    setOrganizationId(null);
    setState("signedOut");
  }, [queryClient]);

  const activeMembership =
    memberships.find((entry) => entry.organization.id === organizationId) ?? null;

  const value = useMemo<SessionApi | null>(() => {
    if (!user || !activeMembership) return null;
    const organization = activeMembership.organization;
    return {
      session: {
        userId: user.id,
        name: user.fullName ?? user.email,
        email: user.email,
        initials: initialsFrom(user.fullName, user.email),
        jobTitle: user.jobTitle ?? "",
        organization,
        role: activeMembership.role,
      },
      scope: { organizationId: organization.id },
      organizations: memberships.map((entry) => entry.organization),
      switchOrganization,
      signOut,
    };
  }, [user, activeMembership, memberships, switchOrganization, signOut]);

  if (state === "loading" || !value) {
    if (state === "signedOut") return <SignInScreen />;
    if (state === "noOrg")
      return (
        <CreateOrganizationScreen
          onCreated={() => {
            void reload();
          }}
          onSignOut={() => {
            void signOut();
          }}
        />
      );
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <Skeleton className="h-24 w-full max-w-sm" />
      </div>
    );
  }

  return <SessionCtx.Provider value={value}>{children}</SessionCtx.Provider>;
}

export function useSession(): SessionApi {
  const ctx = useContext(SessionCtx);
  if (!ctx) throw new Error("useSession doit être utilisé dans SessionProvider.");
  return ctx;
}
