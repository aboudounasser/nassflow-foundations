import { Badge } from "@/components/ui/badge";
import { DEAL_STAGE, formatCrmDate, formatEuro } from "@/lib/crm/meta";
import type { Contact, Deal } from "@/lib/crm/types";
import { cn } from "@/lib/utils";

export function DealCard({
  deal,
  contact,
  selected = false,
  onSelect,
}: {
  deal: Deal;
  contact: Contact | null;
  selected?: boolean;
  onSelect?: (deal: Deal) => void;
}) {
  const stage = DEAL_STAGE[deal.stage];

  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={() => onSelect?.(deal)}
      className={cn(
        "flex w-full cursor-pointer flex-col gap-2 rounded-lg border bg-surface p-3 text-left transition-colors duration-150 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        selected ? "border-primary bg-primary/5" : "border-border",
      )}
    >
      <p className="min-w-0 text-[14px] font-medium leading-5 text-foreground">{deal.title}</p>
      <p className="truncate text-[12px] text-muted-foreground">
        {contact ? `${contact.name} · ${contact.company}` : "Contact inconnu"}
      </p>
      <div className="flex flex-wrap gap-1">
        <Badge variant={stage.variant}>{formatEuro(deal.value)}</Badge>
        <Badge variant="neutral">{deal.probability}%</Badge>
      </div>
      <p className="text-[12px] text-muted-foreground">
        Clôture prévue : {formatCrmDate(deal.expectedCloseDate)}
      </p>
    </button>
  );
}
