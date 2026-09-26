import { Link } from "@tanstack/react-router";
import { Link2, Lock } from "lucide-react";

import { EmptyState } from "@/components/common/empty-state";
import { WidgetShell } from "@/components/dashboard/widget-shell";
import { useSession } from "@/components/providers/session-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { WidgetState } from "@/lib/dashboard/types";
import {
  CONNECTION_STATUS,
  connectionAccountLabel,
  providerMeta,
} from "@/lib/integrations-oauth/meta";
import { useConnections } from "@/lib/integrations-oauth/queries";
import type { Connection } from "@/lib/integrations-oauth/types";
import { PRIVILEGED_ROLES } from "@/lib/organization/meta";

/** Les deux comptes dont le Sales Agent a besoin, dans l'ordre du pipeline. */
const PROVIDERS = ["gmail", "hubspot"] as const;

/** Le compte actif du fournisseur, sinon le plus récent — la liste est déjà triée. */
function connectionFor(connections: Connection[], provider: string): Connection | null {
  const ofProvider = connections.filter((connection) => connection.provider === provider);
  return ofProvider.find((connection) => connection.status === "active") ?? ofProvider[0] ?? null;
}

/**
 * « Connexions » de la fiche Sales Agent : Gmail et HubSpot avec leur statut
 * réel (`integrations`), à la place de l'ancienne liste d'outils fictifs.
 * La gestion reste sur l'Integrations Hub.
 */
export function AgentConnections() {
  const { session } = useSession();
  const canRead = PRIVILEGED_ROLES.includes(session.role);
  const connectionsQuery = useConnections();
  const connections = connectionsQuery.data ?? [];

  const state: WidgetState = !canRead
    ? "success"
    : connectionsQuery.isError
      ? "error"
      : connectionsQuery.isPending
        ? "loading"
        : "success";

  return (
    <WidgetShell
      title="Connexions"
      description="Comptes utilisés par l'agent : Gmail pour lire, HubSpot pour envoyer."
      icon={Link2}
      state={state}
      showMenu={false}
      onRetry={() => void connectionsQuery.refetch()}
      headerAction={
        canRead ? (
          <Button asChild size="sm" variant="ghost">
            <Link to="/integrations-hub">Gérer les connexions</Link>
          </Button>
        ) : null
      }
      emptyIcon={Link2}
      emptyTitle="Aucune connexion"
    >
      {!canRead ? (
        <EmptyState
          icon={Lock}
          title="Réservé aux propriétaires et administrateurs."
          className="py-10"
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {PROVIDERS.map((provider) => {
            const meta = providerMeta(provider);
            const ProviderIcon = meta.icon;
            const connection = connectionFor(connections, provider);
            const status = connection ? CONNECTION_STATUS[connection.status] : null;
            const account = connection ? connectionAccountLabel(connection) : null;
            return (
              <li
                key={provider}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-surface p-3"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <ProviderIcon
                    className="size-5 shrink-0 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <p className="truncate text-[14px] text-foreground">
                    {meta.label}
                    {account ? <span className="text-muted-foreground"> — {account}</span> : null}
                  </p>
                </div>
                {status ? (
                  <Badge variant={status.variant}>{status.label}</Badge>
                ) : (
                  <Badge variant="neutral">Non connecté</Badge>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </WidgetShell>
  );
}
