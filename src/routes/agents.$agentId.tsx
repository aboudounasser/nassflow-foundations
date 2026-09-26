import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowLeft, Bot } from "lucide-react";

import { AgentConnections } from "@/components/agents/agent-connections";
import { AgentPulseSection } from "@/components/agents/agent-pulse-section";
import { AgentSalesActivity } from "@/components/agents/agent-sales-activity";
import { AgentSummaryPanel } from "@/components/agents/agent-summary-panel";
import { useAgentState } from "@/components/agents/use-agent-state";
import { EmptyState } from "@/components/common/empty-state";
import { useContextPanelContent } from "@/components/layout/context-panel";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { findAvailableAgent, type ProductAgent } from "@/lib/agents/catalog";

const DESCRIPTION =
  "Fiche d'un agent IA de NASSFLOW OS : ce qu'il fait, son activité réelle et les comptes qu'il utilise.";

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

/**
 * Fiche agent — trois sections au plus, toutes sur données réelles :
 * CEO Agent : Présentation, Résumé du jour.
 * Sales Agent : Présentation, Activité, Connexions.
 * Un agent masqué ou inconnu vaut « introuvable ».
 */
function Page() {
  const { agentId } = Route.useParams();
  const agent = findAvailableAgent(agentId);

  useContextPanelContent(() => (agent ? <AgentSummaryPanel agent={agent} /> : null), [agent?.id]);

  if (!agent) {
    return (
      <section className="col-span-12 min-w-0">
        <EmptyState
          icon={Bot}
          title="Agent introuvable"
          description="Cet agent n'existe pas ou n'est pas disponible dans votre AI Workforce."
        />
        <div className="flex justify-center">
          <Button variant="secondary" size="sm" asChild>
            <Link to="/agents">Retour à l'AI Workforce</Link>
          </Button>
        </div>
      </section>
    );
  }

  return (
    <>
      <AgentHeader agent={agent} />

      <section className="col-span-12 min-w-0">
        <Card className="space-y-2 border-border bg-card p-4">
          <h2 className="text-[14px] font-medium text-foreground">Présentation</h2>
          <p className="text-[14px] leading-6 text-muted-foreground">{agent.description}</p>
        </Card>
      </section>

      {agent.id === "a-ceo" ? (
        <section className="col-span-12 min-w-0">
          <AgentPulseSection />
        </section>
      ) : null}

      {agent.id === "a-sales" ? (
        <>
          <section className="col-span-12 min-w-0">
            <AgentSalesActivity />
          </section>
          <section className="col-span-12 min-w-0">
            <AgentConnections />
          </section>
        </>
      ) : null}
    </>
  );
}

function AgentHeader({ agent }: { agent: ProductAgent }) {
  const state = useAgentState(agent.id);

  return (
    <section className="col-span-12 min-w-0 space-y-4">
      <Button variant="ghost" size="sm" asChild>
        <Link to="/agents">
          <ArrowLeft />
          Retour à l'AI Workforce
        </Link>
      </Button>

      <div className="flex min-w-0 items-start gap-3">
        <Avatar className="size-12 shrink-0">
          <AvatarFallback className="text-[14px]">{agent.avatar}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 space-y-2">
          <h1 className="text-foreground">{agent.name}</h1>
          <p className="text-[14px] text-muted-foreground">{agent.role}</p>
          {state ? (
            <div className="flex flex-wrap gap-1">
              <Badge variant={state.variant}>{state.label}</Badge>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
