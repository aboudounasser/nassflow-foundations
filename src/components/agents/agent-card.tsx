import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AGENT_STATUS, formatAgentActivity } from "@/lib/agents/meta";
import type { AgentDetail } from "@/lib/agents/types";
import { cn } from "@/lib/utils";

/** Carte agent du module AI Workforce (distincte de AgentSummaryCard du Dashboard). */
export function AgentCard({
  agent,
  selected = false,
  compact = false,
  missionCount = 0,
  onSelect,
}: {
  agent: AgentDetail;
  selected?: boolean;
  compact?: boolean;
  missionCount?: number;
  onSelect?: (agent: AgentDetail) => void;
}) {
  const status = AGENT_STATUS[agent.status];
  const StatusIcon = status.icon;

  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={() => onSelect?.(agent)}
      className={cn(
        "flex w-full cursor-pointer flex-col gap-3 rounded-lg border bg-surface p-4 text-left transition-colors duration-150 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        selected ? "border-primary" : "border-border",
        compact && "gap-2 p-3",
      )}
    >
      <div className="flex items-start gap-3">
        <Avatar className="size-10 shrink-0">
          <AvatarFallback className="text-[12px]">{agent.avatar}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-medium text-foreground">{agent.name}</p>
          <p className="truncate text-[12px] text-muted-foreground">{agent.role}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1">
        <Badge variant={status.variant}>
          <StatusIcon aria-hidden="true" />
          {status.label}
        </Badge>
        <Badge variant="info">{agent.domain}</Badge>
        <Badge>{agent.version}</Badge>
        {missionCount > 0 ? (
          <Badge variant="primary">
            {missionCount} mission{missionCount > 1 ? "s" : ""}
          </Badge>
        ) : null}
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between text-[12px] text-muted-foreground">
          <span>Confiance</span>
          <span className="tabular-nums">{agent.confidenceScore}%</span>
        </div>
        <Progress value={agent.confidenceScore} className="h-1.5" />
      </div>

      <p className="text-[12px] text-muted-foreground">
        Dernière activité · {formatAgentActivity(agent.lastActivity)}
      </p>
    </button>
  );
}

export function AgentCardSkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 @2xl:grid-cols-2 @5xl:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="h-[168px] animate-pulse rounded-lg border border-border bg-card" />
      ))}
    </div>
  );
}
