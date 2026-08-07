import { BookOpen, ClipboardList, FileText, HelpCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import type { KnowledgeStatus, KnowledgeType } from "./types";

type BadgeVariant = "neutral" | "primary" | "success" | "warning" | "destructive" | "info";

export const KNOWLEDGE_TYPE: Record<
  KnowledgeType,
  { label: string; plural: string; variant: BadgeVariant; icon: LucideIcon }
> = {
  document: { label: "Document", plural: "Documents", variant: "info", icon: FileText },
  procedure: {
    label: "Procédure",
    plural: "Procédures",
    variant: "primary",
    icon: ClipboardList,
  },
  wiki: { label: "Wiki", plural: "Wiki", variant: "success", icon: BookOpen },
  faq: { label: "FAQ", plural: "FAQ", variant: "warning", icon: HelpCircle },
};

export const KNOWLEDGE_TYPE_ORDER: KnowledgeType[] = ["document", "procedure", "wiki", "faq"];

export const KNOWLEDGE_STATUS: Record<KnowledgeStatus, { label: string; variant: BadgeVariant }> = {
  published: { label: "Publié", variant: "success" },
  draft: { label: "Brouillon", variant: "warning" },
  archived: { label: "Archivé", variant: "neutral" },
};

export const KNOWLEDGE_STATUS_ORDER: KnowledgeStatus[] = ["published", "draft", "archived"];

const DATE_FMT = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "Europe/Paris",
});

export function formatKnowledgeDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return DATE_FMT.format(date);
}
