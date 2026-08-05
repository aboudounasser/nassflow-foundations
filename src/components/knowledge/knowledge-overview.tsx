import { Brain, CalendarClock, FolderTree, type LucideIcon } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { KNOWLEDGE_TYPE, KNOWLEDGE_TYPE_ORDER, formatKnowledgeDate } from "@/lib/knowledge/meta";
import type { KnowledgeItem } from "@/lib/knowledge/types";

function StatCard({
  icon: Icon,
  value,
  label,
}: {
  icon: LucideIcon;
  value: string;
  label: string;
}) {
  return (
    <Card className="flex items-center gap-3 border-border bg-surface p-4">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-border bg-card">
        <Icon className="size-5 text-muted-foreground" aria-hidden="true" />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-[20px] font-medium tabular-nums text-foreground">
          {value}
        </span>
        <span className="block text-[11px] uppercase leading-tight tracking-wide text-muted-foreground">
          {label}
        </span>
      </span>
    </Card>
  );
}

export function KnowledgeOverviewSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 @2xl:grid-cols-3 @5xl:grid-cols-4">
      {Array.from({ length: 7 }).map((_, i) => (
        <Skeleton key={i} className="h-[76px] rounded-xl" />
      ))}
    </div>
  );
}

export function KnowledgeOverview({ items }: { items: KnowledgeItem[] }) {
  const categories = new Set(items.map((i) => i.category));
  const lastUpdate = items.reduce<string | null>((latest, item) => {
    if (!latest) return item.updatedAt;
    return new Date(item.updatedAt) > new Date(latest) ? item.updatedAt : latest;
  }, null);

  return (
    <div className="@container">
      <div className="grid grid-cols-2 gap-4 @2xl:grid-cols-3 @5xl:grid-cols-4">
        <StatCard icon={Brain} value={String(items.length)} label="Connaissances" />
        {KNOWLEDGE_TYPE_ORDER.map((type) => {
          const meta = KNOWLEDGE_TYPE[type];
          return (
            <StatCard
              key={type}
              icon={meta.icon}
              value={String(items.filter((i) => i.type === type).length)}
              label={meta.plural}
            />
          );
        })}
        <StatCard icon={FolderTree} value={String(categories.size)} label="Catégories" />
        <StatCard
          icon={CalendarClock}
          value={lastUpdate ? formatKnowledgeDate(lastUpdate) : "—"}
          label="Dernière mise à jour"
        />
      </div>
    </div>
  );
}
