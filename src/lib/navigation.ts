import {
  LayoutDashboard,
  Target,
  Bot,
  Users,
  Brain,
  Workflow,
  Plug,
  BarChart3,
  Building2,
  ShieldCheck,
  CreditCard,
  Settings,
  LifeBuoy,
  type LucideIcon,
} from "lucide-react";

export type NavItem = { label: string; to: string; icon: LucideIcon };

/** Official NASSFLOW OS module list — order is normative. */
export const NAV_ITEMS: NavItem[] = [
  { label: "Mission Control", to: "/", icon: LayoutDashboard },
  { label: "Missions", to: "/missions", icon: Target },
  { label: "AI Agents", to: "/ai-agents", icon: Bot },
  { label: "CRM", to: "/crm", icon: Users },
  { label: "Enterprise Brain", to: "/enterprise-brain", icon: Brain },
  { label: "Workflow Engine", to: "/workflow-engine", icon: Workflow },
  { label: "Integrations Hub", to: "/integrations-hub", icon: Plug },
  { label: "Insights", to: "/insights", icon: BarChart3 },
  { label: "Organization", to: "/organization", icon: Building2 },
  { label: "Security Center", to: "/security-center", icon: ShieldCheck },
  { label: "Billing", to: "/billing", icon: CreditCard },
  { label: "System Settings", to: "/system-settings", icon: Settings },
  { label: "Help Center", to: "/help-center", icon: LifeBuoy },
];
