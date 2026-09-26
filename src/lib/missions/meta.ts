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

import type { FilterDescriptor } from "@/lib/toolbar/types";
import type { Mission } from "@/lib/dashboard/types";
import type { Mission as MissionRecord, MissionStatus } from "./types";

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

/** Statuts depuis lesquels le bouton "Archiver" est proposé — états finaux uniquement. */
export const ARCHIVABLE_STATUSES: MissionStatus[] = ["completed", "failed", "cancelled"];

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

/**
 * Statuts que la base peut réellement contenir, dans l'ordre du cycle de vie.
 * `draft` est admis par la contrainte mais jamais écrit par `run-gmail-scan` ;
 * `ready`, `waiting` et `blocked` n'existent que dans les fixtures.
 */
export const REAL_MISSION_STATUSES: MissionStatus[] = [
  "running",
  "completed",
  "failed",
  "cancelled",
  "archived",
];

/**
 * Filtres de la liste des missions : statut réel et ordre d'ouverture. Pas de
 * priorité ni d'échéance (aucune colonne), pas d'agent (aucun n'est porté).
 */
export const MISSION_FILTER_DESCRIPTORS: FilterDescriptor[] = [
  {
    kind: "multiselect",
    key: "statuses",
    ariaLabel: "Filtrer par statut",
    buttonLabel: "Statuts",
    options: REAL_MISSION_STATUSES.map((s) => ({ value: s, label: MISSION_STATUS[s].label })),
  },
  {
    kind: "sort",
    key: "sort",
    ariaLabel: "Trier les missions",
    minWidth: "min-w-[170px]",
    options: [
      { value: "newest", label: "Plus récentes" },
      { value: "oldest", label: "Plus anciennes" },
    ],
  },
];

/**
 * Résultat lisible de l'analyse liée à une mission. `null` quand il n'y a rien
 * d'honnête à dire : run inconnu (jointure vide).
 */
export function missionOutcome(
  mission: MissionRecord,
): { text: string; tone: "muted" | "destructive" } | null {
  if (mission.status === "running") return { text: "Analyse en cours", tone: "muted" };
  const run = mission.run;
  if (!run) return null;
  if (run.errorMessage) return { text: run.errorMessage, tone: "destructive" };
  return {
    text:
      run.prospectsFound > 0
        ? `${run.prospectsFound} ${run.prospectsFound > 1 ? "prospects trouvés" : "prospect trouvé"}`
        : "Aucune demande commerciale",
    tone: "muted",
  };
}

/** Durée entre deux dates ISO, en minutes et secondes — `null` si l'une manque. */
export function formatElapsed(fromIso: string | null, toIso: string | null): string | null {
  if (!fromIso || !toIso) return null;
  const ms = new Date(toIso).getTime() - new Date(fromIso).getTime();
  if (!Number.isFinite(ms) || ms < 0) return null;
  const seconds = Math.round(ms / 1000);
  if (seconds < 60) return `${seconds} s`;
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return rest === 0 ? `${minutes} min` : `${minutes} min ${rest} s`;
}

const EURO_FMT = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
});

/** Coût IA d'un run, stocké en centimes (`runs.ai_cost_cents`). */
export function formatAiCost(cents: number): string {
  return EURO_FMT.format(cents / 100);
}
