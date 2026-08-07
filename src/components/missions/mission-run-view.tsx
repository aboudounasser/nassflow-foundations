import {
  ArrowRightLeft,
  CheckCircle2,
  Gavel,
  Pause,
  Play,
  RotateCcw,
  ShieldCheck,
  SkipBack,
  SkipForward,
  TriangleAlert,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { STEP_STATUS, formatDateTime } from "@/lib/missions/meta";
import type {
  MissionAgent,
  MissionDetail,
  MissionEventType,
  MissionHistoryEntry,
  MissionStep,
} from "@/lib/missions/types";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Métadonnées d'événements                                           */
/* ------------------------------------------------------------------ */

export const EVENT_META: Record<
  MissionEventType,
  { label: string; icon: LucideIcon; reasoning: string }
> = {
  step: {
    label: "Étape",
    icon: CheckCircle2,
    reasoning:
      "Cette étape a été déclenchée car les conditions de l'étape précédente étaient réunies dans le plan d'orchestration.",
  },
  decision: {
    label: "Décision",
    icon: Gavel,
    reasoning:
      "L'agent a arbitré entre plusieurs options en pondérant le coût, le délai et le niveau de confiance disponible.",
  },
  tool_call: {
    label: "Appel d'outil",
    icon: Wrench,
    reasoning:
      "L'agent avait besoin de données externes : il a appelé l'outil connecté le plus fiable pour cette source.",
  },
  handoff: {
    label: "Passage de relais",
    icon: ArrowRightLeft,
    reasoning:
      "La compétence requise sortait du périmètre de l'agent : le contexte a été transmis à l'agent spécialisé.",
  },
  validation: {
    label: "Validation",
    icon: ShieldCheck,
    reasoning:
      "Une règle de validation humaine s'appliquait à cette action : l'exécution a été mise en pause pour contrôle.",
  },
  error: {
    label: "Erreur",
    icon: TriangleAlert,
    reasoning:
      "L'action a échoué : l'agent a interrompu la branche concernée pour éviter de propager une donnée invalide.",
  },
};

const RESULT_META = {
  success: { label: "Succès", variant: "success" as const },
  failure: { label: "Échec", variant: "destructive" as const },
  pending: { label: "En cours", variant: "primary" as const },
};

export type TimelineEvent = MissionHistoryEntry & { key: string; type: MissionEventType };

/** Historique normalisé : type par défaut, tri chronologique, clés stables. */
export function buildTimeline(mission: MissionDetail): TimelineEvent[] {
  return mission.history
    .map((entry, index) => ({
      ...entry,
      type: entry.type ?? "step",
      key: `${entry.timestamp}-${index}`,
    }))
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}

function agentOf(mission: MissionDetail, agents: MissionAgent[], id?: string | undefined) {
  if (!id) return undefined;
  return mission.agents.find((a) => a.id === id) ?? agents.find((a) => a.id === id);
}

/* ------------------------------------------------------------------ */
/* Section 1 — Orchestration Engine                                   */
/* ------------------------------------------------------------------ */

const CARD_W = 220;
const GAP = 24;
const BAND_H = 40;

function computeLayers(steps: MissionStep[]): MissionStep[][] {
  const depth = new Map<string, number>();
  steps.forEach((step, index) => {
    const deps =
      step.dependsOn && step.dependsOn.length > 0
        ? step.dependsOn
        : index > 0
          ? [steps[index - 1]!.id]
          : [];
    const level = deps.length === 0 ? 0 : Math.max(...deps.map((d) => (depth.get(d) ?? 0) + 1), 0);
    depth.set(step.id, level);
  });
  const max = Math.max(0, ...[...depth.values()]);
  const layers: MissionStep[][] = Array.from({ length: max + 1 }, () => []);
  steps.forEach((step) => layers[depth.get(step.id) ?? 0]!.push(step));
  return layers;
}

function StepCard({
  step,
  agent,
  active,
}: {
  step: MissionStep;
  agent: MissionAgent | undefined;
  active: boolean;
}) {
  const meta = STEP_STATUS[step.status];
  const Icon = meta.icon;
  const tool = agent?.tools?.[0];
  const showTool = Boolean(tool) && step.status !== "pending";

  return (
    <div
      className={cn(
        "flex w-[220px] shrink-0 flex-col gap-2 rounded-xl border border-border bg-card p-3 transition-shadow",
        active && "border-primary ring-2 ring-primary/40",
        active && step.status === "running" && "animate-pulse",
      )}
    >
      <div className="flex items-start gap-2">
        <Icon className={cn("mt-0.5 size-4 shrink-0", meta.className)} aria-hidden="true" />
        <span className="min-w-0 text-[14px] leading-5 text-foreground">{step.title}</span>
      </div>
      <div className="flex items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-2">
          <Avatar className="size-6">
            <AvatarFallback className="text-[9px]">{agent?.avatar ?? "??"}</AvatarFallback>
          </Avatar>
          <span className="truncate text-[12px] text-muted-foreground">
            {agent?.name ?? "Agent"}
          </span>
        </span>
        {showTool ? <Badge variant="neutral">{tool}</Badge> : null}
      </div>
    </div>
  );
}

export function OrchestrationDiagram({
  mission,
  agents,
  activeStepId,
}: {
  mission: MissionDetail;
  agents: MissionAgent[];
  activeStepId: string | null;
}) {
  const layers = useMemo(() => computeLayers(mission.steps), [mission.steps]);
  const widthOf = (n: number) => n * CARD_W + Math.max(0, n - 1) * GAP;
  const maxWidth = Math.max(...layers.map((l) => widthOf(l.length)), CARD_W);
  const centerX = (layerIndex: number, i: number) => {
    const w = widthOf(layers[layerIndex]!.length);
    return (maxWidth - w) / 2 + i * (CARD_W + GAP) + CARD_W / 2;
  };

  return (
    <div className="overflow-x-auto pb-2">
      <div className="mx-auto flex flex-col items-center" style={{ width: maxWidth }}>
        {layers.map((layer, li) => (
          <div key={li} className="w-full">
            {li > 0 ? (
              <svg
                width={maxWidth}
                height={BAND_H}
                className="block text-border"
                aria-hidden="true"
              >
                {layer.map((step, i) => {
                  const parents = layers[li - 1]!;
                  const deps =
                    step.dependsOn && step.dependsOn.length > 0
                      ? parents.filter((p) => step.dependsOn!.includes(p.id))
                      : parents.slice(0, 1);
                  const targets = deps.length > 0 ? deps : parents.slice(0, 1);
                  return targets.map((parent) => {
                    const px = centerX(li - 1, parents.indexOf(parent));
                    const cx = centerX(li, i);
                    return (
                      <path
                        key={`${parent.id}-${step.id}`}
                        d={`M ${px} 0 V ${BAND_H / 2} H ${cx} V ${BAND_H}`}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={1.5}
                      />
                    );
                  });
                })}
              </svg>
            ) : null}
            <div className="flex justify-center" style={{ gap: GAP }}>
              {layer.map((step) => (
                <StepCard
                  key={step.id}
                  step={step}
                  agent={agentOf(mission, agents, step.agentId)}
                  active={activeStepId === step.id}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function OrchestrationSkeleton() {
  return (
    <div className="flex flex-col items-center gap-6">
      <Skeleton className="h-24 w-[220px] rounded-xl" />
      <div className="flex gap-6">
        <Skeleton className="h-24 w-[220px] rounded-xl" />
        <Skeleton className="h-24 w-[220px] rounded-xl" />
      </div>
      <Skeleton className="h-24 w-[220px] rounded-xl" />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Section 2 — Timeline enrichie                                      */
/* ------------------------------------------------------------------ */

export function EnrichedTimeline({
  events,
  activeKey,
  onSelect,
  filters,
  onToggleFilter,
  onResetFilters,
}: {
  events: TimelineEvent[];
  activeKey: string | null;
  onSelect: (event: TimelineEvent) => void;
  filters: MissionEventType[];
  onToggleFilter: (type: MissionEventType) => void;
  onResetFilters: () => void;
}) {
  const activeRef = useRef<HTMLLIElement | null>(null);

  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [activeKey]);

  const visible = filters.length === 0 ? events : events.filter((e) => filters.includes(e.type));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {(Object.keys(EVENT_META) as MissionEventType[]).map((type) => {
          const meta = EVENT_META[type];
          const on = filters.includes(type);
          return (
            <Button
              key={type}
              size="sm"
              variant={on ? "secondary" : "ghost"}
              aria-pressed={on}
              onClick={() => onToggleFilter(type)}
            >
              <meta.icon />
              {meta.label}
            </Button>
          );
        })}
        {filters.length > 0 ? (
          <Button size="sm" variant="ghost" onClick={onResetFilters}>
            Tout afficher
          </Button>
        ) : null}
      </div>

      <ol className="max-h-[520px] space-y-1 overflow-y-auto">
        {visible.map((event) => {
          const meta = EVENT_META[event.type];
          const Icon = meta.icon;
          const active = event.key === activeKey;
          const result = event.result ? RESULT_META[event.result] : null;
          return (
            <li key={event.key} ref={active ? activeRef : null}>
              <button
                type="button"
                onClick={() => onSelect(event)}
                className={cn(
                  "flex w-full items-start gap-3 rounded-lg border border-transparent p-3 text-left transition-colors hover:bg-surface",
                  active && "border-primary bg-primary/10",
                )}
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-md border border-border bg-surface">
                  <Icon className="size-4 text-muted-foreground" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[14px] text-foreground">{event.event}</span>
                  <span className="block text-[12px] text-muted-foreground">
                    {formatDateTime(event.timestamp)} · {event.actor}
                  </span>
                  <span className="mt-1 flex flex-wrap gap-1">
                    <Badge variant="neutral">{meta.label}</Badge>
                    {event.tool ? <Badge variant="info">{event.tool}</Badge> : null}
                    {result ? <Badge variant={result.variant}>{result.label}</Badge> : null}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export function TimelineSkeleton() {
  return (
    <div className="space-y-2">
      {[0, 1, 2, 3, 4].map((i) => (
        <Skeleton key={i} className="h-16 w-full rounded-lg" />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Section 3 — Replay                                                 */
/* ------------------------------------------------------------------ */

export function ReplayControls({
  events,
  index,
  playing,
  onIndexChange,
  onTogglePlay,
  onReset,
  mission,
  agents,
}: {
  events: TimelineEvent[];
  index: number;
  playing: boolean;
  onIndexChange: (index: number) => void;
  onTogglePlay: () => void;
  onReset: () => void;
  mission: MissionDetail;
  agents: MissionAgent[];
}) {
  const current = events[index];
  const meta = current ? EVENT_META[current.type] : null;
  const agent = agentOf(mission, agents, current?.agentId);
  const result = current?.result ? RESULT_META[current.result] : null;
  const progress = events.length > 0 ? ((index + 1) / events.length) * 100 : 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Événement précédent"
          disabled={index <= 0}
          onClick={() => onIndexChange(index - 1)}
        >
          <SkipBack />
        </Button>
        <Button
          variant="primary"
          size="sm"
          onClick={onTogglePlay}
          aria-label={playing ? "Pause" : "Lecture"}
        >
          {playing ? <Pause /> : <Play />}
          {playing ? "Pause" : "Lecture"}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Événement suivant"
          disabled={index >= events.length - 1}
          onClick={() => onIndexChange(index + 1)}
        >
          <SkipForward />
        </Button>
        <Button variant="ghost" size="sm" onClick={onReset}>
          <RotateCcw />
          Réinitialiser
        </Button>
        <span className="ml-auto text-[12px] tabular-nums text-muted-foreground">
          Événement {Math.min(index + 1, events.length)} / {events.length}
        </span>
      </div>

      <Progress value={progress} className="h-2" />

      <div className="rounded-xl border border-border bg-surface p-4">
        <h4 className="text-[12px] font-medium uppercase tracking-wide text-muted-foreground">
          Détail de l'événement courant
        </h4>
        {current && meta ? (
          <div className="mt-3 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="neutral">
                <meta.icon />
                {meta.label}
              </Badge>
              {current.tool ? <Badge variant="info">{current.tool}</Badge> : null}
              {result ? <Badge variant={result.variant}>{result.label}</Badge> : null}
            </div>
            <p className="text-[14px] text-foreground">{current.event}</p>
            <dl className="grid grid-cols-2 gap-3 text-[14px]">
              <div>
                <dt className="text-[12px] text-muted-foreground">Acteur</dt>
                <dd className="text-foreground">{agent?.name ?? current.actor}</dd>
              </div>
              <div>
                <dt className="text-[12px] text-muted-foreground">Horodatage</dt>
                <dd className="text-foreground">{formatDateTime(current.timestamp)}</dd>
              </div>
            </dl>
            <p className="text-[14px] leading-6 text-muted-foreground">{meta.reasoning}</p>
          </div>
        ) : (
          <p className="mt-3 text-[14px] text-muted-foreground">Aucun événement sélectionné.</p>
        )}
      </div>
    </div>
  );
}

/** Pilote la lecture automatique du Replay (1,5 s par événement). */
export function useReplay(length: number) {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!playing || length === 0) return;
    const id = window.setInterval(() => {
      setIndex((current) => {
        if (current >= length - 1) {
          setPlaying(false);
          return current;
        }
        return current + 1;
      });
    }, 1500);
    return () => window.clearInterval(id);
  }, [playing, length]);

  return {
    index,
    playing,
    setIndex: (next: number) => setIndex(Math.max(0, Math.min(length - 1, next))),
    togglePlay: () => setPlaying((v) => !v),
    reset: () => {
      setPlaying(false);
      setIndex(0);
    },
  };
}
