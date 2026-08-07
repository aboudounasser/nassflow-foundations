import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { TriangleAlert } from "lucide-react";

import { EmptyState } from "@/components/common/empty-state";
import { AiSection } from "@/components/settings/ai-section";
import { ApiSection } from "@/components/settings/api-section";
import { DataSection } from "@/components/settings/data-section";
import { GeneralSection } from "@/components/settings/general-section";
import { NotificationsSection } from "@/components/settings/notifications-section";
import { SystemSection } from "@/components/settings/system-section";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useSettings } from "@/lib/settings/queries";
import type { SettingsTab } from "@/lib/settings/types";

const DESCRIPTION =
  "Configuration technique de la plateforme NASSFLOW OS : affichage, paramètres IA, notifications, données, clés API et environnement système.";

export const Route = createFileRoute("/system-settings")({
  head: () => ({
    meta: [
      { title: "System Settings — NASSFLOW OS" },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: "System Settings — NASSFLOW OS" },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

const TABS: { value: SettingsTab; label: string }[] = [
  { value: "general", label: "Général" },
  { value: "ai", label: "IA & Automatisation" },
  { value: "notifications", label: "Notifications" },
  { value: "data", label: "Données" },
  { value: "api", label: "API" },
  { value: "system", label: "Système" },
];

function Page() {
  const [tab, setTab] = useState<SettingsTab>("general");
  const settingsQuery = useSettings();
  const data = settingsQuery.data;

  return (
    <>
      <section className="col-span-12 min-w-0">
        <h1 className="text-foreground">System Settings</h1>
        <p className="mt-2 max-w-[640px] text-[16px] text-muted-foreground">{DESCRIPTION}</p>
      </section>

      <section className="col-span-12 @container flex min-w-0 flex-col gap-4">
        <ToggleGroup
          type="single"
          value={tab}
          onValueChange={(value) => value && setTab(value as SettingsTab)}
          variant="outline"
          className="flex-wrap justify-start"
        >
          {TABS.map((t) => (
            <ToggleGroupItem key={t.value} value={t.value} aria-label={t.label}>
              {t.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>

        {settingsQuery.isError ? (
          <Card className="border-border bg-card p-4">
            <EmptyState
              icon={TriangleAlert}
              title="Impossible de charger les réglages"
              description="Les réglages système n'ont pas pu être récupérés. Vérifiez votre connexion puis réessayez."
            />
            <div className="flex justify-center">
              <Button type="button" size="sm" onClick={() => void settingsQuery.refetch()}>
                Réessayer
              </Button>
            </div>
          </Card>
        ) : !data ? (
          <div className="grid gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-lg" />
            ))}
          </div>
        ) : tab === "general" ? (
          <GeneralSection display={data.display} />
        ) : tab === "ai" ? (
          <AiSection ai={data.ai} />
        ) : tab === "notifications" ? (
          <NotificationsSection notifications={data.notifications} />
        ) : tab === "data" ? (
          <DataSection data={data.data} />
        ) : tab === "api" ? (
          <ApiSection apiKeys={data.apiKeys} />
        ) : (
          <SystemSection system={data.system} />
        )}
      </section>
    </>
  );
}
