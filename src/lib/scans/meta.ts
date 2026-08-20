import { CircleCheck, Loader, TriangleAlert, type LucideIcon } from "lucide-react";

import type { RunStatus } from "./types";

type BadgeVariant = "neutral" | "primary" | "success" | "warning" | "destructive" | "info";

export const RUN_STATUS: Record<
  RunStatus,
  { label: string; variant: BadgeVariant; icon: LucideIcon }
> = {
  running: { label: "En cours", variant: "info", icon: Loader },
  succeeded: { label: "Terminée", variant: "success", icon: CircleCheck },
  failed: { label: "Échouée", variant: "destructive", icon: TriangleAlert },
};

/**
 * Seuils de lecture du score du modèle. Trois paliers seulement : l'utilisateur
 * a besoin de savoir s'il peut faire confiance à l'extraction, pas de la nuance
 * exacte entre 71 et 74.
 */
export function confidenceVariant(confidence: number | null): BadgeVariant {
  if (confidence === null) return "neutral";
  if (confidence >= 80) return "success";
  if (confidence >= 50) return "warning";
  return "neutral";
}

export function formatConfidence(confidence: number | null): string {
  return confidence === null ? "Score inconnu" : `Confiance ${Math.round(confidence)} %`;
}

const DATETIME_FMT = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Paris",
});

export function formatScanDateTime(iso: string | null): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return DATETIME_FMT.format(date);
}

/**
 * Libellé relatif calculé sur l'heure réelle — contrairement aux modules
 * mockés, ces dates viennent de la base et vieillissent pour de bon.
 */
export function formatRelativeScanDate(iso: string | null): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  const diffMin = Math.round((Date.now() - date.getTime()) / 60000);
  if (diffMin < 1) return "à l'instant";
  if (diffMin < 60) return `il y a ${diffMin} min`;
  const hours = Math.round(diffMin / 60);
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.round(hours / 24);
  if (days < 30) return `il y a ${days} j`;
  const months = Math.round(days / 30);
  return `il y a ${months} mois`;
}

/** Accord du pluriel sur le compteur, le mot restant à la charge de l'appelant. */
export function pluralize(count: number, singular: string, plural: string): string {
  return `${count} ${count > 1 ? plural : singular}`;
}
