import { Link } from "@tanstack/react-router";
import { LifeBuoy, MessageSquare, Ticket } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { EmptyState } from "@/components/common/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  TICKET_PRIORITY,
  TICKET_STATUS,
  TICKET_STATUS_ORDER,
  formatHelpDate,
} from "@/lib/help/meta";
import type { SupportTicket, SupportTicketStatus } from "@/lib/help/types";
import { cn } from "@/lib/utils";

export function HelpSupportSection({ allTickets }: { allTickets: SupportTicket[] }) {
  const [status, setStatus] = useState<SupportTicketStatus | "all">("all");

  const tickets = allTickets.filter((t) => status === "all" || t.status === status);

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <Card className="min-w-0 border-border bg-card p-4">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-border bg-surface">
            <LifeBuoy className="size-5 text-muted-foreground" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-[14px] font-medium text-foreground">Nous contacter</p>
            <p className="text-[13px] leading-5 text-muted-foreground">
              Ouvrez un ticket auprès de l'équipe NASSFLOW, ou sollicitez le Support Agent de votre
              AI Workforce pour une première réponse immédiate.
            </p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button size="sm" onClick={() => toast.success("Ticket de support créé (mock)")}>
            <Ticket />
            Ouvrir un ticket
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => toast("Conversation ouverte avec le Support Agent (mock)")}
          >
            <MessageSquare />
            Discuter avec le Support Agent
          </Button>
          <Button size="sm" variant="ghost" asChild>
            <Link to="/agents/$agentId" params={{ agentId: "a-support" }}>
              Voir la fiche du Support Agent
            </Link>
          </Button>
        </div>
      </Card>

      <div className="flex flex-wrap gap-2">
        <StatusChip active={status === "all"} onClick={() => setStatus("all")}>
          Tous ({allTickets.length})
        </StatusChip>
        {TICKET_STATUS_ORDER.map((s) => {
          const count = allTickets.filter((t) => t.status === s).length;
          return (
            <StatusChip key={s} active={status === s} onClick={() => setStatus(s)}>
              {TICKET_STATUS[s].label} ({count})
            </StatusChip>
          );
        })}
      </div>

      {tickets.length === 0 ? (
        <EmptyState
          icon={Ticket}
          title="Aucun ticket pour ce statut"
          description="Changez de filtre pour voir les autres demandes."
        />
      ) : (
        <ul className="flex min-w-0 flex-col gap-3">
          {tickets.map((ticket) => {
            const st = TICKET_STATUS[ticket.status];
            const prio = TICKET_PRIORITY[ticket.priority];
            return (
              <li
                key={ticket.id}
                className="min-w-0 rounded-lg border border-border bg-surface p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[12px] text-muted-foreground tabular-nums">
                      {ticket.reference}
                    </p>
                    <p className="text-[14px] font-medium text-foreground">{ticket.subject}</p>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    <Badge variant={st.variant}>{st.label}</Badge>
                    <Badge variant={prio.variant}>{prio.label}</Badge>
                  </div>
                </div>
                <p className="mt-2 max-w-[72ch] text-[13px] leading-5 text-muted-foreground">
                  {ticket.lastMessage}
                </p>
                <p className="mt-2 text-[12px] text-muted-foreground/70">
                  Créé le {formatHelpDate(ticket.createdAt)} · Maj{" "}
                  {formatHelpDate(ticket.updatedAt)}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function StatusChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "cursor-pointer rounded-full border px-3 py-1.5 text-[12px] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        active
          ? "border-primary bg-accent text-foreground"
          : "border-border bg-surface text-muted-foreground hover:bg-accent",
      )}
    >
      {children}
    </button>
  );
}
