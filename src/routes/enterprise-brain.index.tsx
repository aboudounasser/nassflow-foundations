import { createFileRoute } from "@tanstack/react-router";
import { Brain, TriangleAlert } from "lucide-react";
import { useMemo, useState } from "react";

import { EmptyState } from "@/components/common/empty-state";
import { GRID_LIST_VIEWS, ModuleToolbar } from "@/components/common/module-toolbar";
import { WidgetShell } from "@/components/dashboard/widget-shell";
import { KnowledgeCard, KnowledgeCardSkeletonGrid } from "@/components/knowledge/knowledge-card";
import {
  KnowledgeOverview,
  KnowledgeOverviewSkeleton,
} from "@/components/knowledge/knowledge-overview";
import { KnowledgeSummaryPanel } from "@/components/knowledge/knowledge-summary-panel";
import { useContextPanel, useContextPanelContent } from "@/components/layout/context-panel";
import { ModulePage } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { KNOWLEDGE_TYPE_ORDER, knowledgeFilterDescriptors } from "@/lib/knowledge/meta";
import { useKnowledge } from "@/lib/knowledge/queries";
import type {
  KnowledgeFilters,
  KnowledgeItem,
  KnowledgeType,
  KnowledgeView,
} from "@/lib/knowledge/types";
import { cn } from "@/lib/utils";

const DESCRIPTION =
  "Le socle documentaire de NASSFLOW OS : documents, procédures, wiki et FAQ qui alimentent les collaborateurs IA.";

export const Route = createFileRoute("/enterprise-brain/")({
  head: () => ({
    meta: [
      { title: "Enterprise Brain — NASSFLOW OS" },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: "Enterprise Brain — NASSFLOW OS" },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

const DEFAULT_FILTERS: KnowledgeFilters = {
  search: "",
  types: [],
  category: "all",
  status: "all",
};

function Page() {
  const [filters, setFilters] = useState<KnowledgeFilters>(DEFAULT_FILTERS);
  const [view, setView] = useState<KnowledgeView>("grid");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { requestOpen } = useContextPanel();

  const knowledgeQuery = useKnowledge();
  const data = knowledgeQuery.data;

  const allItems = useMemo(() => data?.items ?? [], [data]);
  const categories = useMemo(() => data?.categories ?? [], [data]);
  const agentsByItem = data?.agentsByItem ?? {};

  const typeCounts = useMemo(() => {
    const counts = {} as Record<KnowledgeType, number>;
    for (const type of KNOWLEDGE_TYPE_ORDER) {
      counts[type] = allItems.filter((i) => i.type === type).length;
    }
    return counts;
  }, [allItems]);

  const descriptors = useMemo(
    () => knowledgeFilterDescriptors(categories, typeCounts),
    [categories, typeCounts],
  );

  const items = useMemo(() => {
    const query = filters.search.trim().toLowerCase();
    return allItems
      .filter((item) => {
        if (
          query &&
          !item.title.toLowerCase().includes(query) &&
          !item.summary.toLowerCase().includes(query) &&
          !item.tags.some((t) => t.toLowerCase().includes(query))
        )
          return false;
        if (filters.types.length > 0 && !filters.types.includes(item.type)) return false;
        if (filters.category !== "all" && item.category !== filters.category) return false;
        if (filters.status !== "all" && item.status !== filters.status) return false;
        return true;
      })
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [filters, allItems]);

  const selected = items.find((i) => i.id === selectedId) ?? null;

  useContextPanelContent(
    () =>
      selected ? (
        <KnowledgeSummaryPanel item={selected} agentCount={(agentsByItem[selected.id] ?? []).length} />
      ) : null,
    [selected?.id],
  );

  const handleSelect = (item: KnowledgeItem) => {
    setSelectedId(item.id);
    requestOpen();
  };

  const widgetState = knowledgeQuery.isError
    ? "error"
    : knowledgeQuery.isPending
      ? "loading"
      : items.length === 0
        ? "empty"
        : "success";

  if (knowledgeQuery.isError) {
    return (
      <section className="col-span-12 min-w-0">
        <Card className="border-border bg-card p-4">
          <EmptyState
            icon={TriangleAlert}
            title="Impossible de charger l'Enterprise Brain"
            description="Les connaissances n'ont pas pu être récupérées. Vérifiez votre connexion puis réessayez."
          />
          <div className="flex justify-center">
            <Button type="button" size="sm" onClick={() => void knowledgeQuery.refetch()}>
              Réessayer
            </Button>
          </div>
        </Card>
      </section>
    );
  }

  return (
    <>
      <ModulePage title="Enterprise Brain" description={DESCRIPTION} />

      <section className="col-span-12 min-w-0">
        {knowledgeQuery.isPending ? (
          <KnowledgeOverviewSkeleton />
        ) : (
          <KnowledgeOverview items={allItems} />
        )}
      </section>

      <section className="col-span-12 min-w-0">
        <ModuleToolbar
          filters={filters}
          onChange={setFilters}
          onReset={() => setFilters(DEFAULT_FILTERS)}
          searchKey="search"
          searchPlaceholder="Rechercher un titre, un résumé, un tag…"
          searchAriaLabel="Rechercher une connaissance"
          descriptors={descriptors}
          views={GRID_LIST_VIEWS}
          view={view}
          onViewChange={(v) => setView(v as KnowledgeView)}
          resultCount={items.length}
          resultLabel={(n) => `${n} connaissance${n > 1 ? "s" : ""}`}
        />
      </section>

      <section className="col-span-12 min-w-0 space-y-2">
        <h2 className="text-[12px] uppercase tracking-wide text-muted-foreground">Collections</h2>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            aria-pressed={filters.category === "all"}
            onClick={() => setFilters({ ...filters, category: "all" })}
            className={cn(
              "cursor-pointer rounded-full border px-3 py-1.5 text-[12px] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              filters.category === "all"
                ? "border-primary bg-accent text-foreground"
                : "border-border bg-surface text-muted-foreground hover:bg-accent",
            )}
          >
            Toutes ({allItems.length})
          </button>
          {categories.map((c) => (
            <button
              key={c.category}
              type="button"
              aria-pressed={filters.category === c.category}
              onClick={() => setFilters({ ...filters, category: c.category })}
              className={cn(
                "cursor-pointer rounded-full border px-3 py-1.5 text-[12px] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                filters.category === c.category
                  ? "border-primary bg-accent text-foreground"
                  : "border-border bg-surface text-muted-foreground hover:bg-accent",
              )}
            >
              {c.category} ({c.count})
            </button>
          ))}
        </div>
      </section>

      <section className="col-span-12 min-w-0">
        <WidgetShell
          title={view === "grid" ? "Vue Grille" : "Vue Liste"}
          icon={Brain}
          state={widgetState}
          showMenu={false}
          emptyIcon={Brain}
          emptyTitle="Aucune connaissance ne correspond à ces critères"
          emptyAction={
            <Button variant="secondary" size="sm" onClick={() => setFilters(DEFAULT_FILTERS)}>
              Réinitialiser les filtres
            </Button>
          }
          skeleton={<KnowledgeCardSkeletonGrid />}
        >
          <div
            className={
              view === "grid"
                ? "grid grid-cols-1 gap-4 @2xl:grid-cols-2 @5xl:grid-cols-3"
                : "flex flex-col gap-3"
            }
          >
            {items.map((item) => (
              <KnowledgeCard
                key={item.id}
                item={item}
                selected={item.id === selectedId}
                compact={view === "list"}
                onSelect={handleSelect}
              />
            ))}
          </div>
        </WidgetShell>
      </section>
    </>
  );
}
