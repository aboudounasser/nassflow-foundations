import {
  Activity,
  ArrowRightLeft,
  Brain,
  CircleSlash,
  GitBranch,
  Network,
  PauseCircle,
  ShieldCheck,
  TriangleAlert,
  Wrench,
  Wrench as ToolIcon,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import type {
  AgentAccessLevel,
  AgentConfig,
  AgentDomain,
  AgentLogType,
  AgentStatus,
  MemoryLevel,
} from "./types";
import type { FilterDescriptor } from "@/lib/toolbar/types";

type BadgeVariant = "neutral" | "primary" | "success" | "warning" | "destructive" | "info";

export const AGENT_STATUS: Record<
  AgentStatus,
  { label: string; variant: BadgeVariant; icon: LucideIcon }
> = {
  active: { label: "Actif", variant: "success", icon: Activity },
  paused: { label: "En pause", variant: "warning", icon: PauseCircle },
  error: { label: "Erreur", variant: "destructive", icon: TriangleAlert },
  maintenance: { label: "Maintenance", variant: "info", icon: Wrench },
};

export const AGENT_STATUS_ORDER: AgentStatus[] = ["active", "paused", "error", "maintenance"];

export const AGENT_DOMAINS: AgentDomain[] = [
  "Direction",
  "Commercial",
  "Marketing",
  "Finance",
  "RH",
  "Support",
  "Opérations",
];

export const ACCESS_LEVEL: Record<AgentAccessLevel, { label: string; variant: BadgeVariant }> = {
  read: { label: "Lecture", variant: "info" },
  write: { label: "Écriture", variant: "warning" },
  execute: { label: "Exécution", variant: "primary" },
  approve: { label: "Validation", variant: "success" },
};

export const TOOL_STATUS: Record<
  "connected" | "disconnected" | "error",
  { label: string; variant: BadgeVariant; icon: LucideIcon }
> = {
  connected: { label: "Connecté", variant: "success", icon: Activity },
  disconnected: { label: "Déconnecté", variant: "neutral", icon: CircleSlash },
  error: { label: "Erreur", variant: "destructive", icon: TriangleAlert },
};

const DATE_FMT = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Paris",
});

export function formatAgentActivity(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return DATE_FMT.format(date);
}

export const MEMORY_LEVEL: Record<
  MemoryLevel,
  { label: string; variant: BadgeVariant; emptyMessage: string }
> = {
  working: {
    label: "Travail",
    variant: "info",
    emptyMessage: "Aucune mémoire de travail en cours.",
  },
  long_term: {
    label: "Long terme",
    variant: "primary",
    emptyMessage: "Aucun apprentissage long terme enregistré.",
  },
  shared: {
    label: "Partagée",
    variant: "warning",
    emptyMessage: "Aucune mémoire partagée avec les autres agents.",
  },
  enterprise_brain: {
    label: "Enterprise Brain",
    variant: "success",
    emptyMessage: "Aucune connaissance héritée de l'Enterprise Brain.",
  },
};

export const MEMORY_LEVEL_ORDER: MemoryLevel[] = [
  "working",
  "long_term",
  "shared",
  "enterprise_brain",
];

export const LOG_TYPE: Record<AgentLogType, { label: string; icon: LucideIcon }> = {
  tool_call: { label: "Appel d'outil", icon: ToolIcon },
  decision: { label: "Décision", icon: GitBranch },
  handoff: { label: "Passage de relais", icon: ArrowRightLeft },
  validation: { label: "Validation", icon: ShieldCheck },
  error: { label: "Erreur", icon: TriangleAlert },
};

export const LOG_TYPE_ORDER: AgentLogType[] = [
  "tool_call",
  "decision",
  "handoff",
  "validation",
  "error",
];

export const LOG_RESULT: Record<
  "success" | "failure" | "pending",
  { label: string; variant: BadgeVariant }
> = {
  success: { label: "Succès", variant: "success" },
  failure: { label: "Échec", variant: "destructive" },
  pending: { label: "En attente", variant: "info" },
};

export const AUTONOMY_LEVEL: Record<
  AgentConfig["autonomyLevel"],
  { label: string; variant: BadgeVariant }
> = {
  supervised: { label: "Supervisé", variant: "warning" },
  semi_autonomous: { label: "Semi-autonome", variant: "info" },
  autonomous: { label: "Autonome", variant: "success" },
};

export const VALIDATION_THRESHOLD: Record<
  AgentConfig["validationThreshold"],
  { label: string; variant: BadgeVariant }
> = {
  none: { label: "Aucune validation requise", variant: "neutral" },
  critical_only: { label: "Actions critiques uniquement", variant: "warning" },
  all_actions: { label: "Toutes les actions", variant: "destructive" },
};

export const MEMORY_ICON: LucideIcon = Brain;
export const COLLAB_ICON: LucideIcon = Network;

export function formatDuration(ms: number | null): string {
  if (ms === null) return "—";
  return ms < 1000 ? `${ms} ms` : `${(ms / 1000).toFixed(1).replace(".", ",")} s`;
}

export const AGENT_FILTER_DESCRIPTORS: FilterDescriptor[] = [
  {
    kind: "select",
    key: "domain",
    ariaLabel: "Filtrer par domaine",
    placeholder: "Domaine",
    allLabel: "Tous les domaines",
    options: AGENT_DOMAINS.map((d) => ({ value: d, label: d })),
  },
  {
    kind: "select",
    key: "status",
    ariaLabel: "Filtrer par statut",
    placeholder: "Statut",
    allLabel: "Tous les statuts",
    width: "w-[160px]",
    options: AGENT_STATUS_ORDER.map((s) => ({ value: s, label: AGENT_STATUS[s].label })),
  },
  {
    kind: "sort",
    key: "sort",
    ariaLabel: "Trier les agents",
    options: [
      { value: "name", label: "Nom" },
      { value: "confidence", label: "Confiance" },
      { value: "activity", label: "Activité récente" },
    ],
  },
];
