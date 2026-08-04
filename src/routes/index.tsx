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
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  activityMock,
  agentsMock,
  calendarMock,
  decisionsMock,
  enterprisePulseMock,
  forecastMock,
  healthMock,
  historyMock,
  insightsMock,
  kpisMock,
  missionsMock,
  notificationsMock,
  opportunitiesMock,
} from "@/lib/dashboard/mocks";

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

function DashboardCeo() {
  const total = agentsMock.length;
  const actifs = agentsMock.filter((a) => a.status === "active").length;
  const enMission = agentsMock.filter(
    (a) => a.status === "active" && a.progress > 0 && a.progress < 100,
  ).length;
  const enAttente = agentsMock.filter((a) => a.status === "paused").length;
  const enErreur = agentsMock.filter((a) => a.status === "error").length;
  const workforceSummary = `${total} collaborateurs IA · ${actifs} actifs · ${enMission} en mission · ${enAttente} en attente${
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
        <EnterprisePulseCard data={enterprisePulseMock} />
      </div>

      {/* 2. KPIs stratégiques */}
      <div className="col-span-12 @container">
        <div className="grid grid-cols-1 gap-4 @sm:grid-cols-2 @3xl:grid-cols-4">
          {kpisMock.map((kpi) => (
            <KpiCard key={kpi.id} kpi={kpi} />
          ))}
        </div>
      </div>

      {/* 3. Enterprise Health */}
      <div className="col-span-12">
        <WidgetShell
          title="Enterprise Health"
          description="Santé par domaine opérationnel"
          icon={HeartPulse}
          emptyIcon={HeartPulse}
          emptyTitle="Aucun domaine surveillé"
          contentClassName="grid grid-cols-1 gap-4 @md:grid-cols-2 @3xl:grid-cols-3"
        >
          {healthMock.map((category) => (
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
          emptyIcon={Bot}
          emptyTitle="Aucun agent déployé"
          contentClassName="grid grid-cols-1 gap-4 @xl:grid-cols-2"
        >
          {agentsMock.map((agent) => (
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
          emptyIcon={Gavel}
          emptyTitle="Aucune décision en attente"
          contentClassName="space-y-4"
        >
          {decisionsMock.map((decision) => (
            <DecisionItemCard key={decision.id} decision={decision} />
          ))}
        </WidgetShell>
      </div>

      {/* 6. Mission Center */}
      <div className="col-span-12 xl:col-span-6">
        <WidgetShell
          title="Mission Center"
          description="Missions actives et progression"
          icon={Target}
          emptyIcon={Target}
          emptyTitle="Aucune mission active"
          contentClassName="space-y-3"
        >
          {missionsMock.map((mission) => (
            <MissionSummaryCard key={mission.id} mission={mission} />
          ))}
        </WidgetShell>
      </div>

      {/* 7. Live Activity */}
      <div className="col-span-12 xl:col-span-6">
        <WidgetShell
          title="Live Activity"
          description="Flux d'activité en temps réel"
          icon={Activity}
          emptyIcon={Activity}
          emptyTitle="Aucune activité récente"
        >
          <ul className="divide-y divide-border">
            {activityMock.map((event) => (
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
          emptyIcon={Bell}
          emptyTitle="Aucune notification"
          contentClassName="space-y-3"
        >
          {notificationsMock.map((notification) => (
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
          emptyIcon={CalendarDays}
          emptyTitle="Aucun événement à venir"
          contentClassName="space-y-3"
        >
          {calendarMock.map((event) => (
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
          emptyIcon={Compass}
          emptyTitle="Aucune opportunité détectée"
          contentClassName="space-y-3"
        >
          {opportunitiesMock.map((opportunity) => (
            <OpportunityCard key={opportunity.id} opportunity={opportunity} />
          ))}
        </WidgetShell>
      </div>

      {/* 11. AI Insights */}
      <div className="col-span-12 xl:col-span-6">
        <WidgetShell
          title="AI Insights"
          description="Analyses génératives explicables"
          icon={Lightbulb}
          emptyIcon={Lightbulb}
          emptyTitle="Aucun insight généré"
          contentClassName="space-y-3"
        >
          {insightsMock.map((insight) => (
            <InsightCard key={insight.id} insight={insight} />
          ))}
        </WidgetShell>
      </div>

      {/* 12. Forecast */}
      <div className="col-span-12 xl:col-span-6">
        <WidgetShell
          title="Forecast"
          description={forecastMock.metric}
          icon={TrendingUp}
          emptyIcon={TrendingUp}
          emptyTitle="Aucune prévision"
        >
          <ForecastCard forecast={forecastMock} />
        </WidgetShell>
      </div>

      {/* 13. Historique */}
      <div className="col-span-12">
        <WidgetShell
          title="Historique"
          description="Journal des événements majeurs"
          icon={History}
          emptyIcon={History}
          emptyTitle="Aucun historique"
        >
          <ul className="divide-y divide-border">
            {historyMock.map((event) => (
              <HistoryEventItem key={event.id} event={event} />
            ))}
          </ul>
        </WidgetShell>
      </div>
    </TooltipProvider>
  );
}
