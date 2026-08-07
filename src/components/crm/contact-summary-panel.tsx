import { useNavigate } from "@tanstack/react-router";
import { Maximize2 } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  CONTACT_STATUS,
  CONTACT_TYPE,
  DEAL_STAGE,
  contactInitials,
  formatCrmDate,
  formatEuro,
} from "@/lib/crm/meta";
import type { Contact, Deal } from "@/lib/crm/types";

/** Résumé compact d'un contact — Context Panel global. */
export function ContactSummaryPanel({
  contact,
  dealCount,
}: {
  contact: Contact;
  dealCount: number;
}) {
  const type = CONTACT_TYPE[contact.type];
  const status = CONTACT_STATUS[contact.status];
  const navigate = useNavigate();

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-5 p-6">
        <div className="flex items-start gap-3">
          <Avatar className="size-12 shrink-0">
            <AvatarFallback className="text-[13px]">{contactInitials(contact.name)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <h3 className="text-[16px] font-medium text-foreground">{contact.name}</h3>
            <p className="truncate text-[14px] text-muted-foreground">
              {contact.role} · {contact.company}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-1">
          <Badge variant={type.variant}>{type.label}</Badge>
          <Badge variant={status.variant}>{status.label}</Badge>
        </div>

        <Separator />

        <dl className="grid grid-cols-2 gap-3 text-[14px]">
          <div className="col-span-2 min-w-0">
            <dt className="text-[12px] text-muted-foreground">E-mail</dt>
            <dd className="truncate text-foreground">{contact.email}</dd>
          </div>
          <div>
            <dt className="text-[12px] text-muted-foreground">Téléphone</dt>
            <dd className="text-foreground">{contact.phone}</dd>
          </div>
          <div>
            <dt className="text-[12px] text-muted-foreground">Valeur</dt>
            <dd className="text-foreground tabular-nums">
              {contact.value !== null ? formatEuro(contact.value) : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-[12px] text-muted-foreground">Dernier contact</dt>
            <dd className="text-foreground">{formatCrmDate(contact.lastContactAt)}</dd>
          </div>
          <div>
            <dt className="text-[12px] text-muted-foreground">Deals</dt>
            <dd className="text-foreground tabular-nums">{dealCount}</dd>
          </div>
        </dl>

        <div className="flex flex-wrap gap-1">
          {contact.tags.map((tag) => (
            <Badge key={tag}>#{tag}</Badge>
          ))}
        </div>
      </div>

      <div className="sticky bottom-0 flex flex-wrap gap-2 border-t border-border bg-surface p-4">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => navigate({ to: "/crm/$contactId", params: { contactId: contact.id } })}
        >
          <Maximize2 />
          Voir la fiche complète
        </Button>
      </div>
    </div>
  );
}

/** Résumé compact d'un deal — Context Panel global. */
export function DealSummaryPanel({ deal, contact }: { deal: Deal; contact: Contact | null }) {
  const stage = DEAL_STAGE[deal.stage];
  const navigate = useNavigate();

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-5 p-6">
        <div className="min-w-0">
          <h3 className="text-[16px] font-medium text-foreground">{deal.title}</h3>
          <p className="truncate text-[14px] text-muted-foreground">
            {contact ? `${contact.name} · ${contact.company}` : "Contact inconnu"}
          </p>
        </div>

        <div className="flex flex-wrap gap-1">
          <Badge variant={stage.variant}>{stage.label}</Badge>
          <Badge>{formatEuro(deal.value)}</Badge>
          <Badge variant="neutral">{deal.probability}%</Badge>
        </div>

        <Separator />

        <dl className="grid grid-cols-2 gap-3 text-[14px]">
          <div>
            <dt className="text-[12px] text-muted-foreground">Clôture prévue</dt>
            <dd className="text-foreground">{formatCrmDate(deal.expectedCloseDate)}</dd>
          </div>
          <div>
            <dt className="text-[12px] text-muted-foreground">Valeur pondérée</dt>
            <dd className="text-foreground tabular-nums">
              {formatEuro(Math.round((deal.value * deal.probability) / 100))}
            </dd>
          </div>
          <div>
            <dt className="text-[12px] text-muted-foreground">Créé le</dt>
            <dd className="text-foreground">{formatCrmDate(deal.createdAt)}</dd>
          </div>
          <div>
            <dt className="text-[12px] text-muted-foreground">Mis à jour</dt>
            <dd className="text-foreground">{formatCrmDate(deal.updatedAt)}</dd>
          </div>
        </dl>
      </div>

      <div className="sticky bottom-0 flex flex-wrap gap-2 border-t border-border bg-surface p-4">
        {contact ? (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate({ to: "/crm/$contactId", params: { contactId: contact.id } })}
          >
            <Maximize2 />
            Voir la fiche contact
          </Button>
        ) : null}
      </div>
    </div>
  );
}
