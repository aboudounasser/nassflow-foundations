import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { AiSection } from "@/components/settings/ai-section";
import { ApiSection } from "@/components/settings/api-section";
import { DataSection } from "@/components/settings/data-section";
import { GeneralSection } from "@/components/settings/general-section";
import { NotificationsSection } from "@/components/settings/notifications-section";
import { SystemSection } from "@/components/settings/system-section";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
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
  const [state] = useState<"loading" | "success">("success");
  const loading = state === "loading";

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

        {loading ? (
          <div className="grid gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-lg" />
            ))}
          </div>
        ) : tab === "general" ? (
          <GeneralSection />
        ) : tab === "ai" ? (
          <AiSection />
        ) : tab === "notifications" ? (
          <NotificationsSection />
        ) : tab === "data" ? (
          <DataSection />
        ) : tab === "api" ? (
          <ApiSection />
        ) : (
          <SystemSection />
        )}
      </section>
    </>
  );
}
