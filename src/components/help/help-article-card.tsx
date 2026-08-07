import { Clock, FileText } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { formatHelpDate } from "@/lib/help/meta";
import type { HelpArticle } from "@/lib/help/types";
import { cn } from "@/lib/utils";

export function HelpArticleCard({
  article,
  selected = false,
  compact = false,
  onSelect,
}: {
  article: HelpArticle;
  selected?: boolean;
  compact?: boolean;
  onSelect?: (article: HelpArticle) => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={() => onSelect?.(article)}
      className={cn(
        "flex w-full cursor-pointer flex-col gap-3 rounded-lg border bg-surface p-4 text-left transition-colors duration-150 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        selected ? "border-primary" : "border-border",
        compact && "gap-2 p-3",
      )}
    >
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-border bg-card">
          <FileText className="size-5 text-muted-foreground" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-medium text-foreground">{article.title}</p>
          <p className="line-clamp-2 text-[12px] leading-5 text-muted-foreground">
            {article.summary}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1">
        <Badge variant="info">{article.category}</Badge>
        {article.tags.slice(0, 2).map((tag) => (
          <Badge key={tag}>#{tag}</Badge>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-[12px] text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <Clock className="size-3.5" aria-hidden="true" />
          {article.readingTimeMin} min de lecture
        </span>
        <span className="shrink-0">Maj · {formatHelpDate(article.updatedAt)}</span>
      </div>
    </button>
  );
}

export function HelpArticleSkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 @2xl:grid-cols-2 @5xl:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="h-[168px] animate-pulse rounded-lg border border-border bg-card" />
      ))}
    </div>
  );
}
