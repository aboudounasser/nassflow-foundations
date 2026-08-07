import { createFileRoute } from "@tanstack/react-router";
import {
  Activity,
  Bell,
  Bot,
  CalendarDays,
  Compass,
  Gauge,
  Gavel,
  HeartPulse,
  History,
  Lightbulb,
  Target,
  TrendingUp,
} from "lucide-react";

import { ActivityFeedItem } from "@/components/dashboard/activity-feed-item";
import { AgentSummaryCard } from "@/components/dashboard/agent-summary-card";
import { CalendarEventItem } from "@/components/dashboard/calendar-event-item";
import { DecisionItemCard } from "@/components/dashboard/decision-item-card";
import { EnterprisePulseCard } from "@/components/dashboard/enterprise-pulse-card";
import { ForecastCard } from "@/components/dashboard/forecast-card";
import { HealthCategoryCard } from "@/components/dashboard/health-category-card";
import { HistoryEventItem } from "@/components/dashboard/history-event-item";
import { InsightCard } from "@/components/dashboard/insight-card";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { MissionSummaryCard } from "@/components/dashboard/mission-summary-card";
import { NotificationItem } from "@/components/dashboard/notification-item";
import { OpportunityCard } from "@/components/dashboard/opportunity-card";
import { WidgetShell } from "@/components/dashboard/widget-shell";
import { Skeleton } from "@/components/ui/skeleton";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  useDashboardOperations,
  useDashboardOutlook,
  useDashboardPulse,
  useDashboardWorkforce,
} from "@/lib/dashboard/queries";
import type { WidgetState } from "@/lib/dashboard/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard CEO — NASSFLOW OS" },
      {
        name: "description",
        content:
          "Cockpit exécutif NASSFLOW OS : pouls d'entreprise, KPIs, agents IA, décisions, missions et prévisions en un seul écran.",
      },
      { property: "og:title", content: "Dashboard CEO — NASSFLOW OS" },
      {
        property: "og:description",
        content:
          "Le cockpit exécutif de l'AI Operating System : santé, décisions, missions et prévisions.",
      },
    ],
  }),
  component: DashboardCeo,
});

/** État d'un WidgetShell dérivé de sa requête de groupe. */
function groupState(
  query: { isError: boolean; isPending: boolean },
  rows: unknown[] | null,
): WidgetState {
  if (query.isError) return "error";
  if (query.isPending) return "loading";
  if (rows && rows.length === 0) return "empty";
  return "success";
}

