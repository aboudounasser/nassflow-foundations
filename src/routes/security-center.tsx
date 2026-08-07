import { createFileRoute } from "@tanstack/react-router";
import { ScrollText } from "lucide-react";
import { useMemo, useState } from "react";

import { EmptyState } from "@/components/common/empty-state";
import {
  AgentPermissionsTable,
  IntegrationPermissionsTable,
  MembersAccessTable,
} from "@/components/security/access-tables";
import { AuditLog } from "@/components/security/audit-log";
import { PoliciesSection } from "@/components/security/policies-section";
import { SecurityEventItem } from "@/components/security/security-event-item";
import { SecurityOverviewBanner } from "@/components/security/security-overview";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  accessMatrix,
  agentPermissionsSummary,
  integrationPermissionsSummary,
  securityEventFeed,
  securityOverview,
} from "@/lib/security/aggregations";
import type { SecurityTab } from "@/lib/security/types";

const DESCRIPTION =
  "Vue de sécurité cross-module de NASSFLOW OS : posture, accès, permissions, journal d'audit et politiques.";

export const Route = createFileRoute("/security-center")({
  head: () => ({
    meta: [
      { title: "Security Center — NASSFLOW OS" },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: "Security Center — NASSFLOW OS" },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

const TABS: { value: SecurityTab; label: string }[] = [
  { value: "overview", label: "Vue d'ensemble" },
  { value: "access", label: "Accès & Permissions" },
  { value: "audit", label: "Journal d'audit" },
  { value: "policies", label: "Politiques" },
];

function Page() {
  const [tab, setTab] = useState<SecurityTab>("overview");
  // État du module : loading / success (mocks statiques).
  const [state] = useState<"loading" | "success">("success");
  const loading = state === "loading";

  const overview = useMemo(() => securityOverview(), []);
  const events = useMemo(() => securityEventFeed(), []);
  const members = useMemo(() => accessMatrix(), []);
  const agentPerms = useMemo(() => agentPermissionsSummary(), []);
  const integrationPerms = useMemo(() => integrationPermissionsSummary(), []);

  const recent = events.slice(0, 5);

  return (
    <>
      <section className="col-span-12 min-w-0">
        <h1 className="text-foreground">Security Center</h1>
        <p className="mt-2 max-w-[640px] text-[16px] text-muted-foreground">{DESCRIPTION}</p>
      </section>

      <section className="col-span-12 @container min-w-0">
        <SecurityOverviewBanner data={overview} loading={loading} />
      </section>

      <section className="col-span-12 @container flex min-w-0 flex-col gap-4">
        <ToggleGroup
        type="single"
        value={tab}
        onValueChange={(value) => value && setTab(value as SecurityTab)}
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
      ) : tab === "overview" ? (
        <Card className="min-w-0 border-border bg-card p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-[14px] font-medium text-foreground">Événements récents</p>
            <Button type="button" size="sm" variant="secondary" onClick={() => setTab("audit")}>
              Voir tout le journal
            </Button>
          </div>
          {recent.length === 0 ? (
            <EmptyState
              icon={ScrollText}
              title="Aucun événement de sécurité"
              description="Le journal se remplira dès qu'un incident ou une validation sera enregistré."
            />
          ) : (
            <ul className="mt-4 flex flex-col gap-2">
              {recent.map((event) => (
                <SecurityEventItem key={event.id} event={event} compact />
              ))}
            </ul>
          )}
        </Card>
      ) : tab === "access" ? (
        <div className="flex min-w-0 flex-col gap-4">
          <MembersAccessTable rows={members} />
          <div className="grid min-w-0 gap-4 @4xl:grid-cols-2">
            <AgentPermissionsTable rows={agentPerms} />
            <IntegrationPermissionsTable rows={integrationPerms} />
          </div>
        </div>
      ) : tab === "audit" ? (
        <AuditLog events={events} />
      ) : (
        <PoliciesSection />
      )}
      </section>
    </>
  );
}
