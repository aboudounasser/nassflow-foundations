import { createFileRoute } from "@tanstack/react-router";

import { ModulePage } from "@/components/layout/page-header";

export const Route = createFileRoute("/security-center")({
  head: () => ({
    meta: [
      { title: "Security Center — NASSFLOW OS" },
      { name: "description", content: "Module Security Center de NASSFLOW OS. Bientôt disponible." },
      { property: "og:title", content: "Security Center — NASSFLOW OS" },
      { property: "og:description", content: "Module Security Center de NASSFLOW OS. Bientôt disponible." },
    ],
  }),
  component: Page,
});

function Page() {
  return <ModulePage title="Security Center" description="Coming soon." />;
}
