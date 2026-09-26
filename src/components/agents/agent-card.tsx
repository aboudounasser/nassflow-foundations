import { useAgentState } from "@/components/agents/use-agent-state";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { ProductAgent } from "@/lib/agents/catalog";
import { cn } from "@/lib/utils";

/** Carte d'un agent disponible : identité et état réel, rien d'autre. */
export function AgentCard({
  agent,
  selected = false,
  onSelect,
}: {
  agent: ProductAgent;
  selected?: boolean;
  onSelect?: (agent: ProductAgent) => void;
}) {
  const state = useAgentState(agent.id);

  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={() => onSelect?.(agent)}
      className={cn(
        "flex w-full cursor-pointer flex-col gap-3 rounded-lg border bg-surface p-4 text-left transition-colors duration-150 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        selected ? "border-primary" : "border-border",
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

      {state ? (
        <div className="flex flex-wrap items-center gap-1">
          <Badge variant={state.variant}>{state.label}</Badge>
        </div>
      ) : null}
    </button>
  );
}
