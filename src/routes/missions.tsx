import { createFileRoute } from "@tanstack/react-router";

import { ModulePage } from "@/components/layout/page-header";

export const Route = createFileRoute("/missions")({
  head: () => ({
    meta: [
      { title: "Missions — NASSFLOW OS" },
      { name: "description", content: "Module Missions de NASSFLOW OS. Bientôt disponible." },
      { property: "og:title", content: "Missions — NASSFLOW OS" },
      { property: "og:description", content: "Module Missions de NASSFLOW OS. Bientôt disponible." },
    ],
  }),
  component: Page,
});

function Page() {
  return <ModulePage title="Missions" description="Coming soon." />;
}
