/** Data models du Dashboard CEO — remplaçables par de vraies API sans toucher aux composants. */

export type WidgetState = "loading" | "empty" | "error" | "success";

export type StatusLevel = "success" | "info" | "warning" | "destructive";
export type Trend = "up" | "down" | "flat";
export type Priority = "low" | "medium" | "high" | "critical";

export interface EnterprisePulse {
  generatedAt: string;
  enterpriseScore: number;
  summary: string;
  priorities: string[];
  opportunities: string[];
  risks: string[];
  recommendation: string;
  confidenceScore: number;
}

export interface Kpi {
  id: string;
  title: string;
  value: number;
  unit: string;
  previousValue: number;
  change: number;
  trend: Trend;
  target: number;
  status: StatusLevel;
  lastUpdated: string;
}

export interface HealthCategory {
  id: string;
  name: string;
  score: number;
  trend: Trend;
  status: StatusLevel;
  lastIncident: string | null;
  recommendation: string;
}

export interface Agent {
  id: string;
  name: string;
  role: string;
  avatar: string;
  status: "active" | "paused" | "error";
  currentMission: string;
  progress: number;
  confidenceScore: number;
  uptime: string;
  lastActivity: string;
}

export interface Decision {
  id: string;
  title: string;
  category: string;
  priority: Priority;
  recommendation: string;
  confidenceScore: number;
  impact: string;
  dueDate: string;
  createdAt: string;
}

export interface Mission {
  id: string;
  title: string;
  priority: Priority;
  status: "todo" | "running" | "blocked" | "done";
  progress: number;
  dueDate: string;
  owner: string;
  agents: { id: string; name: string; avatar: string }[];
  tags: string[];
}

export interface ActivityEvent {
  id: string;
  timestamp: string;
  actor: string;
  actorType: "agent" | "user" | "system";
  action: string;
  resource: string;
  missionId: string | null;
}

export interface AppNotification {
  id: string;
  type: "info" | "success" | "warning" | "critical";
  title: string;
  description: string;
  read: boolean;
  priority: Priority;
  createdAt: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  category: "meeting" | "deadline" | "reminder";
  participants: string[];
  missionId: string | null;
}

export interface Opportunity {
  id: string;
  title: string;
  description: string;
  estimatedImpact: string;
  effort: "low" | "medium" | "high";
  confidenceScore: number;
  priority: Priority;
}

export interface Insight {
  id: string;
  title: string;
  summary: string;
  explanation: string;
  confidenceScore: number;
  recommendation: string;
  generatedAt: string;
}

export interface Forecast {
  id: string;
  metric: string;
  currentValue: number;
  predictedValue: number;
  confidenceInterval: [number, number];
  predictionDate: string;
  series: { label: string; actual: number | null; predicted: number }[];
}

export interface HistoryEvent {
  id: string;
  title: string;
  type: "mission" | "decision" | "integration" | "security" | "report";
  actor: string;
  timestamp: string;
  resource: string;
}
