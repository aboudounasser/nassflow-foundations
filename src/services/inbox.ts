/**
 * Service Layer du tri de la boîte e-mail (Email Agent).
 *
 * - Lecture de `inbox_messages` et `email_reply_drafts`, en RLS, réservée aux
 *   owner et admin. Les lignes sont écrites par l'analyse Gmail
 *   (`run-gmail-scan`, `scheduled-gmail-scan`), jamais ici.
 * - Seule écriture possible depuis le navigateur : le statut d'un message
 *   (grant de colonne).
 * - Les propositions de réponse passent par l'Edge Function
 *   `draft-email-reply`, qui vérifie le rôle et le budget du jour.
 */
import { FunctionsHttpError } from "@supabase/supabase-js";

import type {
  InboxCategory,
  InboxFilters,
  InboxMessage,
  InboxPage,
  InboxPriority,
  InboxStatus,
  InboxSummary,
  ReplyDraft,
} from "@/lib/inbox/types";
import { supabase } from "@/lib/supabase/client";
import type { Json } from "@/lib/supabase/database.types";
import type { Scope } from "@/lib/tenancy/types";

/** Plafond de la liste de la fiche : au-delà, « N affichés sur T ». */
const PAGE_LIMIT = 50;
/** Prioritaires montrés sur Mission Control. */
const SUMMARY_TOP = 3;

const DRAFT_FALLBACK_ERROR =
  "La proposition de réponse n'a pas pu être générée. Réessayez plus tard.";
const STATUS_FALLBACK_ERROR = "Vous n'avez pas le droit de modifier ce message.";

const COLUMNS =
  "id, integration_id, thread_id, from_header, subject, received_at, category, priority, summary, status, created_at";

interface InboxMessageRow {
  id: string;
  integration_id: string;
  thread_id: string | null;
  from_header: string | null;
  subject: string | null;
  received_at: string | null;
  category: string;
  priority: string;
  summary: string | null;
  status: string;
  created_at: string;
}

const CATEGORIES: InboxCategory[] = [
  "prospect",
  "client",
  "supplier",
  "finance_admin",
  "meeting",
  "other",
  "automated",
];
const PRIORITIES: InboxPriority[] = ["high", "normal", "low"];
const STATUSES: InboxStatus[] = ["to_handle", "handled", "ignored"];

/** Valeurs contraintes côté base ; une valeur inconnue prend la valeur neutre. */
function toCategory(value: string): InboxCategory {
  return CATEGORIES.includes(value as InboxCategory) ? (value as InboxCategory) : "other";
}
function toPriority(value: string): InboxPriority {
  return PRIORITIES.includes(value as InboxPriority) ? (value as InboxPriority) : "normal";
}
function toStatus(value: string): InboxStatus {
  return STATUSES.includes(value as InboxStatus) ? (value as InboxStatus) : "to_handle";
}

function toInboxMessage(row: InboxMessageRow): InboxMessage {
  return {
    id: row.id,
    integrationId: row.integration_id,
    threadId: row.thread_id,
    fromHeader: row.from_header,
    subject: row.subject,
    receivedAt: row.received_at,
    category: toCategory(row.category),
    priority: toPriority(row.priority),
    summary: row.summary,
    status: toStatus(row.status),
    createdAt: row.created_at,
  };
}

/**
 * Terme de recherche utilisable dans un filtre `or(...)` de PostgREST : les
 * caractères qui en structurent la syntaxe (virgule, parenthèses, guillemets)
 * ou servent de jokers sont retirés.
 */
