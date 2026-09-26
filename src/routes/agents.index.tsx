import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { AgentCard } from "@/components/agents/agent-card";
import { AgentSummaryPanel } from "@/components/agents/agent-summary-panel";
import { useContextPanel, useContextPanelContent } from "@/components/layout/context-panel";
import { ModulePage } from "@/components/layout/page-header";
import { AVAILABLE_AGENTS, type ProductAgent } from "@/lib/agents/catalog";

const DESCRIPTION =
  "Les agents IA en service dans NASSFLOW OS et ce qu'ils font réellement pour votre organisation.";

export const Route = createFileRoute("/agents/")({
  head: () => ({
    meta: [
      { title: "AI Workforce — NASSFLOW OS" },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: "AI Workforce — NASSFLOW OS" },
      { property: "og:description", content: DESCRIPTION },
    ],
  }),
  component: Page,
});

/**
 * AI Workforce — les seuls agents dont le pipeline tourne (`available` dans le
 * registre). Pas de compteurs ni de filtres : ils portaient sur des fixtures.
 */
function Page() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { requestOpen } = useContextPanel();

  const selected = AVAILABLE_AGENTS.find((agent) => agent.id === selectedId) ?? null;

  useContextPanelContent(
    () => (selected ? <AgentSummaryPanel agent={selected} /> : null),
    [selected?.id],
  );

  const handleSelect = (agent: ProductAgent) => {
    setSelectedId(agent.id);
    requestOpen();
  };

  return (
    <>
      <ModulePage title="AI Workforce" description={DESCRIPTION} />

      <section className="col-span-12 min-w-0 @container">
        <div className="grid grid-cols-1 gap-4 @2xl:grid-cols-2">
          {AVAILABLE_AGENTS.map((agent) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              selected={agent.id === selectedId}
              onSelect={handleSelect}
            />
          ))}
        </div>
      </section>
    </>
  );
}
