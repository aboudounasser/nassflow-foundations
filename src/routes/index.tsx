import { createFileRoute } from "@tanstack/react-router";

import { ModulePage } from "@/components/layout/page-header";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Mission Control — NASSFLOW OS" },
      {
        name: "description",
        content:
          "NASSFLOW OS, l'AI Operating System des entreprises. Fondations du design system et du master layout.",
      },
      { property: "og:title", content: "Mission Control — NASSFLOW OS" },
      {
        property: "og:description",
        content: "NASSFLOW OS, l'AI Operating System des entreprises.",
      },
    ],
  }),
  component: MissionControl,
});

function MissionControl() {
  return (
    <ModulePage
      title="Mission Control"
      description="Fondations posées. Prochaine étape : construction du Dashboard CEO."
    />
  );
}
