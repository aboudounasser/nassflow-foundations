import {
  CalendarClock,
  CircleCheck,
  CircleDot,
  CirclePlay,
  FileEdit,
  GitBranch,
  Hand,
  PauseCircle,
  Repeat,
  TriangleAlert,
  Webhook,
  Zap,
  type LucideIcon,
} from "lucide-react";

import type {
  NodeType,
  TriggerKind,
  WorkflowRun,
  WorkflowStatus,
  WorkflowVariable,
} from "./types";

type BadgeVariant = "neutral" | "primary" | "success" | "warning" | "destructive" | "info";

export const WORKFLOW_STATUS: Record<
  WorkflowStatus,
  { label: string; variant: BadgeVariant; icon: LucideIcon }
> = {
  active: { label: "Actif", variant: "success", icon: CirclePlay },
  paused: { label: "Suspendu", variant: "warning", icon: PauseCircle },
  draft: { label: "Brouillon", variant: "neutral", icon: FileEdit },
  error: { label: "En erreur", variant: "destructive", icon: TriangleAlert },
};

export const WORKFLOW_STATUS_ORDER: WorkflowStatus[] = ["active", "paused", "draft", "error"];

export const TRIGGER_KIND: Record<
  TriggerKind,
  { label: string; icon: LucideIcon; variant: BadgeVariant }
> = {
  manual: { label: "Manuel", icon: Hand, variant: "neutral" },
  scheduled: { label: "Planifié", icon: CalendarClock, variant: "info" },
  webhook: { label: "Webhook", icon: Webhook, variant: "primary" },
  event: { label: "Événement", icon: Zap, variant: "warning" },
};

export const TRIGGER_KIND_ORDER: TriggerKind[] = ["manual", "scheduled", "webhook", "event"];

export const NODE_TYPE: Record<
  NodeType,
  { label: string; icon: LucideIcon; variant: BadgeVariant }
> = {
  trigger: { label: "Déclencheur", icon: CircleDot, variant: "primary" },
  condition: { label: "Condition", icon: GitBranch, variant: "warning" },
  action: { label: "Action", icon: Zap, variant: "info" },
  loop: { label: "Boucle", icon: Repeat, variant: "neutral" },
};

export const RUN_STATUS: Record<
  WorkflowRun["status"],
  { label: string; variant: BadgeVariant; icon: LucideIcon }
> = {
  success: { label: "Succès", variant: "success", icon: CircleCheck },
  failure: { label: "Échec", variant: "destructive", icon: TriangleAlert },
  running: { label: "En cours", variant: "info", icon: CirclePlay },
};

export const VARIABLE_TYPE: Record<WorkflowVariable["type"], string> = {
  string: "Texte",
  number: "Nombre",
  boolean: "Booléen",
  date: "Date",
};

const DATETIME_FMT = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Paris",
});

export function formatWorkflowDateTime(iso: string | null): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return DATETIME_FMT.format(date);
}

/** Référence stable pour les libellés relatifs (mocks statiques, fuseau Europe/Paris). */
export const NOW_REFERENCE = new Date("2026-08-06T08:00:00+02:00");

export function formatRelative(iso: string | null): string {
  if (!iso) return "Jamais exécuté";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  const diffMin = Math.round((NOW_REFERENCE.getTime() - date.getTime()) / 60000);
  if (diffMin < 1) return "à l'instant";
  if (diffMin < 60) return `il y a ${diffMin} min`;
  const hours = Math.round(diffMin / 60);
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.round(hours / 24);
  if (days < 30) return `il y a ${days} j`;
  const months = Math.round(days / 30);
  return `il y a ${months} mois`;
}

export function formatDuration(ms: number | null): string {
  if (ms === null) return "—";
  if (ms < 1000) return `${ms} ms`;
  const seconds = ms / 1000;
  if (seconds < 60) return `${seconds.toFixed(1)} s`;
  const minutes = Math.floor(seconds / 60);
  const rest = Math.round(seconds % 60);
  return `${minutes} min ${rest.toString().padStart(2, "0")} s`;
}