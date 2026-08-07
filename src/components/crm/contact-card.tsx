import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CONTACT_STATUS,
  CONTACT_TYPE,
  contactInitials,
  formatCrmDate,
  formatEuro,
} from "@/lib/crm/meta";
import type { Contact } from "@/lib/crm/types";
import { cn } from "@/lib/utils";

export function ContactCardSkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 @2xl:grid-cols-2 @5xl:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-[152px] rounded-lg" />
      ))}
    </div>
  );
}

export function ContactCard({
  contact,
  selected = false,
  compact = false,
  onSelect,
}: {
  contact: Contact;
  selected?: boolean;
  compact?: boolean;
  onSelect?: (contact: Contact) => void;
}) {
  const type = CONTACT_TYPE[contact.type];
  const status = CONTACT_STATUS[contact.status];

  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={() => onSelect?.(contact)}
      className={cn(
        "flex w-full cursor-pointer flex-col gap-3 rounded-lg border bg-surface p-4 text-left transition-colors duration-150 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        selected ? "border-primary" : "border-border",
        compact && "gap-2 p-3",
      )}
    >
      <div className="flex items-start gap-3">
        <Avatar className="size-10 shrink-0">
          <AvatarFallback className="text-[12px]">{contactInitials(contact.name)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-medium text-foreground">{contact.name}</p>
          <p className="truncate text-[12px] text-muted-foreground">
            {contact.role} · {contact.company}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-1">
        <Badge variant={type.variant}>{type.label}</Badge>
        <Badge variant={status.variant}>{status.label}</Badge>
        {contact.value !== null ? <Badge>{formatEuro(contact.value)}</Badge> : null}
      </div>

      <p className="text-[12px] text-muted-foreground">
        Dernier contact : {formatCrmDate(contact.lastContactAt)}
      </p>
    </button>
  );
}
