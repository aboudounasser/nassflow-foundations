import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Bot,
  Check,
  Copy,
  PauseCircle,
  PlayCircle,
  Target,
  TriangleAlert,
  X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AgentSummaryPanel } from "@/components/agents/agent-summary-panel";
import { AgentConfigTab } from "@/components/agents/agent-config-tab";
import { AgentLogsTab } from "@/components/agents/agent-logs-tab";
import { AgentMemoryTab } from "@/components/agents/agent-memory-tab";
import { EmptyState } from "@/components/common/empty-state";
import { MissionSummaryCard } from "@/components/dashboard/mission-summary-card";
import { useContextPanelContent } from "@/components/layout/context-panel";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useIsMobile } from "@/hooks/use-mobile";
import { ACCESS_LEVEL, AGENT_STATUS, TOOL_STATUS, formatAgentActivity } from "@/lib/agents/meta";
import { useAgent } from "@/lib/agents/queries";
import type { AgentPermission } from "@/lib/agents/types";

const DESCRIPTION =
  "Fiche complète d'un collaborateur IA : identité, capacités, outils, permissions et missions associées.";

export const Route = createFileRoute("/agents/$agentId")({
  head: () => ({
    meta: [
      { title: "Fiche agent — NASSFLOW OS" },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: "Fiche agent — NASSFLOW OS" },
      { property: "og:description", content: DESCRIPTION },
    ],
  }),
  component: Page,
});

const TABS = [
  { value: "overview", label: "Vue générale" },
  { value: "capabilities", label: "Capacités" },
  { value: "tools", label: "Outils" },
  { value: "permissions", label: "Permissions" },
  { value: "missions", label: "Missions" },
  { value: "memory", label: "Mémoire" },
  { value: "logs", label: "Logs" },
  { value: "config", label: "Configuration" },
] as const;

/** Onglets prévus pour les itérations suivantes (architecture prête). */
const FUTURE_TABS = ["Historique"] as const;

function PermissionFlag({ enabled, label }: { enabled: boolean; label: string }) {
  return (
    <span className="flex items-center gap-1 text-[14px]">
      {enabled ? (
        <Check className="size-4 text-success" aria-hidden="true" />
      ) : (
        <X className="size-4 text-muted-foreground/60" aria-hidden="true" />
      )}
      <span className="sr-only">{`${label} : ${enabled ? "autorisé" : "refusé"}`}</span>
    </span>
  );
}

function PermissionRow({ permission }: { permission: AgentPermission }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_repeat(4,44px)] items-center gap-2 border-b border-border px-3 py-3 last:border-0">
      <span className="truncate text-[14px] text-foreground">{permission.resource}</span>
      <PermissionFlag enabled={permission.read} label="Lecture" />
      <PermissionFlag enabled={permission.write} label="Écriture" />
      <PermissionFlag enabled={permission.execute} label="Exécution" />
      <PermissionFlag enabled={permission.approve} label="Validation" />
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-full max-w-md rounded-lg" />
      <Skeleton className="h-24 w-full rounded-lg" />
      <Skeleton className="h-24 w-full rounded-lg" />
    </div>
  );
}

