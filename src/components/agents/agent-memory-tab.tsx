import { Brain, ExternalLink } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";

import { EmptyState } from "@/components/common/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MEMORY_LEVEL, MEMORY_LEVEL_ORDER, formatAgentActivity } from "@/lib/agents/meta";
import type { AgentMemoryEntry, MemoryLevel } from "@/lib/agents/types";

/** Onglet « Mémoire » — lecture seule, filtre par niveau. */
export function AgentMemoryTab({ memory }: { memory: AgentMemoryEntry[] }) {
  const [level, setLevel] = useState<MemoryLevel>("working");
  const entries = useMemo(() => memory.filter((m) => m.level === level), [memory, level]);
  const navigate = useNavigate();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {MEMORY_LEVEL_ORDER.map((lv) => (
          <Button
            key={lv}
            type="button"
            size="sm"
            variant={level === lv ? "secondary" : "ghost"}
            onClick={() => setLevel(lv)}
            aria-pressed={level === lv}
          >
            {MEMORY_LEVEL[lv].label}
            <Badge className="ml-2">{memory.filter((m) => m.level === lv).length}</Badge>
          </Button>
        ))}
      </div>

      {entries.length === 0 ? (
        <EmptyState icon={Brain} title={MEMORY_LEVEL[level].emptyMessage} />
      ) : (
        <div className="flex flex-col gap-3">
          {entries.map((entry) => {
            const linkedId =
              entry.level === "enterprise_brain" && entry.sourceId ? entry.sourceId : null;
            return (
              <Card
                key={entry.id}
                className={`space-y-2 border-border bg-surface p-4 ${
                  linkedId
                    ? "cursor-pointer transition-colors duration-150 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    : ""
                }`}
                {...(linkedId
                  ? {
                      role: "link" as const,
                      tabIndex: 0,
                      onClick: () =>
                        navigate({ to: "/enterprise-brain/$itemId", params: { itemId: linkedId } }),
                      onKeyDown: (e: React.KeyboardEvent) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          navigate({
                            to: "/enterprise-brain/$itemId",
                            params: { itemId: linkedId },
                          });
                        }
                      },
                    }
                  : {})}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="min-w-0 text-[14px] font-medium text-foreground">{entry.title}</p>
                  <div className="flex flex-wrap gap-1">
                    <Badge variant={MEMORY_LEVEL[entry.level].variant}>
                      {MEMORY_LEVEL[entry.level].label}
                    </Badge>
                    {entry.confidenceScore !== null ? (
                      <Badge variant="neutral">Confiance {entry.confidenceScore}%</Badge>
                    ) : null}
                    {linkedId ? (
                      <ExternalLink
                        className="size-4 shrink-0 self-center text-muted-foreground"
                        aria-hidden="true"
                      />
                    ) : null}
                  </div>
                </div>
                <p className="text-[14px] leading-6 text-muted-foreground">{entry.content}</p>
                <dl className="flex flex-wrap gap-x-6 gap-y-1 text-[12px] text-muted-foreground">
                  <div className="flex gap-1">
                    <dt>Source :</dt>
                    <dd className="text-foreground">{entry.source}</dd>
                  </div>
                  <div className="flex gap-1">
                    <dt>Créée le :</dt>
                    <dd className="text-foreground">{formatAgentActivity(entry.createdAt)}</dd>
                  </div>
                  <div className="flex gap-1">
                    <dt>Dernier accès :</dt>
                    <dd className="text-foreground">{formatAgentActivity(entry.lastAccessed)}</dd>
                  </div>
                </dl>
              </Card>
            );
          })}
        </div>
      )}

      <p className="text-[12px] text-muted-foreground">
        Lecture seule — l'édition de la mémoire arrivera dans une prochaine itération.
      </p>
    </div>
  );
}
