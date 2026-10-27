/**
 * Types du tri de la boîte e-mail (Email Agent) — exactement ce que les tables
 * `inbox_messages` et `email_reply_drafts` contiennent. Le corps des e-mails
 * n'est jamais stocké.
 */

/** `automated` : écarté sur sa forme (newsletter, no-reply), sans appel IA. */
export type InboxCategory =
  "prospect" | "client" | "supplier" | "finance_admin" | "meeting" | "other" | "automated";

export type InboxPriority = "high" | "normal" | "low";

export type InboxStatus = "to_handle" | "handled" | "ignored";

export interface InboxMessage {
  id: string;
  integrationId: string;
  /** Fil Gmail : cible du lien « Ouvrir dans Gmail ». */
  threadId: string | null;
  fromHeader: string | null;
  subject: string | null;
  receivedAt: string | null;
  category: InboxCategory;
  priority: InboxPriority;
  summary: string | null;
  status: InboxStatus;
  createdAt: string;
}

export interface InboxFilters {
  search: string;
  /** `all` ou une valeur de l'énumération. */
  status: string;
  category: string;
  priority: string;
}

export interface InboxPage {
  messages: InboxMessage[];
  /** Total des messages correspondant aux filtres, au-delà de la page affichée. */
  total: number;
}

/** Résumé de Mission Control : messages à traiter, dont prioritaires. */
export interface InboxSummary {
  toHandle: number;
  highPriority: number;
  /** Les plus récents des prioritaires à traiter. */
  topHighPriority: InboxMessage[];
}

export interface ReplyDraft {
  id: string;
  body: string;
  missingInfo: string[];
  createdAt: string;
}
