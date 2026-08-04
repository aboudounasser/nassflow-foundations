import { createFileRoute } from "@tanstack/react-router";

import { ModulePage } from "@/components/layout/page-header";

const DESCRIPTION = "Module AI Workforce de NASSFLOW OS. Bientôt disponible.";

export const Route = createFileRoute("/agents")({
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

function Page() {
  return <ModulePage title="AI Workforce" description="Coming soon." />;
}
