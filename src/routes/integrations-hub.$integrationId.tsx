import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Bot,
  Check,
  PlugZap,
  Plug,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  TriangleAlert,
  Unplug,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { EmptyState } from "@/components/common/empty-state";
import { IntegrationSummaryPanel } from "@/components/integrations/integration-summary-panel";
import { useContextPanelContent } from "@/components/layout/context-panel";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ACCESS_LEVEL } from "@/lib/agents/meta";
import {
  INTEGRATION_STATUS,
  formatIntegrationDate,
  formatSyncRelative,
  integrationInitials,
} from "@/lib/integrations/meta";
import { useIntegration } from "@/lib/integrations/queries";

const DESCRIPTION =
  "Détail d'une intégration : statut de connexion, synchronisation, permissions accordées et agents qui l'utilisent.";

export const Route = createFileRoute("/integrations-hub/$integrationId")({
  head: () => ({
    meta: [
      { title: "Détail d'intégration — Integrations Hub — NASSFLOW OS" },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: "Détail d'intégration — Integrations Hub — NASSFLOW OS" },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function DetailSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-full max-w-md rounded-lg" />
      <Skeleton className="h-40 w-full rounded-lg" />
    </div>
  );
}

function Page() {
  const { integrationId } = Route.useParams();
  const navigate = useNavigate();

  const integrationQuery = useIntegration(integrationId);
  const data = integrationQuery.data ?? null;
  const integration = data?.integration ?? null;
  const usages = data?.agentUsage ?? [];

  useContextPanelContent(
    () => (integration ? <IntegrationSummaryPanel integration={integration} /> : null),
    [integration?.id],
  );

  if (integrationQuery.isError) {
    return (
      <section className="col-span-12 min-w-0">
        <Card className="border-border bg-card p-4">
          <EmptyState
            icon={TriangleAlert}
            title="Impossible de charger cette intégration"
            description="Le détail de l'intégration n'a pas pu être récupéré. Vérifiez votre connexion puis réessayez."
          />
          <div className="flex justify-center">
            <Button type="button" size="sm" onClick={() => void integrationQuery.refetch()}>
              Réessayer
            </Button>
          </div>
        </Card>
      </section>
    );
  }

  if (integrationQuery.isPending) {
    return (
      <section className="col-span-12 min-w-0">
        <DetailSkeleton />
      </section>
    );
  }

  if (!integration) {
    return (
      <section className="col-span-12 min-w-0">
        <EmptyState
          icon={Plug}
          title="Intégration introuvable"
          description="Cette intégration n'existe pas ou a été retirée du catalogue."
        />
        <div className="flex justify-center">
          <Button variant="secondary" size="sm" asChild>
            <Link to="/integrations-hub">Retour à l'Integrations Hub</Link>
          </Button>
        </div>
      </section>
    );
  }

  const status = INTEGRATION_STATUS[integration.status];
  const StatusIcon = status.icon;
  const notInstalled = integration.status === "not_installed";
  const needsReconnect = integration.status === "error" || integration.status === "disconnected";

  return (
    <>
      <section className="col-span-12 min-w-0 space-y-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/integrations-hub">
            <ArrowLeft />
            Retour à l'Integrations Hub
          </Link>
        </Button>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-border bg-card text-[14px] font-medium text-muted-foreground">
              {integrationInitials(integration.name)}
            </span>
            <div className="min-w-0 space-y-2">
              <h1 className="text-foreground">{integration.name}</h1>
              <p className="text-[14px] leading-6 text-muted-foreground">
                {integration.description}
              </p>
              <div className="flex flex-wrap gap-1">
                <Badge variant={status.variant}>
                  <StatusIcon aria-hidden="true" />
                  {status.label}
                </Badge>
                <Badge variant="info">{integration.category}</Badge>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {notInstalled ? (
              <Button
                variant="primary"
                size="sm"
                onClick={() => toast.success(`Connexion de ${integration.name} (mock)`)}
              >
                <Plug />
                Connecter
              </Button>
            ) : null}
            {needsReconnect ? (
              <Button
                variant="primary"
                size="sm"
                onClick={() => toast.success(`Reconnexion de ${integration.name} (mock)`)}
              >
                <RotateCcw />
                Reconnecter
              </Button>
            ) : null}
            {integration.status === "connected" ? (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => toast(`Déconnexion de ${integration.name} (mock)`)}
              >
                <Unplug />
                Déconnecter
              </Button>
            ) : null}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toast(`Test de connexion — ${integration.name} (mock)`)}
            >
              <PlugZap />
              Tester la connexion
            </Button>
          </div>
        </div>
      </section>

      <section className="col-span-12 min-w-0">
        {state === "loading" ? (
          <DetailSkeleton />
        ) : (
          <div className="space-y-6 rounded-xl border border-border bg-surface p-6">
            <div className="space-y-2">
              <h2 className="flex items-center gap-2 text-[14px] font-medium text-foreground">
                <RefreshCw className="size-4 text-muted-foreground" aria-hidden="true" />
                Synchronisation
              </h2>
              {notInstalled ? (
                <p className="text-[14px] text-muted-foreground">
                  Cette intégration n'est pas encore connectée.
                </p>
              ) : (
                <Card className="grid gap-3 border-border bg-card p-4 @2xl:grid-cols-3">
                  <div className="min-w-0">
                    <p className="text-[12px] text-muted-foreground">Fréquence de synchro</p>
                    <p className="text-[14px] text-foreground">
                      {integration.syncFrequency ?? "Synchronisation suspendue"}
                    </p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[12px] text-muted-foreground">Dernière synchro</p>
                    <p className="text-[14px] text-foreground">
                      {formatSyncRelative(integration.lastSyncAt)}
                    </p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[12px] text-muted-foreground">Connectée depuis</p>
                    <p className="text-[14px] text-foreground">
                      {integration.connectedSince
                        ? formatIntegrationDate(integration.connectedSince)
                        : "Connexion inactive"}
                    </p>
                  </div>
                </Card>
              )}
            </div>

            <Separator />

            <div className="space-y-2">
              <h2 className="flex items-center gap-2 text-[14px] font-medium text-foreground">
                <ShieldCheck className="size-4 text-muted-foreground" aria-hidden="true" />
                Permissions
              </h2>
              <p className="text-[12px] text-muted-foreground">
                Lecture seule — l'édition arrivera dans une prochaine itération.
              </p>
              {integration.permissions.length === 0 ? (
                <p className="text-[14px] text-muted-foreground">
                  Aucune permission déclarée pour cette intégration.
                </p>
              ) : (
                <ul className="space-y-2">
                  {integration.permissions.map((permission) => (
                    <li
                      key={permission.scope}
                      className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2"
                    >
                      <span
                        className={
                          permission.granted
                            ? "flex size-6 shrink-0 items-center justify-center rounded-md border border-success/30 bg-success/10"
                            : "flex size-6 shrink-0 items-center justify-center rounded-md border border-border bg-muted"
                        }
                      >
                        {permission.granted ? (
                          <Check className="size-3.5 text-success" aria-hidden="true" />
                        ) : (
                          <X className="size-3.5 text-muted-foreground" aria-hidden="true" />
                        )}
                      </span>
                      <span className="min-w-0 flex-1 text-[14px] text-foreground">
                        {permission.scope}
                      </span>
                      <span className="shrink-0 text-[12px] text-muted-foreground">
                        {permission.granted ? "Accordée" : "Non accordée"}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <Separator />

            <div className="space-y-2">
              <h2 className="flex items-center gap-2 text-[14px] font-medium text-foreground">
                <Bot className="size-4 text-muted-foreground" aria-hidden="true" />
                Agents connectés
              </h2>
              {usages.length === 0 ? (
                <p className="text-[14px] text-muted-foreground">
                  Aucun agent n'utilise cette intégration pour le moment.
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-3 @2xl:grid-cols-2">
                  {usages.map(({ agent, tool }) => {
                    const access = ACCESS_LEVEL[tool.accessLevel];
                    return (
                      <button
                        key={agent.id}
                        type="button"
                        onClick={() =>
                          navigate({ to: "/agents/$agentId", params: { agentId: agent.id } })
                        }
                        className="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-card p-3 text-left transition-colors duration-150 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <Avatar className="size-10 shrink-0">
                          <AvatarFallback className="text-[12px]">{agent.avatar}</AvatarFallback>
                        </Avatar>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[14px] font-medium text-foreground">
                            {agent.name}
                          </span>
                          <span className="block truncate text-[12px] text-muted-foreground">
                            {agent.role}
                          </span>
                          <span className="mt-2 flex flex-wrap gap-1">
                            <Badge variant={access.variant}>{access.label}</Badge>
                            <Badge variant={INTEGRATION_STATUS[tool.status].variant}>
                              {INTEGRATION_STATUS[tool.status].label}
                            </Badge>
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </section>
    </>
  );
}
