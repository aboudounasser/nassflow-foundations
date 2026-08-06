import { Link } from "@tanstack/react-router";
import { Clock } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { formatHelpDate } from "@/lib/help/meta";
import type { HelpArticle } from "@/lib/help/types";

/** Résumé compact affiché dans le Context Panel global. */
export function HelpArticlePanel({ article }: { article: HelpArticle }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-5 p-6">
        <div>
          <h3 className="text-[16px] font-medium text-foreground">{article.title}</h3>
          <p className="mt-1 inline-flex items-center gap-1 text-[12px] text-muted-foreground">
            <Clock className="size-3.5" aria-hidden="true" />
            {article.readingTimeMin} min · Maj {formatHelpDate(article.updatedAt)}
          </p>
        </div>

        <div className="flex flex-wrap gap-1">
          <Badge variant="info">{article.category}</Badge>
          {article.tags.map((tag) => (
            <Badge key={tag}>#{tag}</Badge>
          ))}
        </div>

        <p className="text-[14px] leading-6 text-muted-foreground">{article.summary}</p>

        <Separator />

        <p className="line-clamp-6 text-[13px] leading-6 text-muted-foreground/80">
          {article.content}
        </p>
      </div>

      <div className="border-t border-border p-4">
        <Button size="sm" className="w-full" asChild>
          <Link to="/help-center/$articleId" params={{ articleId: article.id }}>
            Lire l'article
          </Link>
        </Button>
      </div>
    </div>
  );
}