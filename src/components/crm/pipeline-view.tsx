import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DEAL_STAGE, DEAL_STAGE_ORDER, formatEuro } from "@/lib/crm/meta";
import type { Contact, Deal } from "@/lib/crm/types";
import { DealCard } from "./deal-card";

export function PipelineSkeleton() {
  return (
    <div className="flex gap-4 overflow-hidden">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="w-[260px] shrink-0 space-y-3">
          <Skeleton className="h-6 w-24 rounded-md" />
          <Skeleton className="h-24 w-full rounded-lg" />
          <Skeleton className="h-24 w-full rounded-lg" />
        </div>
      ))}
    </div>
  );
}

export function PipelineKanban({
  deals,
  contacts,
  selectedId,
  onSelect,
}: {
  deals: Deal[];
  contacts: Contact[];
  selectedId: string | null;
  onSelect: (deal: Deal) => void;
}) {
  const contactOf = (id: string) => contacts.find((c) => c.id === id) ?? null;

  return (
    <div className="@container/kanban -mx-1 flex snap-x gap-4 overflow-x-auto px-1 pb-2">
      {DEAL_STAGE_ORDER.map((stage) => {
        const items = deals.filter((d) => d.stage === stage);
        const total = items.reduce((sum, d) => sum + d.value, 0);
        return (
          <section
            key={stage}
            className="w-[260px] shrink-0 snap-start space-y-3 rounded-xl border border-border bg-surface p-3"
          >
            <header className="space-y-1">
              <div className="flex items-center justify-between gap-2">
                <h3 className="truncate text-[14px] font-medium text-foreground">
                  {DEAL_STAGE[stage].label}
                </h3>
                <Badge>{items.length}</Badge>
              </div>
              <p className="text-[12px] tabular-nums text-muted-foreground">{formatEuro(total)}</p>
            </header>

            {items.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border p-4 text-[12px] text-muted-foreground">
                Aucun deal
              </p>
            ) : (
              <div className="space-y-2">
                {items.map((deal) => (
                  <DealCard
                    key={deal.id}
                    deal={deal}
                    contact={contactOf(deal.contactId)}
                    selected={deal.id === selectedId}
                    onSelect={onSelect}
                  />
                ))}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
