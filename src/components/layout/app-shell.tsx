import { useCallback, useEffect, useState, type ReactNode } from "react";

import { SidebarNav } from "@/components/layout/app-sidebar";
import { ContextPanelContent, ContextPanelProvider } from "@/components/layout/context-panel";
import { TopBar } from "@/components/layout/top-bar";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

/**
 * Master Layout — Top Bar / Sidebar / Main Content / Context Panel.
 * This structure is normative for every NASSFLOW OS screen.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [contextOpen, setContextOpen] = useState(false);

  // Tablet (768–1279px): sidebar forced to icon mode.
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1280px)");
    const sync = () => {
      if (!mq.matches) setCollapsed(true);
    };
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const requestOpen = useCallback(() => {
    if (typeof window !== "undefined" && window.matchMedia("(min-width: 1280px)").matches) return;
    setContextOpen(true);
  }, []);

  return (
    <ContextPanelProvider requestOpen={requestOpen}>
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <TopBar onOpenMenu={() => setMenuOpen(true)} onOpenContext={() => setContextOpen(true)} />

      <div className="flex min-h-0 flex-1">
        <div
          className={cn(
            "hidden shrink-0 transition-[width] duration-200 ease-out lg:block",
            collapsed ? "w-20" : "w-[280px]",
          )}
        >
          <SidebarNav collapsed={collapsed} onToggle={() => setCollapsed((v) => !v)} />
        </div>

        <main className="min-w-0 flex-1 overflow-y-auto">
          <div className="mx-auto grid w-full max-w-[1440px] grid-cols-12 gap-6 p-6 md:p-8">
            {children}
          </div>
        </main>

        <div className="hidden w-[360px] shrink-0 xl:block">
          <ContextPanelContent />
        </div>
      </div>

      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="left" className="w-[280px] border-sidebar-border bg-sidebar p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SidebarNav collapsed={false} showToggle={false} onNavigate={() => setMenuOpen(false)} />
        </SheetContent>
      </Sheet>

      <Sheet open={contextOpen} onOpenChange={setContextOpen}>
        <SheetContent side="right" className="w-full border-border bg-surface p-0 sm:w-[360px]">
          <SheetTitle className="sr-only">Panneau contextuel</SheetTitle>
          <ContextPanelContent />
        </SheetContent>
      </Sheet>
    </div>
    </ContextPanelProvider>
  );
}
