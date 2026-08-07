import { CircleCheck, CircleSlash, Download, TriangleAlert, type LucideIcon } from "lucide-react";

import type { IntegrationCategory, IntegrationStatus } from "./types";
import type { FilterDescriptor } from "@/lib/toolbar/types";

type BadgeVariant = "neutral" | "primary" | "success" | "warning" | "destructive" | "info";

export const INTEGRATION_STATUS: Record<
  IntegrationStatus,
  { label: string; variant: BadgeVariant; icon: LucideIcon }
> = {
  connected: { label: "Connectée", variant: "success", icon: CircleCheck },
  disconnected: { label: "Déconnectée", variant: "neutral", icon: CircleSlash },
  error: { label: "En erreur", variant: "destructive", icon: TriangleAlert },
  not_installed: { label: "Non installée", variant: "info", icon: Download },
};

export const INTEGRATION_STATUS_ORDER: IntegrationStatus[] = [
  "connected",
  "disconnected",
  "error",
  "not_installed",
];

export const INTEGRATION_CATEGORY_ORDER: IntegrationCategory[] = [
  "CRM",
  "Communication",
  "Productivité",
  "Finance",
  "RH",
  "Support",
  "Marketing",
  "Documentation",
  "Projet",
  "Automatisation",
  "E-commerce",
];

/** Initiales affichées à la place d'un logo (aucun asset externe). */
export function integrationInitials(name: string): string {
  return name
    .split(/[\s-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
}

/** Référence stable pour les libellés relatifs (mocks statiques, fuseau Europe/Paris). */
export const NOW_REFERENCE = new Date("2026-08-06T08:00:00+02:00");

export function formatSyncRelative(iso: string | null): string {
  if (!iso) return "Jamais synchronisée";
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

const DATE_FMT = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "long",
  year: "numeric",
  timeZone: "Europe/Paris",
});

export function formatIntegrationDate(iso: string | null): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return DATE_FMT.format(date);
}

export const INTEGRATION_FILTER_DESCRIPTORS: FilterDescriptor[] = [
  {
    kind: "select",
    key: "category",
    ariaLabel: "Filtrer par catégorie",
    placeholder: "Catégorie",
    allLabel: "Toutes les catégories",
    width: "w-[190px]",
    options: INTEGRATION_CATEGORY_ORDER.map((c) => ({ value: c, label: c })),
  },
  {
    kind: "select",
    key: "status",
    ariaLabel: "Filtrer par statut",
    placeholder: "Statut",
    allLabel: "Tous les statuts",
    width: "w-[180px]",
    options: INTEGRATION_STATUS_ORDER.map((s) => ({
      value: s,
      label: INTEGRATION_STATUS[s].label,
    })),
  },
  {
    kind: "sort",
    key: "sort",
    ariaLabel: "Trier les intégrations",
    width: "w-[210px]",
    options: [
      { value: "name", label: "Nom" },
      { value: "status", label: "Statut" },
      { value: "lastSync", label: "Dernière synchro" },
    ],
  },
];
