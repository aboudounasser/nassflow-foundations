import { Badge } from "@/components/ui/badge";
import { KNOWLEDGE_STATUS, KNOWLEDGE_TYPE, formatKnowledgeDate } from "@/lib/knowledge/meta";
import type { KnowledgeItem } from "@/lib/knowledge/types";
import { cn } from "@/lib/utils";

export function KnowledgeCard({
  item,
  selected = false,
  compact = false,
  onSelect,
}: {
  item: KnowledgeItem;
  selected?: boolean;
  compact?: boolean;
  onSelect?: (item: KnowledgeItem) => void;
}) {
  const type = KNOWLEDGE_TYPE[item.type];
  const status = KNOWLEDGE_STATUS[item.status];
  const TypeIcon = type.icon;

  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={() => onSelect?.(item)}
      className={cn(
        "flex w-full cursor-pointer flex-col gap-3 rounded-lg border bg-surface p-4 text-left transition-colors duration-150 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        selected ? "border-primary" : "border-border",
        compact && "gap-2 p-3",
      )}
    >
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-border bg-card">
          <TypeIcon className="size-5 text-muted-foreground" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-medium text-foreground">{item.title}</p>
          <p className="line-clamp-2 text-[12px] leading-5 text-muted-foreground">{item.summary}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1">
        <Badge variant={type.variant}>{type.label}</Badge>
        <Badge variant="info">{item.category}</Badge>
        <Badge variant={status.variant}>{status.label}</Badge>
        <Badge>{item.version}</Badge>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-[12px] text-muted-foreground">
        <span className="truncate">{item.owner}</span>
        <span className="shrink-0">Maj · {formatKnowledgeDate(item.updatedAt)}</span>
      </div>
    </button>
  );
}

export function KnowledgeCardSkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 @2xl:grid-cols-2 @5xl:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="h-[168px] animate-pulse rounded-lg border border-border bg-card" />
      ))}
    </div>
  );
}
