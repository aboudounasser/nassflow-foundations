import { Link, useRouterState } from "@tanstack/react-router";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";

import { NAV_ITEMS } from "@/lib/navigation";
import { cn } from "@/lib/utils";

export function SidebarNav({
  collapsed,
  onToggle,
  onNavigate,
  showToggle = true,
}: {
  collapsed: boolean;
  onToggle?: () => void;
  onNavigate?: () => void;
  showToggle?: boolean;
}) {
  const pathname = useRouterState({ select: (r) => r.location.pathname });

  return (
    <nav
      aria-label="Navigation principale"
      className="flex h-full flex-col border-r border-sidebar-border bg-sidebar"
    >
      <ul className="flex-1 space-y-1 overflow-y-auto p-4">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.to;
          return (
            <li key={item.to}>
              <Link
                to={item.to}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                title={collapsed ? item.label : undefined}
                className={cn(
                  "flex min-h-11 items-center gap-3 rounded-lg px-3 text-[14px] font-medium transition-colors duration-150",
                  collapsed && "justify-center px-0",
                  active
                    ? "bg-sidebar-accent text-primary"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                )}
              >
                <item.icon className="size-5 shrink-0" aria-hidden="true" />
                <span className={cn(collapsed && "sr-only")}>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>

      {showToggle && onToggle ? (
        <div className="border-t border-sidebar-border p-4">
          <button
            type="button"
            onClick={onToggle}
            aria-expanded={!collapsed}
            aria-label={collapsed ? "Déployer la navigation" : "Réduire la navigation"}
            className={cn(
              "flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-[14px] font-medium text-sidebar-foreground transition-colors duration-150 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              collapsed && "justify-center px-0",
            )}
          >
            {collapsed ? (
              <PanelLeftOpen className="size-5 shrink-0" aria-hidden="true" />
            ) : (
              <PanelLeftClose className="size-5 shrink-0" aria-hidden="true" />
            )}
            <span className={cn(collapsed && "sr-only")}>Réduire</span>
          </button>
        </div>
      ) : null}
    </nav>
  );
}