function DashboardCeo() {
  const pulseQuery = useDashboardPulse();
  const operationsQuery = useDashboardOperations();
  const workforceQuery = useDashboardWorkforce();
  const outlookQuery = useDashboardOutlook();

  const pulse = pulseQuery.data?.pulse ?? null;
  const kpis = pulseQuery.data?.kpis ?? [];
  const health = pulseQuery.data?.health ?? [];
  const decisions = operationsQuery.data?.decisions ?? [];
  const missions = operationsQuery.data?.missions ?? [];
  const calendar = operationsQuery.data?.calendar ?? [];
  const agents = workforceQuery.data?.agents ?? [];
  const activity = workforceQuery.data?.activity ?? [];
  const notifications = workforceQuery.data?.notifications ?? [];
  const history = workforceQuery.data?.history ?? [];
  const opportunities = outlookQuery.data?.opportunities ?? [];
  const insights = outlookQuery.data?.insights ?? [];
  const forecast = outlookQuery.data?.forecast ?? null;

  const total = agents.length;
  const actifs = agents.filter((a) => a.status === "active").length;
  const enMission = agents.filter(
    (a) => a.status === "active" && a.progress > 0 && a.progress < 100,
  ).length;
  const enAttente = agents.filter((a) => a.status === "paused").length;
  const enErreur = agents.filter((a) => a.status === "error").length;
  const workforceSummary = workforceQuery.isPending
    ? "Chargement des collaborateurs IA…"
    : `${total} collaborateurs IA · ${actifs} actifs · ${enMission} en mission · ${enAttente} en attente${
        enErreur > 0 ? ` · ${enErreur} en erreur` : ""
      }`;

  return (
    <TooltipProvider delayDuration={150}>
      <section className="col-span-12">
        <h1 className="text-foreground">Dashboard CEO</h1>
        <p className="mt-2 text-[16px] text-muted-foreground">
          Vue exécutive temps réel de l'entreprise, pilotée par l'IA.
        </p>
      </section>

      {/* 1. Enterprise Pulse */}
      <div className="col-span-12">
        {pulse ? (
          <EnterprisePulseCard data={pulse} />
        ) : (
          <Skeleton className="h-[220px] w-full rounded-xl" />
        )}
      </div>

      {/* 2. KPIs stratégiques */}
      <div className="col-span-12 @container">
        <div className="grid grid-cols-1 gap-4 @sm:grid-cols-2 @3xl:grid-cols-4">
          {pulseQuery.isPending
            ? Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-[132px] rounded-xl" />
              ))
            : kpis.map((kpi) => <KpiCard key={kpi.id} kpi={kpi} />)}
        </div>
      </div>

      {/* 3. Enterprise Health */}
      <div className="col-span-12">
        <WidgetShell
          title="Enterprise Health"
          description="Santé par domaine opérationnel"
          icon={HeartPulse}
          state={groupState(pulseQuery, health)}
          onRetry={() => void pulseQuery.refetch()}
          emptyIcon={HeartPulse}
          emptyTitle="Aucun domaine surveillé"
          contentClassName="grid grid-cols-1 gap-4 @md:grid-cols-2 @3xl:grid-cols-3"
        >
          {health.map((category) => (
            <HealthCategoryCard key={category.id} category={category} />
          ))}
        </WidgetShell>
      </div>

      {/* 4. AI Workforce */}
      <div className="col-span-12 xl:col-span-6">
        <WidgetShell
          title="AI Workforce"
          description={workforceSummary}
          icon={Bot}
          state={groupState(workforceQuery, agents)}
          onRetry={() => void workforceQuery.refetch()}
          emptyIcon={Bot}
          emptyTitle="Aucun agent déployé"
          contentClassName="grid grid-cols-1 gap-4 @xl:grid-cols-2"
        >
          {agents.map((agent) => (
            <AgentSummaryCard key={agent.id} agent={agent} />
          ))}
        </WidgetShell>
      </div>

      {/* 5. Decision Center */}
      <div className="col-span-12 xl:col-span-6">
        <WidgetShell
          title="Decision Center"
          description="Décisions en attente d'arbitrage"
          icon={Gavel}
          state={groupState(operationsQuery, decisions)}
          onRetry={() => void operationsQuery.refetch()}
          emptyIcon={Gavel}
          emptyTitle="Aucune décision en attente"
          contentClassName="space-y-4"
        >
          {decisions.map((decision) => (
            <DecisionItemCard key={decision.id} decision={decision} />
          ))}
        </WidgetShell>
      </div>

      {/* 6. Missions */}
      <div className="col-span-12 xl:col-span-6">
        <WidgetShell
          title="Missions"
          description="Missions actives et progression"
          icon={Target}
          state={groupState(operationsQuery, missions)}
          onRetry={() => void operationsQuery.refetch()}
          emptyIcon={Target}
          emptyTitle="Aucune mission active"
          contentClassName="space-y-3"
        >
          {missions.map((mission) => (
            <MissionSummaryCard key={mission.id} mission={mission} />
          ))}
        </WidgetShell>
      </div>

      {/* 7. Activity Feed */}
      <div className="col-span-12 xl:col-span-6">
        <WidgetShell
          title="Activity Feed"
          description="Flux d'activité en temps réel"
          icon={Activity}
          state={groupState(workforceQuery, activity)}
          onRetry={() => void workforceQuery.refetch()}
          emptyIcon={Activity}
          emptyTitle="Aucune activité récente"
        >
          <ul className="divide-y divide-border">
            {activity.map((event) => (
              <ActivityFeedItem key={event.id} event={event} />
            ))}
          </ul>
        </WidgetShell>
      </div>

      {/* 8. Notifications */}
      <div className="col-span-12 xl:col-span-6">
        <WidgetShell
          title="Notifications"
          description="Alertes prioritaires"
          icon={Bell}
          state={groupState(workforceQuery, notifications)}
          onRetry={() => void workforceQuery.refetch()}
          emptyIcon={Bell}
          emptyTitle="Aucune notification"
          contentClassName="space-y-3"
        >
          {notifications.map((notification) => (
            <NotificationItem key={notification.id} notification={notification} />
          ))}
        </WidgetShell>
      </div>

      {/* 9. Agenda */}
      <div className="col-span-12 xl:col-span-6">
        <WidgetShell
          title="Agenda"
          description="Prochaines échéances"
          icon={CalendarDays}
          state={groupState(operationsQuery, calendar)}
          onRetry={() => void operationsQuery.refetch()}
          emptyIcon={CalendarDays}
          emptyTitle="Aucun événement à venir"
          contentClassName="space-y-3"
        >
          {calendar.map((event) => (
            <CalendarEventItem key={event.id} event={event} />
          ))}
        </WidgetShell>
      </div>

      {/* 10. Opportunity Radar */}
      <div className="col-span-12 xl:col-span-6">
        <WidgetShell
          title="Opportunity Radar"
          description="Opportunités détectées par l'IA"
          icon={Compass}
          state={groupState(outlookQuery, opportunities)}
          onRetry={() => void outlookQuery.refetch()}
          emptyIcon={Compass}
          emptyTitle="Aucune opportunité détectée"
          contentClassName="space-y-3"
        >
          {opportunities.map((opportunity) => (
            <OpportunityCard key={opportunity.id} opportunity={opportunity} />
          ))}
        </WidgetShell>
      </div>

      {/* 11. Insights */}
      <div className="col-span-12 xl:col-span-6">
        <WidgetShell
          title="Insights"
          description="Analyses génératives explicables"
          icon={Lightbulb}
          state={groupState(outlookQuery, insights)}
          onRetry={() => void outlookQuery.refetch()}
          emptyIcon={Lightbulb}
          emptyTitle="Aucun insight généré"
          contentClassName="space-y-3"
        >
          {insights.map((insight) => (
            <InsightCard key={insight.id} insight={insight} />
          ))}
        </WidgetShell>
      </div>

      {/* 12. Forecast */}
      <div className="col-span-12 xl:col-span-6">
        <WidgetShell
          title="Forecast"
          description={forecast?.metric ?? "Prévision"}
          icon={TrendingUp}
          state={groupState(outlookQuery, forecast ? null : [])}
          onRetry={() => void outlookQuery.refetch()}
          emptyIcon={TrendingUp}
          emptyTitle="Aucune prévision"
        >
          {forecast ? <ForecastCard forecast={forecast} /> : null}
        </WidgetShell>
      </div>

      {/* 13. History */}
      <div className="col-span-12">
        <WidgetShell
          title="History"
          description="Journal des événements majeurs"
          icon={History}
          state={groupState(workforceQuery, history)}
          onRetry={() => void workforceQuery.refetch()}
          emptyIcon={History}
          emptyTitle="Aucun historique"
        >
          <ul className="divide-y divide-border">
            {history.map((event) => (
              <HistoryEventItem key={event.id} event={event} />
            ))}
          </ul>
        </WidgetShell>
      </div>
    </TooltipProvider>
  );
}
