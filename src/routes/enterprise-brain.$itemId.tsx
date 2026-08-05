import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { Archive, ArrowLeft, Brain, Copy, Pencil } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { useContextPanelContent } from "@/components/layout/context-panel";
import { EmptyState } from "@/components/common/empty-state";
import { KnowledgeSummaryPanel } from "@/components/knowledge/knowledge-summary-panel";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { KNOWLEDGE_STATUS, KNOWLEDGE_TYPE, formatKnowledgeDate } from "@/lib/knowledge/meta";
import { agentsUsingKnowledge, knowledgeById } from "@/lib/knowledge/mocks";

const DESCRIPTION =
  "Connaissance complète de l'Enterprise Brain : contenu, métadonnées et agents IA qui s'appuient dessus.";

export const Route = createFileRoute("/enterprise-brain/$itemId")({
  head: () => ({
    meta: [
      { title: "Connaissance — Enterprise Brain — NASSFLOW OS" },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: "Connaissance — Enterprise Brain — NASSFLOW OS" },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function DetailSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-full max-w-md rounded-lg" />
      <Skeleton className="h-40 w-full rounded-lg" />
    </div>
  );
}

function Page() {
  const { itemId } = Route.useParams();
  const item = knowledgeById(itemId);
  const navigate = useNavigate();
  // État du module : loading / error / success (mock statique).
  const [state] = useState<"loading" | "error" | "success">("success");

  const agents = useMemo(() => agentsUsingKnowledge(itemId), [itemId]);

  useContextPanelContent(
    () => (item ? <KnowledgeSummaryPanel item={item} agentCount={agents.length} /> : null),
    [item?.id, agents.length],
  );

  if (!item) {
    return (
      <section className="col-span-12 min-w-0">
        <EmptyState
          icon={Brain}
          title="Connaissance introuvable"
          description="Ce document n'existe pas ou a été retiré de l'Enterprise Brain."
        />
        <div className="flex justify-center">
          <Button variant="secondary" size="sm" asChild>
            <Link to="/enterprise-brain">Retour à l'Enterprise Brain</Link>
          </Button>
        </div>
      </section>
    );
  }

  const type = KNOWLEDGE_TYPE[item.type];
  const status = KNOWLEDGE_STATUS[item.status];
  const TypeIcon = type.icon;

  return (
    <>
      <section className="col-span-12 min-w-0 space-y-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/enterprise-brain">
            <ArrowLeft />
            Retour à l'Enterprise Brain
          </Link>
        </Button>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-border bg-card">
              <TypeIcon className="size-5 text-muted-foreground" aria-hidden="true" />
            </span>
            <div className="min-w-0 space-y-2">
              <h1 className="text-foreground">{item.title}</h1>
              <p className="text-[14px] text-muted-foreground">
                {item.owner} · {item.version} · Mis à jour le {formatKnowledgeDate(item.updatedAt)}
              </p>
              <div className="flex flex-wrap gap-1">
                <Badge variant={type.variant}>{type.label}</Badge>
                <Badge variant="info">{item.category}</Badge>
                <Badge variant={status.variant}>{status.label}</Badge>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => toast(`Édition de « ${item.title} » (mock)`)}
            >
              <Pencil />
              Modifier
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => toast(`« ${item.title} » archivé (mock)`)}
            >
              <Archive />
              Archiver
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toast.success(`« ${item.title} » dupliqué (mock)`)}
            >
              <Copy />
              Dupliquer
            </Button>
          </div>
        </div>
      </section>

      <section className="col-span-12 min-w-0">
        {state === "loading" ? (
          <DetailSkeleton />
        ) : (
          <div className="space-y-6 rounded-xl border border-border bg-surface p-6">
            <p className="max-w-[72ch] text-[14px] leading-6 text-muted-foreground">
              {item.summary}
            </p>

            <Separator />

            <article className="max-w-[72ch] space-y-4">
              {item.content.split("\n\n").map((paragraph, i) => (
                <p key={i} className="whitespace-pre-line text-[15px] leading-7 text-foreground">
                  {paragraph}
                </p>
              ))}
            </article>

            <div className="flex flex-wrap gap-1">
              {item.tags.map((tag) => (
                <Badge key={tag}>#{tag}</Badge>
              ))}
            </div>

            <Separator />

            <div className="space-y-2">
              <h2 className="text-[14px] font-medium text-foreground">
                Agents utilisant cette connaissance
              </h2>
              {agents.length === 0 ? (
                <p className="text-[14px] text-muted-foreground">
                  Aucun agent ne référence ce document pour le moment.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {agents.map((agent) => (
                    <button
                      key={agent.id}
                      type="button"
                      onClick={() =>
                        navigate({ to: "/agents/$agentId", params: { agentId: agent.id } })
                      }
                      className="flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-left transition-colors duration-150 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <Avatar className="size-8">
                        <AvatarFallback className="text-[10px]">{agent.avatar}</AvatarFallback>
                      </Avatar>
                      <span className="min-w-0">
                        <span className="block truncate text-[14px] text-foreground">
                          {agent.name}
                        </span>
                        <span className="block truncate text-[12px] text-muted-foreground">
                          {agent.role}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </section>
    </>
  );
}
