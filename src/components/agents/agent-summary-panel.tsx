import { useNavigate } from "@tanstack/react-router";
import { Maximize2 } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { AGENT_STATUS, formatAgentActivity } from "@/lib/agents/meta";
import type { AgentDetail } from "@/lib/agents/types";

/** Résumé compact affiché dans le Context Panel global. */
export function AgentSummaryPanel({
  agent,
  missionCount,
}: {
  agent: AgentDetail;
  missionCount: number;
}) {
  const status = AGENT_STATUS[agent.status];
  const StatusIcon = status.icon;
  const navigate = useNavigate();

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-5 p-6">
        <div className="flex items-start gap-3">
          <Avatar className="size-12 shrink-0">
            <AvatarFallback className="text-[14px]">{agent.avatar}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <h3 className="truncate text-[16px] font-medium text-foreground">{agent.name}</h3>
            <p className="truncate text-[14px] text-muted-foreground">{agent.role}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-1">
          <Badge variant={status.variant}>
            <StatusIcon aria-hidden="true" />
            {status.label}
          </Badge>
          <Badge variant="info">{agent.domain}</Badge>
          <Badge>{agent.version}</Badge>
        </div>

        <p className="text-[14px] leading-6 text-muted-foreground">{agent.description}</p>

        <div className="space-y-1">
          <div className="flex items-center justify-between text-[12px] text-muted-foreground">
            <span>Score de confiance</span>
            <span className="tabular-nums">{agent.confidenceScore}%</span>
          </div>
          <Progress value={agent.confidenceScore} className="h-2" />
        </div>

        <Separator />

        <dl className="grid grid-cols-2 gap-3 text-[14px]">
          {agent.kpis.slice(0, 3).map((kpi) => (
            <div key={kpi.label}>
              <dt className="text-[12px] text-muted-foreground">{kpi.label}</dt>
              <dd className="text-foreground">{kpi.value}</dd>
            </div>
          ))}
          <div>
            <dt className="text-[12px] text-muted-foreground">Missions liées</dt>
            <dd className="text-foreground">{missionCount}</dd>
          </div>
          <div>
            <dt className="text-[12px] text-muted-foreground">Disponibilité</dt>
            <dd className="text-foreground">{agent.uptime}</dd>
          </div>
          <div>
            <dt className="text-[12px] text-muted-foreground">Dernière activité</dt>
            <dd className="text-foreground">{formatAgentActivity(agent.lastActivity)}</dd>
          </div>
        </dl>
      </div>

      <div className="sticky bottom-0 flex flex-wrap gap-2 border-t border-border bg-surface p-4">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => navigate({ to: "/agents/$agentId", params: { agentId: agent.id } })}
        >
          <Maximize2 />
          Voir la fiche complète
        </Button>
      </div>
    </div>
  );
}
