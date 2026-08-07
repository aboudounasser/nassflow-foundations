/** Service Layer du Mission Control : 4 groupes par source de données partagée. */
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
import type {
  ActivityEvent,
  Agent,
  AppNotification,
  CalendarEvent,
  Decision,
  EnterprisePulse,
  Forecast,
  HealthCategory,
  HistoryEvent,
  Insight,
  Kpi,
  Mission,
  Opportunity,
} from "@/lib/dashboard/types";
import type { Scope } from "@/lib/tenancy/types";
import { delay } from "@/services/latency";

export interface DashboardPulseData {
  pulse: EnterprisePulse;
  kpis: Kpi[];
  health: HealthCategory[];
}

export async function getDashboardPulse(_scope: Scope): Promise<DashboardPulseData> {
  return delay({ pulse: enterprisePulseMock, kpis: kpisMock, health: healthMock });
}

export interface DashboardOperationsData {
  decisions: Decision[];
  missions: Mission[];
  calendar: CalendarEvent[];
}

export async function getDashboardOperations(_scope: Scope): Promise<DashboardOperationsData> {
  return delay({ decisions: decisionsMock, missions: missionsMock, calendar: calendarMock });
}

export interface DashboardWorkforceData {
  agents: Agent[];
  activity: ActivityEvent[];
  notifications: AppNotification[];
  history: HistoryEvent[];
}

export async function getDashboardWorkforce(_scope: Scope): Promise<DashboardWorkforceData> {
  return delay({
    agents: agentsMock,
    activity: activityMock,
    notifications: notificationsMock,
    history: historyMock,
  });
}

export interface DashboardOutlookData {
  opportunities: Opportunity[];
  insights: Insight[];
  forecast: Forecast;
}

export async function getDashboardOutlook(_scope: Scope): Promise<DashboardOutlookData> {
  return delay({
    opportunities: opportunitiesMock,
    insights: insightsMock,
    forecast: forecastMock,
  });
}
