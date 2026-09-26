import { Link2, TriangleAlert } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { EmptyState } from "@/components/common/empty-state";
import { WidgetShell } from "@/components/dashboard/widget-shell";
import { useSession } from "@/components/providers/session-provider";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { WidgetState } from "@/lib/dashboard/types";
import {
  useConnections,
  useDisconnectGmail,
  useStartGmailConnection,
  useStartHubspotConnection,
} from "@/lib/integrations-oauth/queries";
import {
  CONNECTION_STATUS,
  connectionAccountLabel,
  formatConnectionDate,
  providerMeta,
} from "@/lib/integrations-oauth/meta";
import type { Connection } from "@/lib/integrations-oauth/types";
import { cn } from "@/lib/utils";

/** Rôles autorisés à lire la table `integrations`, ouvrir un parcours OAuth et en révoquer un. */
const CONNECT_ROLES = ["owner", "admin"];

const DISCONNECT_FALLBACK_ERROR = "La déconnexion n'a pas abouti.";

/**
 * Conséquences annoncées avant la déconnexion. Pour HubSpot, seul notre jeton
 * est supprimé : l'app reste installée côté HubSpot tant que
 * `disconnect-hubspot` n'existe pas — autant le dire que laisser croire à une
 * révocation complète.
 */
const DISCONNECT_DESCRIPTION: Record<string, string> = {
  gmail:
    "L'accès à cette boîte sera révoqué et les analyses ne pourront plus être lancées. Les prospects déjà trouvés restent consultables dans Missions.",
  hubspot:
    "NASSFLOW n'aura plus accès à ce portail et les prospects ne pourront plus être envoyés dans le CRM. L'application restera visible dans vos paramètres HubSpot.",
};

function ConnectionsSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <Skeleton className="h-16 w-full rounded-lg" />
      <Skeleton className="h-16 w-full rounded-lg" />
    </div>
  );
}

/**
 * Une ligne de compte connecté.
 *
 * La déconnexion n'est proposée qu'aux rôles que l'Edge Function
 * `disconnect-gmail` accepte (elle sert aussi aux lignes HubSpot), et disparaît une fois le compte révoqué : une
 * intégration déjà coupée n'a plus d'action à offrir, seulement un état à
 * montrer — atténué plutôt que masqué, l'historique des analyses continuant
 * d'y faire référence.
 */
function ConnectionRow({ connection }: { connection: Connection }) {
  const { session } = useSession();
  const disconnectMutation = useDisconnectGmail();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const provider = providerMeta(connection.provider);
  const status = CONNECTION_STATUS[connection.status];
  const ProviderIcon = provider.icon;

  const revoked = connection.status === "revoked";
  const canDisconnect = CONNECT_ROLES.includes(session.role) && !revoked;
  const accountLabel = connectionAccountLabel(connection);
  const label = accountLabel ?? provider.label;

  const disconnect = () => {
    disconnectMutation.mutate(connection.id, {
      onSuccess: () => toast.success(`Le compte ${label} a été déconnecté`),
      // Message rédigé pour l'utilisateur final par l'Edge Function : affiché tel quel.
      onError: (e) => toast.error(e instanceof Error ? e.message : DISCONNECT_FALLBACK_ERROR),
    });
    setConfirmOpen(false);
  };

  return (
    <li
      className={cn(
        "flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-surface p-3",
        revoked && "opacity-60",
      )}
    >
      <div className="flex min-w-0 items-center gap-2">
        <ProviderIcon className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
        <div className="min-w-0">
          <p className="truncate text-[14px] text-foreground">
            {provider.label}
            {accountLabel ? <span className="text-muted-foreground"> — {accountLabel}</span> : null}
          </p>
          <p className="text-[12px] text-muted-foreground">
            Connecté le {formatConnectionDate(connection.createdAt)}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Badge variant={status.variant}>{status.label}</Badge>
        {canDisconnect ? (
          <>
            <Button
              type="button"
              size="sm"
              variant="destructive"
              loading={disconnectMutation.isPending}
              disabled={disconnectMutation.isPending}
              onClick={() => setConfirmOpen(true)}
            >
              Déconnecter
            </Button>
            <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Déconnecter {label} ?</AlertDialogTitle>
                  <AlertDialogDescription>
                    {DISCONNECT_DESCRIPTION[connection.provider] ?? DISCONNECT_DESCRIPTION["gmail"]}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={disconnectMutation.isPending}>
                    Annuler
                  </AlertDialogCancel>
                  <AlertDialogAction
                    className={buttonVariants({ variant: "destructive" })}
                    onClick={disconnect}
                  >
                    Déconnecter
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        ) : null}
      </div>
    </li>
  );
}

