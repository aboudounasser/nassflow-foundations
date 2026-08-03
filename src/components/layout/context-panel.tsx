import { PanelRight } from "lucide-react";

import { EmptyState } from "@/components/common/empty-state";

export function ContextPanelContent() {
  return (
    <aside
      aria-label="Panneau contextuel"
      className="flex h-full flex-col border-l border-border bg-surface"
    >
      <header className="flex h-[72px] shrink-0 items-center border-b border-border px-6">
        <h2 className="text-[14px] font-medium text-muted-foreground">Contexte</h2>
      </header>
      <div className="flex flex-1 items-center justify-center">
        <EmptyState icon={PanelRight} title="Aucun contexte sélectionné." />
      </div>
    </aside>
  );
}
