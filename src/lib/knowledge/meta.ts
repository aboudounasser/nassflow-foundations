import { BookOpen, ClipboardList, FileText, HelpCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import type { FilterDescriptor } from "@/lib/toolbar/types";
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

export function knowledgeFilterDescriptors(
  categories: { category: string; count: number }[],
  typeCounts: Record<KnowledgeType, number>,
): FilterDescriptor[] {
  return [
    {
      kind: "multiselect",
      key: "types",
      ariaLabel: "Filtrer par type",
      buttonLabel: "Types",
      options: KNOWLEDGE_TYPE_ORDER.map((t) => ({
        value: t,
        label: KNOWLEDGE_TYPE[t].plural,
        count: typeCounts[t],
      })),
    },
    {
      kind: "select",
      key: "category",
      ariaLabel: "Filtrer par catégorie",
      placeholder: "Catégorie",
      allLabel: "Toutes les catégories",
      minWidth: "min-w-[180px]",
      options: categories.map((c) => ({
        value: c.category,
        label: `${c.category} (${c.count})`,
      })),
    },
    {
      kind: "select",
      key: "status",
      ariaLabel: "Filtrer par statut",
      placeholder: "Statut",
      allLabel: "Tous les statuts",
      minWidth: "min-w-[160px]",
      options: KNOWLEDGE_STATUS_ORDER.map((s) => ({ value: s, label: KNOWLEDGE_STATUS[s].label })),
    },
  ];
}
