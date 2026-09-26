import { createFileRoute } from "@tanstack/react-router";

import { EnterprisePulseCard } from "@/components/dashboard/enterprise-pulse-card";
import { RecentMissionsWidget } from "@/components/missions/recent-missions-widget";
import { PendingProspectsWidget } from "@/components/scans/pending-prospects-widget";

const DESCRIPTION =
  "Accueil de NASSFLOW OS : prospects détectés à valider, résumé du jour et dernières missions.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Mission Control — NASSFLOW OS" },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: "Mission Control — NASSFLOW OS" },
      { property: "og:description", content: DESCRIPTION },
    ],
  }),
  component: MissionControl,
});

/**
 * Accueil — trois blocs sur données réelles, les décisions avant les
 * statistiques : ce qui attend une action, puis le résumé, puis l'historique.
 */
function MissionControl() {
  return (
    <>
      <section className="col-span-12">
        <h1 className="text-foreground">Mission Control</h1>
        <p className="mt-2 text-[16px] text-muted-foreground">
          Les prospects à valider, le résumé du jour et les dernières analyses de votre boîte
          e-mail.
        </p>
      </section>

      <section className="col-span-12">
        <PendingProspectsWidget />
      </section>

      <section className="col-span-12">
        <EnterprisePulseCard />
      </section>

      <section className="col-span-12">
        <RecentMissionsWidget />
      </section>
    </>
  );
}
