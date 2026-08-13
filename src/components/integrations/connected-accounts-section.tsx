import { Link2, TriangleAlert } from "lucide-react";
import { toast } from "sonner";

import { EmptyState } from "@/components/common/empty-state";
import { WidgetShell } from "@/components/dashboard/widget-shell";
import { useSession } from "@/components/providers/session-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { WidgetState } from "@/lib/dashboard/types";
import { useConnections, useStartGmailConnection } from "@/lib/integrations-oauth/queries";
import {
  CONNECTION_STATUS,
  formatConnectionDate,
  providerMeta,
} from "@/lib/integrations-oauth/meta";
import type { Connection } from "@/lib/integrations-oauth/types";

/** Rôles autorisés à lire la table `integrations` et à ouvrir un parcours OAuth. */
const CONNECT_ROLES = ["owner", "admin"];

function ConnectionsSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <Skeleton className="h-16 w-full rounded-lg" />
      <Skeleton className="h-16 w-full rounded-lg" />
    </div>
  );
}

function ConnectionRow({ connection }: { connection: Connection }) {
  const provider = providerMeta(connection.provider);
  const status = CONNECTION_STATUS[connection.status];
  const ProviderIcon = provider.icon;

  return (
    <li className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-surface p-3">
      <div className="flex min-w-0 items-center gap-2">
        <ProviderIcon className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
        <div className="min-w-0">
          <p className="truncate text-[14px] text-foreground">
            {provider.label}
            {connection.accountEmail ? (
              <span className="text-muted-foreground"> — {connection.accountEmail}</span>
            ) : null}
          </p>
          <p className="text-[12px] text-muted-foreground">
            Connecté le {formatConnectionDate(connection.createdAt)}
          </p>
        </div>
      </div>
      <Badge variant={status.variant}>{status.label}</Badge>
    </li>
  );
}

/**
 * Comptes externes réellement raccordés, par opposition au catalogue mocké.
 * L'action de connexion n'est proposée qu'aux rôles que l'Edge Function
 * `gmail-oauth-start` accepte : masquer le bouton ailleurs évite un 403 promis
 * d'avance, la vérification faisant autorité restant côté serveur.
 */
export function ConnectedAccountsSection() {
  const { session } = useSession();
  const connectionsQuery = useConnections();
  const startMutation = useStartGmailConnection();

  const canConnect = CONNECT_ROLES.includes(session.role);
  const connections = connectionsQuery.data ?? [];

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
          <Button type="button" size="sm" loading={startMutation.isPending} onClick={connect}>
            Connecter Gmail
          </Button>
        ) : null
      }
      emptyIcon={Link2}
      emptyTitle="Aucun compte connecté"
      emptyDescription={
        canConnect
          ? "Connectez un compte Gmail pour que vos agents puissent y accéder."
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
