import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Copy,
  History,
  ListOrdered,
  PauseCircle,
  PlayCircle,
  Variable,
  Workflow as WorkflowIcon,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { EmptyState } from "@/components/common/empty-state";
import { MissionSummaryCard } from "@/components/dashboard/mission-summary-card";
import { useContextPanelContent } from "@/components/layout/context-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { WorkflowRunList } from "@/components/workflows/workflow-runs";
import { WorkflowSequence } from "@/components/workflows/workflow-sequence";
import { WorkflowSummaryPanel } from "@/components/workflows/workflow-summary-panel";
import {
  TRIGGER_KIND,
  VARIABLE_TYPE,
  WORKFLOW_STATUS,
  formatDuration,
  formatRelative,
} from "@/lib/workflows/meta";
import { workflowAgentById, workflowById, workflowMissions } from "@/lib/workflows/mocks";
import type { RunStatusFilter } from "@/lib/workflows/types";

const DESCRIPTION =
  "Détail technique d'un workflow : déclenchement, séquence de nœuds, variables, historique d'exécutions et missions liées.";

export const Route = createFileRoute("/workflow-engine/$workflowId")({
  head: () => ({
    meta: [
      { title: "Détail de workflow — Workflow Engine — NASSFLOW OS" },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: "Détail de workflow — Workflow Engine — NASSFLOW OS" },
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
  const { workflowId } = Route.useParams();
  const workflow = workflowById(workflowId);
  const navigate = useNavigate();
  // État du module : loading / error / success (mock statique).
  const [state] = useState<"loading" | "error" | "success">("success");
  const [runFilter, setRunFilter] = useState<RunStatusFilter>("all");

  useContextPanelContent(
    () => (workflow ? <WorkflowSummaryPanel workflow={workflow} /> : null),
    [workflow?.id],
  );

  if (!workflow) {
    return (
      <section className="col-span-12 min-w-0">
        <EmptyState
          icon={WorkflowIcon}
          title="Workflow introuvable"
          description="Ce workflow n'existe pas ou a été supprimé du moteur."
        />
        <div className="flex justify-center">
          <Button variant="secondary" size="sm" asChild>
            <Link to="/workflow-engine">Retour au Workflow Engine</Link>
          </Button>
        </div>
      </section>
    );
  }

  const status = WORKFLOW_STATUS[workflow.status];
  const trigger = TRIGGER_KIND[workflow.triggerKind];
  const StatusIcon = status.icon;
  const TriggerIcon = trigger.icon;
  const agent = workflowAgentById(workflow.agentId);
  const missions = workflowMissions(workflow.relatedMissionIds);
  const isActive = workflow.status === "active";

  return (
    <>
      <section className="col-span-12 min-w-0 space-y-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/workflow-engine">
            <ArrowLeft />
            Retour au Workflow Engine
          </Link>
        </Button>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 space-y-2">
            <h1 className="text-foreground">{workflow.name}</h1>
            <p className="text-[14px] leading-6 text-muted-foreground">{workflow.description}</p>
            <div className="flex flex-wrap gap-1">
              <Badge variant={status.variant}>
                <StatusIcon aria-hidden="true" />
                {status.label}
              </Badge>
              <Badge variant={trigger.variant}>
                <TriggerIcon aria-hidden="true" />
                {trigger.label}
              </Badge>
              <Badge variant="neutral">{workflow.successRate}% de réussite</Badge>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={() => toast.success(`Exécution lancée : ${workflow.name} (mock)`)}
            >
              <PlayCircle />
              Exécuter maintenant
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() =>
                toast(
                  isActive
                    ? `Workflow suspendu : ${workflow.name} (mock)`
                    : `Workflow activé : ${workflow.name} (mock)`,
                )
              }
            >
              {isActive ? <PauseCircle /> : <PlayCircle />}
              {isActive ? "Suspendre" : "Activer"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toast.success(`Workflow dupliqué : ${workflow.name} (mock)`)}
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
          <div className="space-y-6 rounded-xl border border-border bg-surface p-6">
            <div className="space-y-2">
              <h2 className="flex items-center gap-2 text-[14px] font-medium text-foreground">
                <Zap className="size-4 text-muted-foreground" aria-hidden="true" />
                Déclenchement
              </h2>
              <Card className="grid gap-3 border-border bg-card p-4 @2xl:grid-cols-3">
                <div className="min-w-0">
                  <p className="text-[12px] text-muted-foreground">Type de déclencheur</p>
                  <p className="text-[14px] text-foreground">{trigger.label}</p>
                </div>
                <div className="min-w-0">
                  <p className="text-[12px] text-muted-foreground">Planification</p>
                  <p className="text-[14px] text-foreground">
                    {workflow.scheduleExpression ?? "Aucune planification"}
                  </p>
                </div>
                <div className="min-w-0">
                  <p className="text-[12px] text-muted-foreground">Dernière exécution</p>
                  <p className="text-[14px] text-foreground">
                    {formatRelative(workflow.lastRunAt)} · durée moyenne{" "}
                    {formatDuration(workflow.avgDurationMs || null)}
                  </p>
                </div>
              </Card>
            </div>

            <Separator />

            <div className="space-y-2">
              <h2 className="flex items-center gap-2 text-[14px] font-medium text-foreground">
                <ListOrdered className="size-4 text-muted-foreground" aria-hidden="true" />
                Séquence
              </h2>
              {workflow.nodes.length === 0 ? (
                <p className="text-[14px] text-muted-foreground">
                  Aucun nœud défini pour ce workflow.
                </p>
              ) : (
                <WorkflowSequence nodes={workflow.nodes} />
              )}
            </div>

            <Separator />

            <div className="space-y-2">
              <h2 className="flex items-center gap-2 text-[14px] font-medium text-foreground">
                <Variable className="size-4 text-muted-foreground" aria-hidden="true" />
                Variables
              </h2>
              {workflow.variables.length === 0 ? (
                <p className="text-[14px] text-muted-foreground">
                  Aucune variable configurée.
                </p>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-border">
                  <table className="w-full min-w-[420px] text-left text-[14px]">
                    <thead>
                      <tr className="border-b border-border bg-card">
                        <th className="px-3 py-2 text-[12px] font-medium text-muted-foreground">
                          Nom
                        </th>
                        <th className="px-3 py-2 text-[12px] font-medium text-muted-foreground">
                          Type
                        </th>
                        <th className="px-3 py-2 text-[12px] font-medium text-muted-foreground">
                          Valeur par défaut
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {workflow.variables.map((variable) => (
                        <tr key={variable.name} className="border-b border-border last:border-0">
                          <td className="px-3 py-2 font-medium text-foreground">
                            {variable.name}
                          </td>
                          <td className="px-3 py-2 text-muted-foreground">
                            {VARIABLE_TYPE[variable.type]}
                          </td>
                          <td className="px-3 py-2 text-muted-foreground">
                            {variable.defaultValue || "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <Separator />

            <div className="space-y-2">
              <h2 className="flex items-center gap-2 text-[14px] font-medium text-foreground">
                <History className="size-4 text-muted-foreground" aria-hidden="true" />
                Historique d'exécutions
              </h2>
              {workflow.runs.length === 0 ? (
                <p className="text-[14px] text-muted-foreground">
                  Ce workflow n'a jamais été exécuté.
                </p>
              ) : (
                <WorkflowRunList
                  runs={workflow.runs}
                  filter={runFilter}
                  onFilterChange={setRunFilter}
                />
              )}
            </div>

            <Separator />

            <div className="space-y-2">
              <h2 className="text-[14px] font-medium text-foreground">Missions liées</h2>
              {missions.length === 0 ? (
                <p className="text-[14px] text-muted-foreground">
                  Aucune mission ne s'appuie sur ce workflow pour le moment.
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-3 @2xl:grid-cols-2">
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
            </div>

            {agent ? (
              <>
                <Separator />
                <div className="space-y-2">
                  <h2 className="text-[14px] font-medium text-foreground">Agent responsable</h2>
                  <button
                    type="button"
                    onClick={() =>
                      navigate({ to: "/agents/$agentId", params: { agentId: agent.id } })
                    }
                    className="flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-left transition-colors duration-150 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <span className="text-[14px] font-medium text-foreground">{agent.name}</span>
                    <span className="text-[12px] text-muted-foreground">{agent.role}</span>
                  </button>
                </div>
              </>
            ) : null}
          </div>
        )}
      </section>
    </>
  );
}