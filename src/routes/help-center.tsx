import { createFileRoute } from "@tanstack/react-router";

import { ModulePage } from "@/components/layout/page-header";

export const Route = createFileRoute("/help-center")({
  head: () => ({
    meta: [
      { title: "Help Center — NASSFLOW OS" },
      { name: "description", content: "Module Help Center de NASSFLOW OS. Bientôt disponible." },
      { property: "og:title", content: "Help Center — NASSFLOW OS" },
      { property: "og:description", content: "Module Help Center de NASSFLOW OS. Bientôt disponible." },
    ],
  }),
  component: Page,
});

function Page() {
  return <ModulePage title="Help Center" description="Coming soon." />;
}
