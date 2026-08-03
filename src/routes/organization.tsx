import { createFileRoute } from "@tanstack/react-router";

import { ModulePage } from "@/components/layout/page-header";

export const Route = createFileRoute("/organization")({
  head: () => ({
    meta: [
      { title: "Organization — NASSFLOW OS" },
      { name: "description", content: "Module Organization de NASSFLOW OS. Bientôt disponible." },
      { property: "og:title", content: "Organization — NASSFLOW OS" },
      { property: "og:description", content: "Module Organization de NASSFLOW OS. Bientôt disponible." },
    ],
  }),
  component: Page,
});

function Page() {
  return <ModulePage title="Organization" description="Coming soon." />;
}
