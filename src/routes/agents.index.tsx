import { createFileRoute } from "@tanstack/react-router";

import { AgentCard } from "@/components/agents/agent-card";
import { ModulePage } from "@/components/layout/page-header";
import { AVAILABLE_AGENTS } from "@/lib/agents/catalog";

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
  return (
    <>
      <ModulePage title="AI Workforce" description={DESCRIPTION} />

      <section className="col-span-12 min-w-0 @container">
        <div className="grid grid-cols-1 gap-4 @2xl:grid-cols-2">
          {AVAILABLE_AGENTS.map((agent) => (
            <AgentCard key={agent.id} agent={agent} />
          ))}
        </div>
      </section>
    </>
  );
}
