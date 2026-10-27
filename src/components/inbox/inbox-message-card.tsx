import { ExternalLink, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { ReplyDraftPanel } from "@/components/inbox/reply-draft-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  INBOX_CATEGORY,
  INBOX_PRIORITY,
  INBOX_STATUS,
  INBOX_STATUSES,
  gmailThreadUrl,
  senderLabel,
} from "@/lib/inbox/meta";
import { useUpdateInboxStatus } from "@/lib/inbox/queries";
import type { InboxMessage, InboxStatus } from "@/lib/inbox/types";
import { formatRelativeScanDate, formatScanDateTime } from "@/lib/scans/meta";

const STATUS_FALLBACK_ERROR = "Le statut n'a pas pu être modifié.";

/**
 * Un message trié : expéditeur, objet, catégorie, priorité et résumé, avec son
 * statut et les deux actions utiles — proposer une réponse, ouvrir le fil
 * dans Gmail. La liste n'est montée que pour les owner et admin, seuls rôles
 * que la RLS et `draft-email-reply` acceptent.
 */
export function InboxMessageCard({
  message,
  accountEmail,
}: {
  message: InboxMessage;
  /** Boîte Gmail du message, pour ouvrir le fil dans le bon compte. */
  accountEmail: string | null;
}) {
  const [draftOpen, setDraftOpen] = useState(false);
  const statusMutation = useUpdateInboxStatus();

  const category = INBOX_CATEGORY[message.category];
  const CategoryIcon = category.icon;
  const priority = INBOX_PRIORITY[message.priority];
  const gmailUrl = gmailThreadUrl(message.threadId, accountEmail);
  // Une newsletter ou un no-reply n'appelle pas de réponse ; la fonction le refuse aussi.
  const canDraft = message.category !== "automated";

  const changeStatus = (status: string) => {
    statusMutation.mutate(
      { messageId: message.id, status: status as InboxStatus },
      {
        onSuccess: () =>
          toast.success(`Message marqué « ${INBOX_STATUS[status as InboxStatus].label} »`),
        onError: (e) => toast.error(e instanceof Error ? e.message : STATUS_FALLBACK_ERROR),
      },
    );
  };

  return (
    <li className="rounded-lg border border-border bg-surface p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-[14px] font-medium text-foreground">
            {senderLabel(message.fromHeader)}
          </p>
          <p className="truncate text-[12px] text-muted-foreground">
            {message.subject?.trim() || "(sans objet)"}
          </p>
        </div>
        <p
          className="shrink-0 text-[12px] text-muted-foreground"
          title={formatScanDateTime(message.receivedAt)}
        >
          {formatRelativeScanDate(message.receivedAt)}
        </p>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-1">
        <Badge variant="neutral">
          <CategoryIcon aria-hidden="true" />
          {category.label}
        </Badge>
        <Badge variant={priority.variant}>{priority.label}</Badge>
      </div>

      {message.summary ? (
        <p className="mt-2 text-[14px] leading-6 break-words text-foreground">{message.summary}</p>
      ) : null}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Select
          value={message.status}
          onValueChange={changeStatus}
          disabled={statusMutation.isPending}
        >
          <SelectTrigger className="w-auto min-w-[150px]" aria-label="Statut du message">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {INBOX_STATUSES.map((status) => (
              <SelectItem key={status} value={status}>
                {INBOX_STATUS[status].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {canDraft ? (
          <Button
            type="button"
            size="sm"
            variant="secondary"
            aria-expanded={draftOpen}
            onClick={() => setDraftOpen((open) => !open)}
          >
            <Sparkles />
            {draftOpen ? "Masquer la réponse" : "Proposer une réponse"}
          </Button>
        ) : null}

        {gmailUrl ? (
          <Button asChild size="sm" variant="ghost">
            <a href={gmailUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink />
              Ouvrir dans Gmail
            </a>
          </Button>
        ) : null}
      </div>

      {draftOpen && canDraft ? <ReplyDraftPanel messageId={message.id} /> : null}
    </li>
  );
}
