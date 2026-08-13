import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
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

import { OnboardingScreen } from "@/components/auth/onboarding-screen";
import { PendingInvitationsScreen } from "@/components/auth/pending-invitations-screen";
import { Skeleton } from "@/components/ui/skeleton";
import type { MyPendingInvitation } from "@/lib/invitations/types";
import * as invitationsService from "@/services/invitations";
import { organizationRootKey } from "@/lib/tenancy/keys";
import { initialsFrom } from "@/lib/tenancy/types";
import type { Scope, Session } from "@/lib/tenancy/types";
import type { MemberRoleDb } from "@/lib/supabase/database.types";
import * as authService from "@/services/auth";
import type { AuthUser, MembershipEntry } from "@/services/auth";

interface OrganizationWithRole {
  id: string;
  name: string;
  role: MemberRoleDb;
}

interface SessionApi {
  session: Session;
  scope: Scope;
  organizations: OrganizationWithRole[];
  switchOrganization: (id: string) => void;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}

const SessionCtx = createContext<SessionApi | null>(null);

/**
 * Organisation active persistée entre deux sessions.
 * Exportée pour que /invite puisse désigner l'organisation tout juste
 * rejointe avant que ce provider ne monte et ne choisisse à sa place.
 */
export const ACTIVE_ORG_KEY = "nassflow.activeOrganizationId";

type GateState = "loading" | "signedOut" | "noOrg" | "ready";

function readStoredOrganizationId(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(ACTIVE_ORG_KEY);
}

function storeOrganizationId(id: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ACTIVE_ORG_KEY, id);
}

/**
 * Invitations adressées à l'utilisateur, consultées avant de conclure qu'il n'a
 * nulle part où aller. Un échec de lecture ne doit pas condamner le parcours :
 * on retombe alors sur l'onboarding, qui reste une issue valable.
 */
async function loadPendingInvitations(): Promise<MyPendingInvitation[]> {
  try {
    return await invitationsService.getMyPendingInvitations();
  } catch {
    return [];
  }
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [state, setState] = useState<GateState>("loading");
  const [user, setUser] = useState<AuthUser | null>(null);
  const [memberships, setMemberships] = useState<MembershipEntry[]>([]);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [pendingInvitations, setPendingInvitations] = useState<MyPendingInvitation[]>([]);
  /** L'utilisateur a choisi de créer son organisation malgré ses invitations. */
  const [forceOnboarding, setForceOnboarding] = useState(false);
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
        // Consulté AVANT de basculer sur "noOrg" : l'état reste "loading" le
        // temps de la vérification, donc l'onboarding n'apparaît jamais pour
        // être aussitôt remplacé par l'écran d'invitations.
        setPendingInvitations(await loadPendingInvitations());
        setState("noOrg");
        return;
      }
      setPendingInvitations([]);

      const stored = readStoredOrganizationId();
      const active =
        entries.find((entry) => entry.organization.id === stored) ??
        (entries[0] as MembershipEntry);
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

  useEffect(() => {
    if (state === "signedOut") {
      void navigate({ to: "/login", replace: true });
    }
  }, [state, navigate]);

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
    setPendingInvitations([]);
    setForceOnboarding(false);
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
      organizations: memberships.map((entry) => ({
        id: entry.organization.id,
        name: entry.organization.name,
        role: entry.role,
      })),
      switchOrganization,
      signOut,
      refresh: reload,
    };
  }, [user, activeMembership, memberships, switchOrganization, signOut, reload]);

  if (state === "loading" || !value) {
    if (state === "noOrg") {
      if (pendingInvitations.length > 0 && !forceOnboarding)
        return (
          <PendingInvitationsScreen
            invitations={pendingInvitations}
            onJoined={(joinedOrganizationId) => {
              // Même contrat que /invite/$token : l'organisation rejointe est
              // désignée active avant que la session ne soit rechargée.
              storeOrganizationId(joinedOrganizationId);
              void reload();
            }}
            onCreateOrganization={() => setForceOnboarding(true)}
            onSignOut={() => {
              void signOut();
            }}
          />
        );
      return (
        <OnboardingScreen
          onCreated={() => {
            void reload();
          }}
          onSignOut={() => {
            void signOut();
          }}
        />
      );
    }
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
