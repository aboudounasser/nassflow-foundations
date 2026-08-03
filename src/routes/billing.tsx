import { createFileRoute } from "@tanstack/react-router";

import { ModulePage } from "@/components/layout/page-header";

export const Route = createFileRoute("/billing")({
  head: () => ({
    meta: [
      { title: "Billing — NASSFLOW OS" },
      { name: "description", content: "Module Billing de NASSFLOW OS. Bientôt disponible." },
      { property: "og:title", content: "Billing — NASSFLOW OS" },
      { property: "og:description", content: "Module Billing de NASSFLOW OS. Bientôt disponible." },
    ],
  }),
  component: Page,
});

function Page() {
  return <ModulePage title="Billing" description="Coming soon." />;
}
