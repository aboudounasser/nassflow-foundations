import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowLeft, Copy, History, ListTree, PlayCircle, Target, TriangleAlert } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { EmptyState } from "@/components/common/empty-state";
import { PRIORITY_BADGE } from "@/components/dashboard/decision-item-card";
import { WidgetShell } from "@/components/dashboard/widget-shell";
import { useContextPanelContent } from "@/components/layout/context-panel";
import { MissionDetailPanel } from "@/components/missions/mission-detail-panel";
import {
  EnrichedTimeline,
  OrchestrationDiagram,
  OrchestrationSkeleton,
  ReplayControls,
  TimelineSkeleton,
  buildTimeline,
  useReplay,
} from "@/components/missions/mission-run-view";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MISSION_STATUS } from "@/lib/missions/meta";
import { useMission } from "@/lib/missions/queries";
import type { MissionEventType } from "@/lib/missions/types";

const DESCRIPTION =
  "Vue plein écran d'une mission : orchestration des agents, timeline enrichie et replay pas à pas.";

export const Route = createFileRoute("/missions/$missionId")({
  head: () => ({
    meta: [
      { title: "Détail de mission — NASSFLOW OS" },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: "Détail de mission — NASSFLOW OS" },
      { property: "og:description", content: DESCRIPTION },
    ],
  }),
  component: Page,
});

function Page() {
  const { missionId } = Route.useParams();
  const missionQuery = useMission(missionId);
  const mission = missionQuery.data?.mission ?? null;
  const allMissions = useMemo(() => missionQuery.data?.allMissions ?? [], [missionQuery.data]);
  const agents = useMemo(() => missionQuery.data?.agents ?? [], [missionQuery.data]);
  const [filters, setFilters] = useState<MissionEventType[]>([]);

  const events = useMemo(() => (mission ? buildTimeline(mission) : []), [mission]);
  const replay = useReplay(events.length);
  const current = events[replay.index];

  const activeStepId = useMemo(() => {
    if (!mission || !current) return null;
    const byTitle = mission.steps.find((s) => current.event.includes(s.title));
    if (byTitle) return byTitle.id;
    if (current.type === "step" || current.type === "tool_call") {
      const byAgent = mission.steps.find((s) => s.agentId === current.agentId);
      return byAgent?.id ?? null;
    }
    return null;
  }, [mission, current]);

  useContextPanelContent(
    () => (mission ? <MissionDetailPanel mission={mission} allMissions={allMissions} /> : null),
    [mission?.id, allMissions],
  );

  if (missionQuery.isError) {
    return (
      <section className="col-span-12 min-w-0">
        <Card className="border-border bg-card p-4">
          <EmptyState
            icon={TriangleAlert}
            title="Impossible de charger la mission"
            description="Les données de la mission n'ont pas pu être récupérées. Réessayez."
          />
          <div className="flex justify-center">
            <Button type="button" size="sm" onClick={() => void missionQuery.refetch()}>
              Réessayer
            </Button>
          </div>
        </Card>
      </section>
    );
  }

  if (missionQuery.isPending) {
    return (
      <>
        <section className="col-span-12">
          <OrchestrationSkeleton />
        </section>
        <section className="col-span-12">
          <TimelineSkeleton />
        </section>
      </>
    );
  }

  if (!mission) {
    return (
      <section className="col-span-12">
        <EmptyState
          icon={Target}
          title="Mission introuvable"
          description="Cette mission n'existe pas ou a été supprimée."
        />
        <div className="flex justify-center">
          <Button variant="secondary" size="sm" asChild>
            <Link to="/missions">Retour aux Missions</Link>
          </Button>
        </div>
      </section>
    );
  }

  const status = MISSION_STATUS[mission.status];
  const priority = PRIORITY_BADGE[mission.priority];
  const StatusIcon = status.icon;

  const hasSteps = mission.steps.length > 0;
  const hasEvents = events.length > 0;
  const diagramState = hasSteps ? "success" : "empty";
  const timelineState = hasEvents ? "success" : "empty";

  return (
    <>
      <section className="col-span-12 space-y-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/missions">
            <ArrowLeft />
            Retour aux Missions
          </Link>
        </Button>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 space-y-2">
            <h1 className="text-foreground">{mission.title}</h1>
            <div className="flex flex-wrap gap-1">
              <Badge variant={status.variant}>
                <StatusIcon aria-hidden="true" />
                {status.label}
              </Badge>
              <Badge variant={priority.variant}>{priority.label}</Badge>
              {mission.tags.map((tag) => (
                <Badge key={tag}>{tag}</Badge>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={() => toast.success(`Mission relancée : ${mission.title}`)}
            >
              <PlayCircle />
              Relancer la Mission
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => toast.success(`Mission clonée : ${mission.title}`)}
            >
              <Copy />
              Cloner la Mission
            </Button>
          </div>
        </div>
      </section>

      <section className="col-span-12">
        <WidgetShell
          title="Orchestration Engine"
          description="Collaboration entre agents : séquences et branches parallèles."
          icon={ListTree}
          state={diagramState}
          showMenu={false}
          emptyIcon={Target}
          emptyTitle="Aucune étape définie pour cette mission"
          skeleton={<OrchestrationSkeleton />}
        >
          <OrchestrationDiagram
            mission={mission}
            agents={agents}
            activeStepId={activeStepId}
          />
        </WidgetShell>
      </section>

      <section className="col-span-12">
        <WidgetShell
          title="Replay"
          description="Rejouez la mission événement par événement."
          icon={PlayCircle}
          state={timelineState}
          showMenu={false}
          emptyIcon={History}
          emptyTitle="Aucun événement à rejouer"
        >
          <ReplayControls
            events={events}
            index={replay.index}
            playing={replay.playing}
            onIndexChange={replay.setIndex}
            onTogglePlay={replay.togglePlay}
            onReset={replay.reset}
            mission={mission}
            agents={agents}
          />
        </WidgetShell>
      </section>

      <section className="col-span-12">
        <WidgetShell
          title="Timeline"
          description="Historique complet : étapes, décisions, appels d'outils et handoffs."
          icon={History}
          state={timelineState}
          showMenu={false}
          emptyIcon={History}
          emptyTitle="Aucun historique pour cette mission"
          skeleton={<TimelineSkeleton />}
        >
          <EnrichedTimeline
            events={events}
            activeKey={current?.key ?? null}
            onSelect={(event) => replay.setIndex(events.findIndex((e) => e.key === event.key))}
            filters={filters}
            onToggleFilter={(type) =>
              setFilters((prev) =>
                prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
              )
            }
            onResetFilters={() => setFilters([])}
          />
        </WidgetShell>
      </section>
    </>
  );
}
