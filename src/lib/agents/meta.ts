import { Activity, CircleSlash, PauseCircle, TriangleAlert, Wrench } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import type { AgentAccessLevel, AgentDomain, AgentStatus } from "./types";

type BadgeVariant = "neutral" | "primary" | "success" | "warning" | "destructive" | "info";

export const AGENT_STATUS: Record<
  AgentStatus,
  { label: string; variant: BadgeVariant; icon: LucideIcon }
> = {
  active: { label: "Actif", variant: "success", icon: Activity },
  paused: { label: "En pause", variant: "warning", icon: PauseCircle },
  error: { label: "Erreur", variant: "destructive", icon: TriangleAlert },
  maintenance: { label: "Maintenance", variant: "info", icon: Wrench },
};

export const AGENT_STATUS_ORDER: AgentStatus[] = ["active", "paused", "error", "maintenance"];

export const AGENT_DOMAINS: AgentDomain[] = [
  "Direction",
  "Commercial",
  "Marketing",
  "Finance",
  "RH",
  "Support",
  "Opérations",
];

export const ACCESS_LEVEL: Record<AgentAccessLevel, { label: string; variant: BadgeVariant }> = {
  read: { label: "Lecture", variant: "info" },
  write: { label: "Écriture", variant: "warning" },
  execute: { label: "Exécution", variant: "primary" },
  approve: { label: "Validation", variant: "success" },
};

export const TOOL_STATUS: Record<
  "connected" | "disconnected" | "error",
  { label: string; variant: BadgeVariant; icon: LucideIcon }
> = {
  connected: { label: "Connecté", variant: "success", icon: Activity },
  disconnected: { label: "Déconnecté", variant: "neutral", icon: CircleSlash },
  error: { label: "Erreur", variant: "destructive", icon: TriangleAlert },
};

const DATE_FMT = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Paris",
});

export function formatAgentActivity(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return DATE_FMT.format(date);
}
