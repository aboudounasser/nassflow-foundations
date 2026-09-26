import { useEffect, useState, type ReactNode } from "react";

import { SidebarNav } from "@/components/layout/app-sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

/**
 * Master Layout — Top Bar / Sidebar / Main Content.
 *
 * Le Context Panel du brief d'origine a été retiré au chantier 9 : sur les
 * données réelles, il répétait la ligne ou la fiche. Un clic ouvre la fiche.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

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

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <TopBar onOpenMenu={() => setMenuOpen(true)} />

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
      </div>

      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="left" className="w-[280px] border-sidebar-border bg-sidebar p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SidebarNav collapsed={false} showToggle={false} onNavigate={() => setMenuOpen(false)} />
        </SheetContent>
      </Sheet>
    </div>
  );
}
