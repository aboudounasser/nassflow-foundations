/**
 * Service Layer du raccordement OAuth des comptes externes.
 *
 * Deux moitiés bien séparées :
 * - l'ouverture du parcours, confiée à l'Edge Function `gmail-oauth-start`
 *   (c'est elle qui vérifie que l'appelant est owner ou admin, et elle seule
 *   détient le secret client Google) ;
 * - la lecture de la table `integrations`, en RLS, réservée aux owner et admin.
 *
 * Aucune écriture n'est possible depuis le navigateur : les lignes sont posées
 * par `gmail-oauth-callback`.
 */
import { FunctionsHttpError } from "@supabase/supabase-js";

import type { Connection, ConnectionStatus } from "@/lib/integrations-oauth/types";
import { supabase } from "@/lib/supabase/client";
import type { Scope } from "@/lib/tenancy/types";

const START_FALLBACK_ERROR = "Connexion Gmail impossible. Réessayez plus tard.";

/** Page de retour après le détour par Google — celle qui lira `?gmail=`. */
function returnToUrl(): string {
  return typeof window === "undefined" ? "" : `${window.location.origin}/integrations-hub`;
}

function errorFromBody(body: unknown): string | null {
  if (typeof body !== "object" || body === null) return null;
  const message = (body as { error?: unknown }).error;
  return typeof message === "string" && message.length > 0 ? message : null;
}

/**
 * Un statut absent de l'énumération est traité comme une anomalie, jamais comme
 * un compte actif : mieux vaut alerter à tort que présenter un raccordement
 * douteux comme opérationnel.
 */
const KNOWN_STATUSES: ConnectionStatus[] = ["active", "revoked", "error"];

function toConnectionStatus(value: string): ConnectionStatus {
  return KNOWN_STATUSES.includes(value as ConnectionStatus) ? (value as ConnectionStatus) : "error";
}

/**
 * Ouvre le parcours d'autorisation Google et renvoie l'URL de consentement.
 * Le corps 403 porte le refus de droits ; supabase-js ne l'expose pas dans
 * `error.message` — même extraction que `deleteAccount()`.
 */
export async function startGmailConnection(organizationId: string): Promise<string> {
  const { data, error } = await supabase.functions.invoke("gmail-oauth-start", {
    method: "POST",
    body: { organizationId, returnTo: returnToUrl() },
  });

  if (error) {
    if (error instanceof FunctionsHttpError) {
      const body: unknown = await error.context.json().catch(() => null);
      throw new Error(errorFromBody(body) ?? START_FALLBACK_ERROR);
    }
    throw new Error(error.message);
  }

  const payload = data as { authUrl?: unknown; error?: unknown } | null;
  const inlineError = errorFromBody(payload);
  if (inlineError) throw new Error(inlineError);

  const authUrl = payload?.authUrl;
  if (typeof authUrl !== "string" || authUrl.length === 0) {
    throw new Error("Réponse inattendue du serveur : URL d'autorisation manquante.");
  }
  return authUrl;
}

/**
 * Comptes raccordés de l'organisation, les plus récents d'abord.
 * La RLS réserve la lecture aux owner et admin : pour les autres rôles, la
 * requête aboutit sur une liste vide plutôt que sur une erreur.
 */
export async function listConnections(scope: Scope): Promise<Connection[]> {
  const { data, error } = await supabase
    .from("integrations")
    .select("id, provider, account_email, status, connected_by, created_at")
    .eq("organization_id", scope.organizationId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => ({
    id: row.id,
    provider: row.provider,
    accountEmail: row.account_email,
    status: toConnectionStatus(row.status),
    connectedBy: row.connected_by,
    createdAt: row.created_at,
  }));
}
