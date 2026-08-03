import { createFileRoute } from "@tanstack/react-router";

import { ModulePage } from "@/components/layout/page-header";

export const Route = createFileRoute("/integrations-hub")({
  head: () => ({
    meta: [
      { title: "Integrations Hub — NASSFLOW OS" },
      { name: "description", content: "Module Integrations Hub de NASSFLOW OS. Bientôt disponible." },
      { property: "og:title", content: "Integrations Hub — NASSFLOW OS" },
      { property: "og:description", content: "Module Integrations Hub de NASSFLOW OS. Bientôt disponible." },
    ],
  }),
  component: Page,
});

function Page() {
  return <ModulePage title="Integrations Hub" description="Coming soon." />;
}
