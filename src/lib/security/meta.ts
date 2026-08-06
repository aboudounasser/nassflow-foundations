import {
  Bot,
  Building2,
  Info,
  ShieldAlert,
  Target,
  TriangleAlert,
  Workflow as WorkflowIcon,
  type LucideIcon,
} from "lucide-react";

import type { SecurityEventSeverity, SecurityEventSource } from "./types";

type BadgeVariant = "neutral" | "primary" | "success" | "warning" | "destructive" | "info";

export const EVENT_SEVERITY: Record<
  SecurityEventSeverity,
  { label: string; variant: BadgeVariant; icon: LucideIcon; tone: string }
> = {
  info: { label: "Info", variant: "info", icon: Info, tone: "text-info" },
  warning: {
    label: "Avertissement",
    variant: "warning",
    icon: TriangleAlert,
    tone: "text-warning",
  },
  critical: {
    label: "Critique",
    variant: "destructive",
    icon: ShieldAlert,
    tone: "text-destructive",
  },
};

export const EVENT_SEVERITY_ORDER: SecurityEventSeverity[] = ["info", "warning", "critical"];

export const EVENT_SOURCE: Record<SecurityEventSource, { label: string; icon: LucideIcon }> = {
  agent_log: { label: "Agent", icon: Bot },
  mission_history: { label: "Mission", icon: Target },
  workflow_run: { label: "Workflow", icon: WorkflowIcon },
  org_member: { label: "Organisation", icon: Building2 },
};

export const EVENT_SOURCE_ORDER: SecurityEventSource[] = [
  "agent_log",
  "mission_history",
  "workflow_run",
  "org_member",
];

const DATE_FMT = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Paris",
});

export function formatSecurityDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return DATE_FMT.format(date);
}