import { createFileRoute } from "@tanstack/react-router";

import { ModulePage } from "@/components/layout/page-header";

export const Route = createFileRoute("/agents")({
  head: () => ({
    meta: [
      { title: "AI Agents — NASSFLOW OS" },
      { name: "description", content: "Module AI Agents de NASSFLOW OS. Bientôt disponible." },
      { property: "og:title", content: "AI Agents — NASSFLOW OS" },
      { property: "og:description", content: "Module AI Agents de NASSFLOW OS. Bientôt disponible." },
    ],
  }),
  component: Page,
});

function Page() {
  return <ModulePage title="AI Agents" description="Coming soon." />;
}
