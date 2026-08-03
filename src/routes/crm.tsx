import { createFileRoute } from "@tanstack/react-router";

import { ModulePage } from "@/components/layout/page-header";

export const Route = createFileRoute("/crm")({
  head: () => ({
    meta: [
      { title: "CRM — NASSFLOW OS" },
      { name: "description", content: "Module CRM de NASSFLOW OS. Bientôt disponible." },
      { property: "og:title", content: "CRM — NASSFLOW OS" },
      { property: "og:description", content: "Module CRM de NASSFLOW OS. Bientôt disponible." },
    ],
  }),
  component: Page,
});

function Page() {
  return <ModulePage title="CRM" description="Coming soon." />;
}
