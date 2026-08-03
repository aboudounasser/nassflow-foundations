import { createFileRoute } from "@tanstack/react-router";

import { ModulePage } from "@/components/layout/page-header";

export const Route = createFileRoute("/system-settings")({
  head: () => ({
    meta: [
      { title: "System Settings — NASSFLOW OS" },
      { name: "description", content: "Module System Settings de NASSFLOW OS. Bientôt disponible." },
      { property: "og:title", content: "System Settings — NASSFLOW OS" },
      { property: "og:description", content: "Module System Settings de NASSFLOW OS. Bientôt disponible." },
    ],
  }),
  component: Page,
});

function Page() {
  return <ModulePage title="System Settings" description="Coming soon." />;
}