function searchTerm(raw: string): string {
  return raw.replace(/[,()"'\\*%:]/g, " ").trim();
}

/**
 * Messages triés correspondant aux filtres, les plus récents d'abord. Le tri
 * par priorité se fait à l'affichage, sur la page reçue.
 */
export async function listInboxMessages(scope: Scope, filters: InboxFilters): Promise<InboxPage> {
  let query = supabase
    .from("inbox_messages")
    .select(COLUMNS, { count: "exact" })
    .eq("organization_id", scope.organizationId);

  if (filters.status !== "all") query = query.eq("status", filters.status);
  if (filters.category !== "all") query = query.eq("category", filters.category);
  if (filters.priority !== "all") query = query.eq("priority", filters.priority);
  const term = searchTerm(filters.search);
  if (term) query = query.or(`subject.ilike.*${term}*,from_header.ilike.*${term}*`);

  const { data, error, count } = await query
    .order("received_at", { ascending: false, nullsFirst: false })
    .limit(PAGE_LIMIT);

  if (error) throw new Error(error.message);
  const messages = (data ?? []).map(toInboxMessage);
  return { messages, total: count ?? messages.length };
}

/** Résumé de Mission Control : à traiter, dont prioritaires, et les plus récents d'entre eux. */
export async function getInboxSummary(scope: Scope): Promise<InboxSummary> {
  const [toHandleRes, highRes] = await Promise.all([
    supabase
      .from("inbox_messages")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", scope.organizationId)
      .eq("status", "to_handle"),
    supabase
      .from("inbox_messages")
      .select(COLUMNS, { count: "exact" })
      .eq("organization_id", scope.organizationId)
      .eq("status", "to_handle")
      .eq("priority", "high")
      .order("received_at", { ascending: false, nullsFirst: false })
      .limit(SUMMARY_TOP),
  ]);

  if (toHandleRes.error) throw new Error(toHandleRes.error.message);
  if (highRes.error) throw new Error(highRes.error.message);

  const topHighPriority = (highRes.data ?? []).map(toInboxMessage);
  return {
    toHandle: toHandleRes.count ?? 0,
    highPriority: highRes.count ?? topHighPriority.length,
    topHighPriority,
  };
}

/**
 * Change le statut d'un message. Le filtre sur l'organisation double la RLS ;
 * une mise à jour qui n'atteint aucune ligne vaut refus.
 */
export async function updateInboxStatus(
  scope: Scope,
  messageId: string,
  status: InboxStatus,
): Promise<void> {
  const { data, error } = await supabase
    .from("inbox_messages")
    .update({ status })
    .eq("organization_id", scope.organizationId)
    .eq("id", messageId)
    .select("id");

  if (error) throw new Error(error.message);
  if (!data || data.length === 0) throw new Error(STATUS_FALLBACK_ERROR);
}

/** `missing_info` est un tableau jsonb rempli par le modèle : seules les chaînes passent. */
function toMissingInfo(value: Json | unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && item.length > 0)
    : [];
}

/** Dernière proposition lisible d'un message, ou `null`. */
export async function getLatestDraft(scope: Scope, messageId: string): Promise<ReplyDraft | null> {
  const { data, error } = await supabase
    .from("email_reply_drafts")
    .select("id, body, missing_info, created_at")
    .eq("organization_id", scope.organizationId)
    .eq("inbox_message_id", messageId)
    .not("body", "is", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data || data.body === null) return null;
  return {
    id: data.id,
    body: data.body,
    missingInfo: toMissingInfo(data.missing_info),
    createdAt: data.created_at,
  };
}

function errorFromBody(body: unknown): string | null {
  if (typeof body !== "object" || body === null) return null;
  const message = (body as { error?: unknown }).error;
  return typeof message === "string" && message.length > 0 ? message : null;
}

/**
 * Demande une proposition de réponse. Les refus (droits, Gmail non actif,
 * budget du jour atteint, double clic) portent un message rédigé pour
 * l'utilisateur, extrait du corps comme pour `deleteAccount()`.
 */
export async function generateReplyDraft(scope: Scope, messageId: string): Promise<ReplyDraft> {
  const { data, error } = await supabase.functions.invoke("draft-email-reply", {
    method: "POST",
    body: { organizationId: scope.organizationId, inboxMessageId: messageId },
  });

  if (error) {
    if (error instanceof FunctionsHttpError) {
      const body: unknown = await error.context.json().catch(() => null);
      throw new Error(errorFromBody(body) ?? DRAFT_FALLBACK_ERROR);
    }
    throw new Error(error.message);
  }

  const payload = data as {
    draftId?: unknown;
    createdAt?: unknown;
    body?: unknown;
    missingInfo?: unknown;
  } | null;
  const inlineError = errorFromBody(payload);
  if (inlineError) throw new Error(inlineError);

  if (typeof payload?.draftId !== "string" || typeof payload.body !== "string") {
    throw new Error(DRAFT_FALLBACK_ERROR);
  }
  return {
    id: payload.draftId,
    body: payload.body,
    missingInfo: toMissingInfo(payload.missingInfo),
    createdAt: typeof payload.createdAt === "string" ? payload.createdAt : new Date().toISOString(),
  };
}
