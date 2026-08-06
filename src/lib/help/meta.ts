import type { ArticleCategory, SupportTicketPriority, SupportTicketStatus } from "./types";

type BadgeVariant = "neutral" | "primary" | "success" | "warning" | "destructive" | "info";

export const ARTICLE_CATEGORY_ORDER: ArticleCategory[] = [
  "Démarrage",
  "Missions",
  "AI Workforce",
  "Enterprise Brain",
  "CRM",
  "Workflow Engine",
  "Intégrations",
  "Sécurité",
  "Facturation",
  "Compte & organisation",
];

export const TICKET_STATUS: Record<
  SupportTicketStatus,
  { label: string; variant: BadgeVariant }
> = {
  open: { label: "Ouvert", variant: "info" },
  pending: { label: "En attente", variant: "warning" },
  resolved: { label: "Résolu", variant: "success" },
  closed: { label: "Clôturé", variant: "neutral" },
};

export const TICKET_STATUS_ORDER: SupportTicketStatus[] = [
  "open",
  "pending",
  "resolved",
  "closed",
];

export const TICKET_PRIORITY: Record<
  SupportTicketPriority,
  { label: string; variant: BadgeVariant }
> = {
  low: { label: "Priorité basse", variant: "neutral" },
  medium: { label: "Priorité moyenne", variant: "warning" },
  high: { label: "Priorité haute", variant: "destructive" },
};

const DATE_FMT = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "Europe/Paris",
});

export function formatHelpDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return DATE_FMT.format(date);
}