import {
  Archive,
  Link2,
  Maximize2,
  PauseCircle,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { PRIORITY_BADGE } from "@/components/dashboard/decision-item-card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { MISSION_STATUS, STEP_STATUS, formatDateTime, formatDueDate } from "@/lib/missions/meta";
import type { MissionDetail } from "@/lib/missions/types";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h4 className="text-[12px] font-medium uppercase tracking-wide text-muted-foreground">
        {title}
      </h4>
      {children}
    </section>
  );
}

export function MissionDetailPanel({
  mission,
  allMissions,
}: {
  mission: MissionDetail;
  allMissions: MissionDetail[];
}) {
  const status = MISSION_STATUS[mission.status];
  const priority = PRIORITY_BADGE[mission.priority];
  const StatusIcon = status.icon;

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-5 p-6">
        <div className="space-y-2">
          <h3 className="text-[16px] font-medium text-foreground">{mission.title}</h3>
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

        <p className="text-[14px] leading-6 text-muted-foreground">{mission.objective}</p>

        <div className="flex items-center gap-3">
          <Progress value={mission.progress} className="h-2 flex-1" />
          <span className="text-[12px] tabular-nums text-muted-foreground">
            {mission.progress}%
          </span>
        </div>

        <Separator />

        <Section title="Agents impliqués">
          <ul className="space-y-2">
            {mission.agents.map((agent) => (
              <li key={agent.id} className="flex items-center gap-3">
                <Avatar className="size-8">
                  <AvatarFallback className="text-[10px]">{agent.avatar}</AvatarFallback>
                </Avatar>
                <span className="min-w-0">
                  <span className="block truncate text-[14px] text-foreground">{agent.name}</span>
                  <span className="block truncate text-[12px] text-muted-foreground">
                    {agent.role}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </Section>

        <Section title="Étapes">
          <ul className="space-y-2">
            {mission.steps.map((step) => {
              const meta = STEP_STATUS[step.status];
              const Icon = meta.icon;
              return (
                <li key={step.id} className="flex items-start gap-2">
                  <Icon className={`mt-0.5 size-4 shrink-0 ${meta.className}`} aria-hidden="true" />
                  <span className="min-w-0 text-[14px] text-foreground">
                    {step.title}
                    <span className="ml-1 text-[12px] text-muted-foreground">— {meta.label}</span>
                  </span>
                </li>
              );
            })}
          </ul>
        </Section>

        {mission.dependencies.length > 0 ? (
          <Section title="Dépendances">
            <ul className="space-y-1">
              {mission.dependencies.map((id) => {
                const dep = allMissions.find((m) => m.id === id);
                return (
                  <li
                    key={id}
                    className="flex items-center gap-2 text-[14px] text-muted-foreground"
                  >
                    <Link2 className="size-4 shrink-0" aria-hidden="true" />
                    <span className="truncate">{dep ? dep.title : id}</span>
                  </li>
                );
              })}
            </ul>
          </Section>
        ) : null}

        <Section title="Résumé">
          <dl className="grid grid-cols-2 gap-3 text-[14px]">
            <div>
              <dt className="text-[12px] text-muted-foreground">Durée estimée</dt>
              <dd className="text-foreground">{mission.estimatedDuration}</dd>
            </div>
            <div>
              <dt className="text-[12px] text-muted-foreground">Durée réelle</dt>
              <dd className="text-foreground">{mission.actualDuration ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-[12px] text-muted-foreground">Coût IA</dt>
              <dd className="text-foreground">
                {mission.cost.estimatedCost}{" "}
                <span className="text-[12px] text-muted-foreground">
                  ({mission.cost.aiCalls} appels)
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-[12px] text-muted-foreground">Confiance</dt>
              <dd className="text-foreground">{mission.confidenceScore}%</dd>
            </div>
            <div>
              <dt className="text-[12px] text-muted-foreground">Responsable</dt>
              <dd className="flex items-center gap-1 text-foreground">
                <Users className="size-4 text-muted-foreground" aria-hidden="true" />
                {mission.owner}
              </dd>
            </div>
            <div>
              <dt className="text-[12px] text-muted-foreground">Échéance</dt>
              <dd className="text-foreground">{formatDueDate(mission.dueDate)}</dd>
            </div>
          </dl>
        </Section>

        <Section title="Historique">
          <ol className="space-y-3 border-l border-border pl-4">
            {mission.history.map((entry) => (
              <li key={`${entry.timestamp}-${entry.event}`} className="relative">
                <span
                  className="absolute -left-[21px] top-1.5 size-2 rounded-full bg-border"
                  aria-hidden="true"
                />
                <p className="text-[14px] text-foreground">{entry.event}</p>
                <p className="text-[12px] text-muted-foreground">
                  {formatDateTime(entry.timestamp)} · {entry.actor}
                </p>
              </li>
            ))}
          </ol>
        </Section>
      </div>

      <div className="sticky bottom-0 flex flex-wrap gap-2 border-t border-border bg-surface p-4">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => toast(`Ouverture plein écran : ${mission.title}`)}
        >
          <Maximize2 />
          Plein écran
        </Button>
        <Button variant="ghost" size="sm" onClick={() => toast("Mission suspendue (mock)")}>
          <PauseCircle />
          Suspendre
        </Button>
        <Button variant="ghost" size="sm" onClick={() => toast("Mission archivée (mock)")}>
          <Archive />
          Archiver
        </Button>
      </div>
    </div>
  );
}