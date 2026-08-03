import { toast } from "sonner";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ItemState } from "./item-state";
import type { Agent, WidgetState } from "@/lib/dashboard/types";

const STATUS: Record<
  Agent["status"],
  { label: string; variant: "success" | "warning" | "destructive" }
> = {
  active: { label: "Actif", variant: "success" },
  paused: { label: "En pause", variant: "warning" },
  error: { label: "Erreur", variant: "destructive" },
};

export function AgentSummaryCard({
  agent,
  state = "success",
  onRetry,
}: {
  agent: Agent;
  state?: WidgetState;
  onRetry?: () => void;
}) {
  const fallback = ItemState({ state, skeletonHeight: "h-24", onRetry, emptyTitle: "Aucun agent" });
  if (fallback) return <>{fallback}</>;

  const status = STATUS[agent.status];

  return (
    <div className="rounded-lg border border-border bg-surface p-4 transition-colors duration-150 hover:bg-accent">
      <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
        <Avatar className="size-9 shrink-0">
          <AvatarFallback>{agent.avatar}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="truncate text-[14px] font-medium text-foreground">{agent.name}</p>
          <p className="truncate text-[12px] text-muted-foreground">{agent.role}</p>
        </div>
        <Badge variant={status.variant} className="shrink-0">
          {status.label}
        </Badge>
      </div>

      <p className="mt-3 line-clamp-1 text-[14px] text-muted-foreground">{agent.currentMission}</p>

      <div className="mt-2 flex items-center gap-3">
        <Progress value={agent.progress} className="h-2 flex-1" />
        <span className="shrink-0 text-[12px] tabular-nums text-muted-foreground">
          {agent.progress}%
        </span>
      </div>

      <div className="mt-3 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
        <span className="truncate text-[12px] text-muted-foreground">
          Confiance {agent.confidenceScore}% · {agent.lastActivity}
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="h-9 shrink-0 px-2"
          onClick={() => toast(`${agent.name} — détails de l'agent`)}
        >
          Ouvrir
        </Button>
      </div>
    </div>
  );
}
