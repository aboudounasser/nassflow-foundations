import {
  Archive,
  Ban,
  CheckCircle2,
  CircleDashed,
  CirclePause,
  CircleSlash,
  Clock,
  Play,
  TriangleAlert,
  XCircle,
  type LucideIcon,
} from "lucide-react";

import type { Mission } from "@/lib/dashboard/types";
import type { MissionStatus, MissionStepStatus } from "./types";

export type BadgeVariant = "neutral" | "primary" | "success" | "warning" | "destructive" | "info";

/** Statut → libellé, couleur et icône (référence visuelle unique du module). */
export const MISSION_STATUS: Record<
  MissionStatus | Mission["status"],
  { label: string; variant: BadgeVariant; icon: LucideIcon }
> = {
  draft: { label: "Brouillon", variant: "neutral", icon: CircleDashed },
  ready: { label: "Prête", variant: "info", icon: Clock },
  running: { label: "En cours", variant: "primary", icon: Play },
  waiting: { label: "En attente", variant: "warning", icon: CirclePause },
  blocked: { label: "Bloquée", variant: "warning", icon: TriangleAlert },
  completed: { label: "Terminée", variant: "success", icon: CheckCircle2 },
  failed: { label: "Échouée", variant: "destructive", icon: XCircle },
  cancelled: { label: "Annulée", variant: "neutral", icon: Ban },
  archived: { label: "Archivée", variant: "neutral", icon: Archive },
  // statuts hérités du Dashboard CEO
  todo: { label: "À faire", variant: "neutral", icon: CircleSlash },
  done: { label: "Terminée", variant: "success", icon: CheckCircle2 },
};

export const STEP_STATUS: Record<
  MissionStepStatus,
  { label: string; icon: LucideIcon; className: string }
> = {
  pending: { label: "En attente", icon: CircleDashed, className: "text-muted-foreground" },
  running: { label: "En cours", icon: Play, className: "text-primary" },
  done: { label: "Terminée", icon: CheckCircle2, className: "text-success" },
  failed: { label: "Échouée", icon: XCircle, className: "text-destructive" },
};

export const KANBAN_COLUMNS: { id: string; label: string; statuses: MissionStatus[] }[] = [
  { id: "draft", label: "Draft", statuses: ["draft"] },
  { id: "ready", label: "Ready", statuses: ["ready"] },
  { id: "running", label: "Running", statuses: ["running"] },
  { id: "waiting", label: "Waiting / Blocked", statuses: ["waiting", "blocked"] },
  { id: "completed", label: "Completed", statuses: ["completed"] },
];

export const ARCHIVE_STATUSES: MissionStatus[] = ["failed", "cancelled", "archived"];

export const PRIORITY_WEIGHT: Record<string, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

const DATE_FMT = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});

/** Formate une échéance ISO ; renvoie la valeur telle quelle si déjà lisible. */
export function formatDueDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return DATE_FMT.format(date);
}

const DATETIME_FMT = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "UTC",
});

export function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return DATETIME_FMT.format(date);
}