import { createFileRoute } from "@tanstack/react-router";

import { ModulePage } from "@/components/layout/page-header";

export const Route = createFileRoute("/enterprise-brain")({
  head: () => ({
    meta: [
      { title: "Enterprise Brain — NASSFLOW OS" },
      { name: "description", content: "Module Enterprise Brain de NASSFLOW OS. Bientôt disponible." },
      { property: "og:title", content: "Enterprise Brain — NASSFLOW OS" },
      { property: "og:description", content: "Module Enterprise Brain de NASSFLOW OS. Bientôt disponible." },
    ],
  }),
  component: Page,
});

function Page() {
  return <ModulePage title="Enterprise Brain" description="Coming soon." />;
}
