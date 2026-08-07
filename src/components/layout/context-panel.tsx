import { PanelRight } from "lucide-react";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { EmptyState } from "@/components/common/empty-state";

interface ContextPanelApi {
  content: ReactNode | null;
  setContent: (node: ReactNode | null) => void;
  /** Ouvre le panneau coulissant sur tablette / mobile (no-op en desktop large). */
  requestOpen: () => void;
}

const ContextPanelCtx = createContext<ContextPanelApi | null>(null);

export function ContextPanelProvider({
  requestOpen,
  children,
}: {
  requestOpen: () => void;
  children: ReactNode;
}) {
  const [content, setContent] = useState<ReactNode | null>(null);
  const value = useMemo<ContextPanelApi>(
    () => ({ content, setContent, requestOpen }),
    [content, requestOpen],
  );
  return <ContextPanelCtx.Provider value={value}>{children}</ContextPanelCtx.Provider>;
}

export function useContextPanel(): ContextPanelApi {
  const ctx = useContext(ContextPanelCtx);
  if (!ctx) throw new Error("useContextPanel doit être utilisé dans AppShell.");
  return ctx;
}

/** Injecte un contenu dans le Context Panel tant que le composant est monté. */
export function useContextPanelContent(render: () => ReactNode, deps: unknown[]) {
  const { setContent } = useContextPanel();
  useEffect(() => {
    setContent(render());
    return () => setContent(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

export function ContextPanelContent() {
  const ctx = useContext(ContextPanelCtx);
  return (
    <aside
      aria-label="Panneau contextuel"
      className="flex h-full flex-col border-l border-border bg-surface"
    >
      <header className="flex h-[72px] shrink-0 items-center border-b border-border px-6">
        <h2 className="text-[14px] font-medium text-muted-foreground">Contexte</h2>
      </header>
      {ctx?.content ? (
        <div className="min-h-0 flex-1 overflow-y-auto">{ctx.content}</div>
      ) : (
        <div className="flex flex-1 items-center justify-center">
          <EmptyState icon={PanelRight} title="Aucun contexte sélectionné." />
        </div>
      )}
    </aside>
  );
}
