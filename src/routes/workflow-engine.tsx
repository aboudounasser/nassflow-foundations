import { createFileRoute } from "@tanstack/react-router";

import { ModulePage } from "@/components/layout/page-header";

export const Route = createFileRoute("/workflow-engine")({
  head: () => ({
    meta: [
      { title: "Workflow Engine — NASSFLOW OS" },
      { name: "description", content: "Module Workflow Engine de NASSFLOW OS. Bientôt disponible." },
      { property: "og:title", content: "Workflow Engine — NASSFLOW OS" },
      { property: "og:description", content: "Module Workflow Engine de NASSFLOW OS. Bientôt disponible." },
    ],
  }),
  component: Page,
});

function Page() {
  return <ModulePage title="Workflow Engine" description="Coming soon." />;
}
