import { createFileRoute } from "@tanstack/react-router";

import { ModulePage } from "@/components/layout/page-header";

export const Route = createFileRoute("/insights")({
  head: () => ({
    meta: [
      { title: "Insights — NASSFLOW OS" },
      { name: "description", content: "Module Insights de NASSFLOW OS. Bientôt disponible." },
      { property: "og:title", content: "Insights — NASSFLOW OS" },
      { property: "og:description", content: "Module Insights de NASSFLOW OS. Bientôt disponible." },
    ],
  }),
  component: Page,
});

function Page() {
  return <ModulePage title="Insights" description="Coming soon." />;
}
