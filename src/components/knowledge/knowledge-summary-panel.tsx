import { useNavigate } from "@tanstack/react-router";
import { Maximize2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { KNOWLEDGE_STATUS, KNOWLEDGE_TYPE, formatKnowledgeDate } from "@/lib/knowledge/meta";
import type { KnowledgeItem } from "@/lib/knowledge/types";

/** Résumé compact affiché dans le Context Panel global. */
export function KnowledgeSummaryPanel({
  item,
  agentCount,
}: {
  item: KnowledgeItem;
  agentCount: number;
}) {
  const type = KNOWLEDGE_TYPE[item.type];
  const status = KNOWLEDGE_STATUS[item.status];
  const TypeIcon = type.icon;
  const navigate = useNavigate();

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-5 p-6">
        <div className="flex items-start gap-3">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-border bg-card">
            <TypeIcon className="size-5 text-muted-foreground" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h3 className="text-[16px] font-medium text-foreground">{item.title}</h3>
            <p className="truncate text-[14px] text-muted-foreground">{item.owner}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-1">
          <Badge variant={type.variant}>{type.label}</Badge>
          <Badge variant="info">{item.category}</Badge>
          <Badge variant={status.variant}>{status.label}</Badge>
          <Badge>{item.version}</Badge>
        </div>

        <p className="text-[14px] leading-6 text-muted-foreground">{item.summary}</p>

        <Separator />

        <dl className="grid grid-cols-2 gap-3 text-[14px]">
          <div>
            <dt className="text-[12px] text-muted-foreground">Créé le</dt>
            <dd className="text-foreground">{formatKnowledgeDate(item.createdAt)}</dd>
          </div>
          <div>
            <dt className="text-[12px] text-muted-foreground">Mis à jour</dt>
            <dd className="text-foreground">{formatKnowledgeDate(item.updatedAt)}</dd>
          </div>
          <div>
            <dt className="text-[12px] text-muted-foreground">Agents liés</dt>
            <dd className="text-foreground tabular-nums">{agentCount}</dd>
          </div>
          <div>
            <dt className="text-[12px] text-muted-foreground">Tags</dt>
            <dd className="text-foreground tabular-nums">{item.tags.length}</dd>
          </div>
        </dl>

        <div className="flex flex-wrap gap-1">
          {item.tags.map((tag) => (
            <Badge key={tag}>#{tag}</Badge>
          ))}
        </div>
      </div>

      <div className="sticky bottom-0 flex flex-wrap gap-2 border-t border-border bg-surface p-4">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => navigate({ to: "/enterprise-brain/$itemId", params: { itemId: item.id } })}
        >
          <Maximize2 />
          Voir le document complet
        </Button>
      </div>
    </div>
  );
}