function Page() {
  const { agentId } = Route.useParams();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [tab, setTab] = useState<string>("overview");

  const agentQuery = useAgent(agentId);
  const data = agentQuery.data ?? null;
  const agent = data?.agent ?? null;
  const missions = data?.missions ?? [];
  const collaborators = data?.collaborators ?? [];

  useContextPanelContent(
    () => (agent ? <AgentSummaryPanel agent={agent} missionCount={missions.length} /> : null),
    [agent?.id, missions.length],
  );

  if (agentQuery.isError) {
    return (
      <section className="col-span-12 min-w-0">
        <Card className="border-border bg-card p-4">
          <EmptyState
            icon={TriangleAlert}
            title="Impossible de charger cet agent"
            description="La fiche de l'agent n'a pas pu être récupérée. Vérifiez votre connexion puis réessayez."
          />
          <div className="flex justify-center">
            <Button type="button" size="sm" onClick={() => void agentQuery.refetch()}>
              Réessayer
            </Button>
          </div>
        </Card>
      </section>
    );
  }

  if (agentQuery.isPending) {
    return (
      <section className="col-span-12 min-w-0">
        <DetailSkeleton />
      </section>
    );
  }

  if (!agent) {
    return (
      <section className="col-span-12 min-w-0">
        <EmptyState
          icon={Bot}
          title="Agent introuvable"
          description="Cet agent n'existe pas ou a été retiré de la workforce."
        />
        <div className="flex justify-center">
          <Button variant="secondary" size="sm" asChild>
            <Link to="/agents">Retour à l'AI Workforce</Link>
          </Button>
        </div>
      </section>
    );
  }

  const status = AGENT_STATUS[agent.status];
  const StatusIcon = status.icon;

  return (
    <>
      <section className="col-span-12 min-w-0 space-y-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/agents">
            <ArrowLeft />
            Retour à l'AI Workforce
          </Link>
        </Button>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <Avatar className="size-12 shrink-0">
              <AvatarFallback className="text-[14px]">{agent.avatar}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 space-y-2">
              <h1 className="text-foreground">{agent.name}</h1>
              <p className="text-[14px] text-muted-foreground">{agent.role}</p>
              <div className="flex flex-wrap gap-1">
                <Badge variant={status.variant}>
                  <StatusIcon aria-hidden="true" />
                  {status.label}
                </Badge>
                <Badge variant="info">{agent.domain}</Badge>
                <Badge>{agent.version}</Badge>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => toast(`${agent.name} suspendu (mock)`)}
            >
              <PauseCircle />
              Suspendre
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => toast.success(`${agent.name} redémarré (mock)`)}
            >
              <PlayCircle />
              Redémarrer
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toast(`${agent.name} dupliqué (mock)`)}
            >
              <Copy />
              Dupliquer
            </Button>
          </div>
        </div>
      </section>

      <section className="col-span-12 min-w-0">
        {state === "loading" ? (
          <DetailSkeleton />
        ) : (
          <Tabs value={tab} onValueChange={setTab} className="space-y-4">
            {isMobile ? (
              <Select value={tab} onValueChange={setTab}>
                <SelectTrigger aria-label="Choisir une section">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TABS.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                  {FUTURE_TABS.map((label) => (
                    <SelectItem key={label} value={`soon-${label}`} disabled>
                      {label} · Bientôt
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="overflow-x-auto">
                <TabsList className="h-auto flex-wrap justify-start">
                  {TABS.map((t) => (
                    <TabsTrigger key={t.value} value={t.value}>
                      {t.label}
                    </TabsTrigger>
                  ))}
                  {FUTURE_TABS.map((label) => (
                    <TabsTrigger key={label} value={`soon-${label}`} disabled>
                      {label}
                      <Badge className="ml-2">Bientôt</Badge>
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>
            )}

            <TabsContent value="overview" className="space-y-6">
              <p className="text-[14px] leading-6 text-muted-foreground">{agent.description}</p>

              <div className="@container">
                <div className="grid grid-cols-2 gap-4 @2xl:grid-cols-3 @5xl:grid-cols-4">
                  {agent.kpis.map((kpi) => (
                    <Card key={kpi.label} className="border-border bg-surface p-4">
                      <p className="truncate text-[12px] uppercase tracking-wide text-muted-foreground">
                        {kpi.label}
                      </p>
                      <p className="mt-1 text-[20px] font-medium tabular-nums text-foreground">
                        {kpi.value}
                      </p>
                    </Card>
                  ))}
                  <Card className="border-border bg-surface p-4">
                    <p className="truncate text-[12px] uppercase tracking-wide text-muted-foreground">
                      Disponibilité
                    </p>
                    <p className="mt-1 text-[20px] font-medium tabular-nums text-foreground">
                      {agent.uptime}
                    </p>
                  </Card>
                  <Card className="border-border bg-surface p-4">
                    <p className="truncate text-[12px] uppercase tracking-wide text-muted-foreground">
                      Dernière activité
                    </p>
                    <p className="mt-1 text-[14px] text-foreground">
                      {formatAgentActivity(agent.lastActivity)}
                    </p>
                  </Card>
                </div>
              </div>

              <div className="space-y-2">
                <h2 className="text-[14px] font-medium text-foreground">Collabore avec</h2>
                {collaborators.length === 0 ? (
                  <EmptyState icon={Bot} title="Aucune collaboration déclarée." />
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {collaborators.map((co) => (
                      <button
                        key={co.id}
                        type="button"
                        onClick={() =>
                          navigate({ to: "/agents/$agentId", params: { agentId: co.id } })
                        }
                        className="flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-left transition-colors duration-150 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <Avatar className="size-8">
                          <AvatarFallback className="text-[10px]">{co.avatar}</AvatarFallback>
                        </Avatar>
                        <span className="min-w-0">
                          <span className="block truncate text-[14px] text-foreground">
                            {co.name}
                          </span>
                          <span className="block truncate text-[12px] text-muted-foreground">
                            {co.domain}
                          </span>
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="capabilities">
              <ul className="space-y-3">
                {agent.capabilities.map((cap) => (
                  <li key={cap.id} className="rounded-lg border border-border bg-surface p-4">
                    <p className="text-[14px] font-medium text-foreground">{cap.label}</p>
                    <p className="mt-1 text-[14px] leading-6 text-muted-foreground">
                      {cap.description}
                    </p>
                  </li>
                ))}
              </ul>
            </TabsContent>

            <TabsContent value="tools">
              <div className="@container">
                <div className="grid grid-cols-1 gap-4 @2xl:grid-cols-2 @5xl:grid-cols-3">
                  {agent.tools.map((tool) => {
                    const access = ACCESS_LEVEL[tool.accessLevel];
                    const toolStatus = TOOL_STATUS[tool.status];
                    const ToolIcon = toolStatus.icon;
                    return (
                      <div
                        key={tool.id}
                        className="space-y-2 rounded-lg border border-border bg-surface p-4"
                      >
                        <p className="truncate text-[14px] font-medium text-foreground">
                          {tool.name}
                        </p>
                        <div className="flex flex-wrap gap-1">
                          <Badge>{tool.category}</Badge>
                          <Badge variant={access.variant}>{access.label}</Badge>
                          <Badge variant={toolStatus.variant}>
                            <ToolIcon aria-hidden="true" />
                            {toolStatus.label}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="permissions">
              <div className="overflow-x-auto rounded-lg border border-border bg-surface">
                <div className="min-w-[420px]">
                  <div className="grid grid-cols-[minmax(0,1fr)_repeat(4,44px)] items-center gap-2 border-b border-border px-3 py-2 text-[12px] uppercase tracking-wide text-muted-foreground">
                    <span>Ressource</span>
                    <span>Lect.</span>
                    <span>Écr.</span>
                    <span>Exéc.</span>
                    <span>Valid.</span>
                  </div>
                  {agent.permissions.map((p) => (
                    <PermissionRow key={p.resource} permission={p} />
                  ))}
                </div>
              </div>
              <p className="mt-2 text-[12px] text-muted-foreground">
                Lecture seule — l'édition des permissions arrivera dans une prochaine itération.
              </p>
            </TabsContent>

            <TabsContent value="missions">
              {missions.length === 0 ? (
                <EmptyState
                  icon={Target}
                  title="Aucune mission associée"
                  description="Cet agent n'intervient dans aucune mission pour l'instant."
                />
              ) : (
                <div className="flex flex-col gap-3">
                  {missions.map((mission) => (
                    <MissionSummaryCard
                      key={mission.id}
                      mission={mission}
                      onSelect={() =>
                        navigate({
                          to: "/missions/$missionId",
                          params: { missionId: mission.id },
                        })
                      }
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="memory">
              <AgentMemoryTab memory={agent.memory} />
            </TabsContent>

            <TabsContent value="logs">
              <AgentLogsTab logs={agent.logs} />
            </TabsContent>

            <TabsContent value="config">
              <AgentConfigTab config={agent.config} tools={agent.tools} />
            </TabsContent>
          </Tabs>
        )}
      </section>
    </>
  );
}