/**
 * Comptes externes réellement raccordés à l'organisation.
 * Les actions de connexion ne sont proposées qu'aux rôles que les Edge
 * Functions `gmail-oauth-start` et `hubspot-oauth-start` acceptent : masquer
 * les boutons ailleurs évite un 403 promis d'avance, la vérification faisant
 * autorité restant côté serveur.
 *
 * Une entreprise n'a qu'un CRM : le bouton HubSpot disparaît dès qu'un portail
 * est actif. Le 409 de `hubspot-oauth-start` reste le garde-fou.
 */
export function ConnectedAccountsSection() {
  const { session } = useSession();
  const connectionsQuery = useConnections();
  const startMutation = useStartGmailConnection();
  const startHubspotMutation = useStartHubspotConnection();

  const canConnect = CONNECT_ROLES.includes(session.role);
  const connections = connectionsQuery.data ?? [];
  const hasActiveHubspot = connections.some(
    (connection) => connection.provider === "hubspot" && connection.status === "active",
  );

  const connect = () => {
    startMutation.mutate(undefined, {
      // Redirection complète : Google refuse d'être chargé dans l'application.
      onSuccess: (authUrl) => {
        window.location.href = authUrl;
      },
      onError: (e) =>
        toast.error(e instanceof Error ? e.message : "Connexion Gmail impossible. Réessayez."),
    });
  };

  const connectHubspot = () => {
    startHubspotMutation.mutate(undefined, {
      // Redirection complète, comme pour Google.
      onSuccess: (authUrl) => {
        window.location.href = authUrl;
      },
      // Message rédigé par l'Edge Function (409 notamment) : affiché tel quel.
      onError: (e) =>
        toast.error(e instanceof Error ? e.message : "Connexion HubSpot impossible. Réessayez."),
    });
  };

  // L'erreur est rendue dans le corps du widget plutôt que par l'état "error"
  // du shell, afin de conserver le bouton de connexion dans l'en-tête : celui-ci
  // ne dépend pas de la lecture qui vient d'échouer.
  const state: WidgetState = connectionsQuery.isPending
    ? "loading"
    : connectionsQuery.isError || connections.length > 0
      ? "success"
      : "empty";

  return (
    <WidgetShell
      title="Comptes connectés"
      description="Comptes externes raccordés à cette organisation par autorisation OAuth."
      icon={Link2}
      state={state}
      showMenu={false}
      headerAction={
        canConnect ? (
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" size="sm" loading={startMutation.isPending} onClick={connect}>
              Connecter Gmail
            </Button>
            {!hasActiveHubspot ? (
              <Button
                type="button"
                size="sm"
                loading={startHubspotMutation.isPending}
                onClick={connectHubspot}
              >
                Connecter HubSpot
              </Button>
            ) : null}
          </div>
        ) : null
      }
      emptyIcon={Link2}
      emptyTitle="Aucun compte connecté"
      emptyDescription={
        canConnect
          ? "Connectez Gmail ou HubSpot pour que vos agents puissent y accéder."
          : "Seuls les propriétaires et administrateurs peuvent consulter et connecter des comptes."
      }
      skeleton={<ConnectionsSkeleton />}
    >
      {connectionsQuery.isError ? (
        <>
          <EmptyState
            icon={TriangleAlert}
            title="Impossible de charger les comptes connectés"
            description="La liste n'a pas pu être récupérée. Vérifiez votre connexion puis réessayez."
            className="py-10"
          />
          <div className="flex justify-center">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => void connectionsQuery.refetch()}
            >
              Réessayer
            </Button>
          </div>
        </>
      ) : (
        <ul className="flex flex-col gap-3">
          {connections.map((connection) => (
            <ConnectionRow key={connection.id} connection={connection} />
          ))}
        </ul>
      )}
    </WidgetShell>
  );
}
