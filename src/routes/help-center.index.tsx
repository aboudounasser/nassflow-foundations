import { createFileRoute } from "@tanstack/react-router";
import { LifeBuoy, Search, TriangleAlert } from "lucide-react";
import { useMemo, useState } from "react";

import { WidgetShell } from "@/components/dashboard/widget-shell";
import { HelpArticleCard, HelpArticleSkeletonGrid } from "@/components/help/help-article-card";
import { HelpArticlePanel } from "@/components/help/help-article-panel";
import { HelpFaqList } from "@/components/help/help-faq-list";
import { HelpSupportSection } from "@/components/help/help-support-section";
import { useContextPanel, useContextPanelContent } from "@/components/layout/context-panel";
import { ModulePage } from "@/components/layout/page-header";
import { EmptyState } from "@/components/common/empty-state";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useHelpCenter } from "@/lib/help/queries";
import type { ArticleCategory, HelpArticle, HelpSection, HelpSort } from "@/lib/help/types";
import { cn } from "@/lib/utils";

const DESCRIPTION =
  "La documentation du produit NASSFLOW OS : articles par module, questions fréquentes et support.";

export const Route = createFileRoute("/help-center/")({
  head: () => ({
    meta: [
      { title: "Help Center — NASSFLOW OS" },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: "Help Center — NASSFLOW OS" },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

const SECTIONS: { value: HelpSection; label: string }[] = [
  { value: "articles", label: "Articles" },
  { value: "faq", label: "FAQ" },
  { value: "support", label: "Support" },
];

function matchArticle(article: HelpArticle, query: string) {
  if (!query) return true;
  return (
    article.title.toLowerCase().includes(query) ||
    article.summary.toLowerCase().includes(query) ||
    article.content.toLowerCase().includes(query) ||
    article.tags.some((t) => t.toLowerCase().includes(query))
  );
}

function Page() {
  const [section, setSection] = useState<HelpSection>("articles");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<ArticleCategory | "all">("all");
  const [sort, setSort] = useState<HelpSort>("relevance");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { requestOpen } = useContextPanel();

  const helpQuery = useHelpCenter();
  const allArticles = useMemo(() => helpQuery.data?.articles ?? [], [helpQuery.data]);
  const allFaq = useMemo(() => helpQuery.data?.faq ?? [], [helpQuery.data]);
  const categories = helpQuery.data?.categoryCounts ?? [];
  const query = search.trim().toLowerCase();

  const articles = useMemo(() => {
    const list = allArticles.filter(
      (a) => matchArticle(a, query) && (category === "all" || a.category === category),
    );
    if (sort === "recent") {
      return [...list].sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      );
    }
    if (sort === "reading") {
      return [...list].sort((a, b) => a.readingTimeMin - b.readingTimeMin);
    }
    return list;
  }, [query, category, sort, allArticles]);

  const faqs = useMemo(
    () =>
      allFaq.filter(
        (f) =>
          (category === "all" || f.category === category) &&
          (!query ||
            f.question.toLowerCase().includes(query) ||
            f.answer.toLowerCase().includes(query)),
      ),
    [query, category, allFaq],
  );

  const selected = articles.find((a) => a.id === selectedId) ?? null;

  useContextPanelContent(
    () => (selected ? <HelpArticlePanel article={selected} /> : null),
    [selected?.id],
  );

  const reset = () => {
    setSearch("");
    setCategory("all");
    setSort("relevance");
  };

  const handleSelect = (article: HelpArticle) => {
    setSelectedId(article.id);
    requestOpen();
  };

  const widgetState = helpQuery.isError
    ? "error"
    : helpQuery.isPending
      ? "loading"
      : articles.length === 0
        ? "empty"
        : "success";

  if (helpQuery.isError) {
    return (
      <>
        <ModulePage title="Help Center" description={DESCRIPTION} />
        <section className="col-span-12 min-w-0">
          <EmptyState
            icon={TriangleAlert}
            title="Impossible de charger le Help Center"
            description="La documentation n'a pas pu être récupérée. Vérifiez votre connexion puis réessayez."
          />
          <div className="flex justify-center">
            <Button type="button" size="sm" onClick={() => void helpQuery.refetch()}>
              Réessayer
            </Button>
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      <ModulePage title="Help Center" description={DESCRIPTION} />

      <section className="col-span-12 min-w-0">
        <div className="rounded-xl border border-border bg-surface p-6">
          <label
            htmlFor="help-search"
            className="text-[12px] uppercase tracking-wide text-muted-foreground"
          >
            Recherche
          </label>
          <div className="mt-2">
            <SearchInput
              id="help-search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher dans l'aide…"
              className="h-12 text-[15px]"
            />
          </div>
          <p className="mt-2 text-[12px] text-muted-foreground">
            {articles.length} article{articles.length > 1 ? "s" : ""} · {faqs.length} question
            {faqs.length > 1 ? "s" : ""} fréquente{faqs.length > 1 ? "s" : ""}
          </p>
        </div>
      </section>

      <section className="col-span-12 @container flex min-w-0 flex-col gap-4">
        <ToggleGroup
          type="single"
          value={section}
          onValueChange={(value) => value && setSection(value as HelpSection)}
          variant="outline"
          className="flex-wrap justify-start"
        >
          {SECTIONS.map((s) => (
            <ToggleGroupItem key={s.value} value={s.value} aria-label={s.label}>
              {s.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>

        {section === "support" ? (
          <HelpSupportSection allTickets={helpQuery.data?.tickets ?? []} />
        ) : (
          <>
            <div className="flex flex-wrap gap-2">
              <CategoryChip active={category === "all"} onClick={() => setCategory("all")}>
                Toutes ({allArticles.length})
              </CategoryChip>
              {categories.map((c) => (
                <CategoryChip
                  key={c.category}
                  active={category === c.category}
                  onClick={() => setCategory(c.category)}
                >
                  {c.category} ({c.count})
                </CategoryChip>
              ))}
            </div>

            {section === "articles" ? (
              <>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Select value={sort} onValueChange={(v) => setSort(v as HelpSort)}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Trier" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="relevance">Pertinence</SelectItem>
                      <SelectItem value="recent">Plus récent</SelectItem>
                      <SelectItem value="reading">Temps de lecture</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="ghost" size="sm" onClick={reset}>
                    Réinitialiser
                  </Button>
                </div>

                <WidgetShell
                  title="Articles"
                  icon={LifeBuoy}
                  state={widgetState}
                  showMenu={false}
                  emptyIcon={Search}
                  emptyTitle="Aucun résultat pour cette recherche"
                  emptyAction={
                    <Button variant="secondary" size="sm" onClick={reset}>
                      Réinitialiser
                    </Button>
                  }
                  skeleton={<HelpArticleSkeletonGrid />}
                >
                  <div className="grid grid-cols-1 gap-4 @2xl:grid-cols-2 @5xl:grid-cols-3">
                    {articles.map((article) => (
                      <HelpArticleCard
                        key={article.id}
                        article={article}
                        selected={article.id === selectedId}
                        onSelect={handleSelect}
                      />
                    ))}
                  </div>
                </WidgetShell>
              </>
            ) : faqs.length === 0 ? (
              <div className="rounded-xl border border-border bg-surface">
                <EmptyState
                  icon={Search}
                  title="Aucun résultat pour cette recherche"
                  description="Essayez d'autres mots-clés ou réinitialisez les filtres."
                />
                <div className="flex justify-center pb-6">
                  <Button variant="secondary" size="sm" onClick={reset}>
                    Réinitialiser
                  </Button>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-border bg-surface px-6 py-2">
                <HelpFaqList items={faqs} />
              </div>
            )}
          </>
        )}
      </section>
    </>
  );
}

function CategoryChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "cursor-pointer rounded-full border px-3 py-1.5 text-[12px] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        active
          ? "border-primary bg-accent text-foreground"
          : "border-border bg-surface text-muted-foreground hover:bg-accent",
      )}
    >
      {children}
    </button>
  );
}
