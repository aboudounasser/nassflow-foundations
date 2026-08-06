import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Clock, ExternalLink, LifeBuoy, ThumbsDown, ThumbsUp } from "lucide-react";
import { useMemo } from "react";
import { toast } from "sonner";

import { EmptyState } from "@/components/common/empty-state";
import { HelpArticlePanel } from "@/components/help/help-article-panel";
import { useContextPanelContent } from "@/components/layout/context-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { formatHelpDate } from "@/lib/help/meta";
import { helpArticleById, helpArticlesByIds } from "@/lib/help/mocks";

const DESCRIPTION =
  "Article du Help Center NASSFLOW OS : comment utiliser la plateforme et ses modules.";

export const Route = createFileRoute("/help-center/$articleId")({
  head: () => ({
    meta: [
      { title: "Article — Help Center — NASSFLOW OS" },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: "Article — Help Center — NASSFLOW OS" },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Page() {
  const { articleId } = Route.useParams();
  const article = helpArticleById(articleId);
  const navigate = useNavigate();

  const related = useMemo(
    () => (article ? helpArticlesByIds(article.relatedArticleIds) : []),
    [articleId],
  );

  useContextPanelContent(
    () => (article ? <HelpArticlePanel article={article} /> : null),
    [article?.id],
  );

  if (!article) {
    return (
      <section className="col-span-12 min-w-0">
        <EmptyState
          icon={LifeBuoy}
          title="Article introuvable"
          description="Cet article n'existe pas ou a été retiré du Help Center."
        />
        <div className="flex justify-center">
          <Button variant="secondary" size="sm" asChild>
            <Link to="/help-center">Retour au Help Center</Link>
          </Button>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="col-span-12 min-w-0 space-y-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/help-center">
            <ArrowLeft />
            Retour au Help Center
          </Link>
        </Button>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 space-y-2">
            <h1 className="text-foreground">{article.title}</h1>
            <p className="inline-flex items-center gap-1 text-[14px] text-muted-foreground">
              <Clock className="size-4" aria-hidden="true" />
              {article.readingTimeMin} min de lecture · Mis à jour le{" "}
              {formatHelpDate(article.updatedAt)}
            </p>
            <div className="flex flex-wrap gap-1">
              <Badge variant="info">{article.category}</Badge>
              <Badge>{article.readingTimeMin} min</Badge>
            </div>
          </div>
          {article.moduleLink ? (
            <Button
              size="sm"
              onClick={() => navigate({ to: article.moduleLink! })}
            >
              <ExternalLink />
              Ouvrir le module
            </Button>
          ) : null}
        </div>
      </section>

      <section className="col-span-12 min-w-0">
        <div className="space-y-6 rounded-xl border border-border bg-surface p-6">
          <p className="max-w-[72ch] text-[14px] leading-6 text-muted-foreground">
            {article.summary}
          </p>

          <Separator />

          <article className="max-w-[72ch] space-y-4">
            {article.content.split("\n\n").map((paragraph, i) => (
              <p key={i} className="whitespace-pre-line text-[15px] leading-7 text-foreground">
                {paragraph}
              </p>
            ))}
          </article>

          <div className="flex flex-wrap gap-1">
            {article.tags.map((tag) => (
              <Badge key={tag}>#{tag}</Badge>
            ))}
          </div>

          {related.length > 0 ? (
            <>
              <Separator />
              <div className="space-y-2">
                <h2 className="text-[14px] font-medium text-foreground">Articles liés</h2>
                <div className="grid grid-cols-1 gap-3 @2xl:grid-cols-2">
                  {related.map((item) => (
                    <Link
                      key={item.id}
                      to="/help-center/$articleId"
                      params={{ articleId: item.id }}
                      className="rounded-lg border border-border bg-card p-3 transition-colors duration-150 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <p className="truncate text-[14px] font-medium text-foreground">
                        {item.title}
                      </p>
                      <p className="line-clamp-2 text-[12px] leading-5 text-muted-foreground">
                        {item.summary}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        <Badge variant="info">{item.category}</Badge>
                        <Badge>{item.readingTimeMin} min</Badge>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </>
          ) : null}

          <Separator />

          <div className="flex flex-wrap items-center gap-3">
            <p className="text-[14px] text-foreground">Cet article vous a-t-il aidé ?</p>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => toast.success("Merci pour votre retour")}
              >
                <ThumbsUp />
                Oui
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => toast("Merci pour votre retour")}
              >
                <ThumbsDown />
                Non
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}