import { Mail, MessageSquare, Phone, Users, type LucideIcon } from "lucide-react";

import type { ContactStatus, ContactType, CrmActivity, DealStage } from "./types";
import type { FilterDescriptor } from "@/lib/toolbar/types";

type BadgeVariant = "neutral" | "primary" | "success" | "warning" | "destructive" | "info";

export const CONTACT_TYPE: Record<
  ContactType,
  { label: string; plural: string; variant: BadgeVariant }
> = {
  prospect: { label: "Prospect", plural: "Prospects", variant: "info" },
  client: { label: "Client", plural: "Clients", variant: "success" },
};

export const CONTACT_TYPE_ORDER: ContactType[] = ["prospect", "client"];

export const CONTACT_STATUS: Record<ContactStatus, { label: string; variant: BadgeVariant }> = {
  new: { label: "Nouveau", variant: "neutral" },
  qualified: { label: "Qualifié", variant: "info" },
  engaged: { label: "Engagé", variant: "primary" },
  customer: { label: "Client actif", variant: "success" },
  churned: { label: "Perdu (churn)", variant: "warning" },
  lost: { label: "Perdu", variant: "destructive" },
};

export const CONTACT_STATUS_ORDER: ContactStatus[] = [
  "new",
  "qualified",
  "engaged",
  "customer",
  "churned",
  "lost",
];

export const DEAL_STAGE: Record<DealStage, { label: string; variant: BadgeVariant }> = {
  qualification: { label: "Qualification", variant: "neutral" },
  proposal: { label: "Proposition", variant: "info" },
  negotiation: { label: "Négociation", variant: "primary" },
  won: { label: "Gagné", variant: "success" },
  lost: { label: "Perdu", variant: "destructive" },
};

export const DEAL_STAGE_ORDER: DealStage[] = [
  "qualification",
  "proposal",
  "negotiation",
  "won",
  "lost",
];

/** Étapes considérées comme « pipeline actif ». */
export const ACTIVE_STAGES: DealStage[] = ["qualification", "proposal", "negotiation"];

export const ACTIVITY_TYPE: Record<CrmActivity["type"], { label: string; icon: LucideIcon }> = {
  email: { label: "E-mail", icon: Mail },
  call: { label: "Appel", icon: Phone },
  meeting: { label: "Réunion", icon: Users },
  note: { label: "Note", icon: MessageSquare },
};

const DATE_FMT = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "Europe/Paris",
});

const DATETIME_FMT = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Paris",
});

export function formatCrmDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return DATE_FMT.format(date);
}

export function formatCrmDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return DATETIME_FMT.format(date);
}

const EUR_FMT = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

export function formatEuro(value: number): string {
  return EUR_FMT.format(value);
}

const EUR_COMPACT_FMT = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  notation: "compact",
  maximumFractionDigits: 0,
});

/** Format court pour les cartes de statistiques (ex. 464 k€). */
export function formatEuroCompact(value: number): string {
  return EUR_COMPACT_FMT.format(value);
}

export function contactInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export const CONTACT_FILTER_DESCRIPTORS: FilterDescriptor[] = [
  {
    kind: "select",
    key: "type",
    ariaLabel: "Filtrer par type",
    placeholder: "Type",
    allLabel: "Tous les types",
    width: "w-[160px]",
    options: CONTACT_TYPE_ORDER.map((t) => ({ value: t, label: CONTACT_TYPE[t].plural })),
  },
  {
    kind: "select",
    key: "status",
    ariaLabel: "Filtrer par statut",
    placeholder: "Statut",
    allLabel: "Tous les statuts",
    width: "w-[180px]",
    options: CONTACT_STATUS_ORDER.map((s) => ({ value: s, label: CONTACT_STATUS[s].label })),
  },
  {
    kind: "sort",
    key: "sort",
    ariaLabel: "Trier les contacts",
    width: "w-[180px]",
    options: [
      { value: "lastContact", label: "Dernier contact" },
      { value: "value", label: "Valeur" },
      { value: "name", label: "Nom" },
    ],
  },
];
