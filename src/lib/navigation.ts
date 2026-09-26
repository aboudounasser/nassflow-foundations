import { LayoutDashboard, Target, Bot, Plug, Settings, type LucideIcon } from "lucide-react";

export type NavItem = { label: string; to: string; icon: LucideIcon };

/**
 * Modules affichés dans la navigation — l'ordre est normatif.
 *
 * Les sept modules sans donnée réelle, masqués au chantier 3 (CRM, Enterprise
 * Brain, Workflow Engine, Insights, Security Center, Billing et Help Center),
 * ont été supprimés au chantier 12.
 *
 * « Paramètres » réunit depuis le chantier 6 les anciens modules Organization
 * et System Settings, dont les adresses redirigent vers `/settings`.
 */
export const NAV_ITEMS: NavItem[] = [
  { label: "Mission Control", to: "/", icon: LayoutDashboard },
  { label: "Missions", to: "/missions", icon: Target },
  { label: "AI Workforce", to: "/agents", icon: Bot },
  { label: "Integrations Hub", to: "/integrations-hub", icon: Plug },
  { label: "Paramètres", to: "/settings", icon: Settings },
];
