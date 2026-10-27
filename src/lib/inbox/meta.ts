import {
  Bot,
  Briefcase,
  CalendarClock,
  CheckCircle2,
  CircleDashed,
  EyeOff,
  Handshake,
  Mail,
  Receipt,
  Truck,
  type LucideIcon,
} from "lucide-react";

import type { BadgeVariant } from "@/lib/missions/meta";
import type { FilterDescriptor } from "@/lib/toolbar/types";
import type { InboxCategory, InboxFilters, InboxPriority, InboxStatus } from "./types";

/** Catégorie → libellé et icône (référence visuelle unique du module). */
export const INBOX_CATEGORY: Record<InboxCategory, { label: string; icon: LucideIcon }> = {
  prospect: { label: "Prospect", icon: Handshake },
  client: { label: "Client", icon: Briefcase },
  supplier: { label: "Fournisseur / partenaire", icon: Truck },
  finance_admin: { label: "Facture / administratif", icon: Receipt },
  meeting: { label: "Rendez-vous", icon: CalendarClock },
  other: { label: "Autre", icon: Mail },
  automated: { label: "Automatique", icon: Bot },
};

export const INBOX_CATEGORIES: InboxCategory[] = [
  "prospect",
  "client",
  "supplier",
  "finance_admin",
  "meeting",
  "other",
  "automated",
];

export const INBOX_PRIORITY: Record<InboxPriority, { label: string; variant: BadgeVariant }> = {
  high: { label: "Prioritaire", variant: "destructive" },
  normal: { label: "Normale", variant: "neutral" },
  low: { label: "Basse", variant: "neutral" },
};

export const INBOX_PRIORITIES: InboxPriority[] = ["high", "normal", "low"];

/** Ordre d'affichage : les prioritaires d'abord. */
export const PRIORITY_RANK: Record<InboxPriority, number> = { high: 0, normal: 1, low: 2 };

export const INBOX_STATUS: Record<InboxStatus, { label: string; icon: LucideIcon }> = {
  to_handle: { label: "À traiter", icon: CircleDashed },
  handled: { label: "Traité", icon: CheckCircle2 },
  ignored: { label: "Ignoré", icon: EyeOff },
};

export const INBOX_STATUSES: InboxStatus[] = ["to_handle", "handled", "ignored"];

/**
 * Par défaut, ce qui attend une action. Les messages automatiques arrivent en
 * « Ignoré » : ils n'encombrent pas cette vue.
 */
export const DEFAULT_INBOX_FILTERS: InboxFilters = {
  search: "",
  status: "to_handle",
  category: "all",
  priority: "all",
};

export const INBOX_FILTER_DESCRIPTORS: FilterDescriptor[] = [
  {
    kind: "select",
    key: "status",
    ariaLabel: "Filtrer par statut",
    placeholder: "Statut",
    allLabel: "Tous les statuts",
    minWidth: "min-w-[150px]",
    options: INBOX_STATUSES.map((s) => ({ value: s, label: INBOX_STATUS[s].label })),
  },
  {
    kind: "select",
    key: "category",
    ariaLabel: "Filtrer par catégorie",
    placeholder: "Catégorie",
    allLabel: "Toutes les catégories",
    minWidth: "min-w-[190px]",
    options: INBOX_CATEGORIES.map((c) => ({ value: c, label: INBOX_CATEGORY[c].label })),
  },
  {
    kind: "select",
    key: "priority",
    ariaLabel: "Filtrer par priorité",
    placeholder: "Priorité",
    allLabel: "Toutes les priorités",
    minWidth: "min-w-[170px]",
    options: INBOX_PRIORITIES.map((p) => ({ value: p, label: INBOX_PRIORITY[p].label })),
  },
];

/**
 * Nom lisible de l'expéditeur : « Claire Martin <c@x.fr> » → « Claire Martin ».
 * Sans nom, l'adresse ; sans en-tête, un neutre.
 */
export function senderLabel(fromHeader: string | null): string {
  const raw = fromHeader?.trim() ?? "";
  if (!raw) return "Expéditeur inconnu";
  const match = raw.match(/^"?([^"<]*?)"?\s*<([^>]+)>$/);
  if (!match) return raw;
  return match[1]?.trim() || match[2]?.trim() || raw;
}

/** Lien vers le fil dans la bonne boîte Gmail ; `null` sans fil connu. */
export function gmailThreadUrl(
  threadId: string | null,
  accountEmail: string | null,
): string | null {
  if (!threadId) return null;
  const account = accountEmail ? `?authuser=${encodeURIComponent(accountEmail)}` : "";
  return `https://mail.google.com/mail/${account}#all/${encodeURIComponent(threadId)}`;
}

/** Champ que `draft-email-reply` écrit quand le profil n'a pas de nom. */
export const NAME_PLACEHOLDER = "[Votre nom]";
