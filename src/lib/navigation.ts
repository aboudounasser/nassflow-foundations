import {
  LayoutDashboard,
  Target,
  Bot,
  Plug,
  Building2,
  Settings,
  type LucideIcon,
} from "lucide-react";

export type NavItem = { label: string; to: string; icon: LucideIcon };

/**
 * Modules affichés dans la navigation — l'ordre est normatif.
 *
 * Sept modules sans donnée réelle sont masqués depuis le chantier 3 : CRM,
 * Enterprise Brain, Workflow Engine, Insights, Security Center, Billing et
 * Help Center. Leurs routes, services et mocks restent en place et joignables
 * par URL jusqu'à leur suppression (chantier 12).
 */
export const NAV_ITEMS: NavItem[] = [
  { label: "Mission Control", to: "/", icon: LayoutDashboard },
  { label: "Missions", to: "/missions", icon: Target },
  { label: "AI Workforce", to: "/agents", icon: Bot },
  { label: "Integrations Hub", to: "/integrations-hub", icon: Plug },
  { label: "Organization", to: "/organization", icon: Building2 },
  { label: "System Settings", to: "/system-settings", icon: Settings },
];
