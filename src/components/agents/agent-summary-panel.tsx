import { useNavigate } from "@tanstack/react-router";
import { Maximize2 } from "lucide-react";

import { useAgentState } from "@/components/agents/use-agent-state";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ProductAgent } from "@/lib/agents/catalog";

/** Résumé compact d'un agent — Context Panel global. */
export function AgentSummaryPanel({ agent }: { agent: ProductAgent }) {
  const state = useAgentState(agent.id);
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

        {state ? (
          <div className="flex flex-wrap gap-1">
            <Badge variant={state.variant}>{state.label}</Badge>
          </div>
        ) : null}

        {agent.description ? (
          <p className="text-[14px] leading-6 text-muted-foreground">{agent.description}</p>
        ) : null}
      </div>

      <div className="sticky bottom-0 flex flex-wrap gap-2 border-t border-border bg-surface p-4">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => navigate({ to: "/agents/$agentId", params: { agentId: agent.id } })}
        >
          <Maximize2 />
          Voir la fiche
        </Button>
      </div>
    </div>
  );
}
