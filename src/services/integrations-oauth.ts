/**
 * Service Layer du raccordement OAuth des comptes externes.
 *
 * Deux moitiés bien séparées :
 * - l'ouverture du parcours, confiée aux Edge Functions `gmail-oauth-start` et
 *   `hubspot-oauth-start` (ce sont elles qui vérifient que l'appelant est owner
 *   ou admin, et elles seules détiennent les secrets clients) ;
 * - la lecture de la table `integrations`, en RLS, réservée aux owner et admin.
 *
 * Aucune écriture n'est possible depuis le navigateur : les lignes sont posées
 * par `gmail-oauth-callback` et `hubspot-oauth-callback`.
 */
import { FunctionsHttpError } from "@supabase/supabase-js";

import type { Connection, ConnectionStatus } from "@/lib/integrations-oauth/types";
import { supabase } from "@/lib/supabase/client";
import type { Scope } from "@/lib/tenancy/types";

const GMAIL_START_FALLBACK_ERROR = "Connexion Gmail impossible. Réessayez plus tard.";
const HUBSPOT_START_FALLBACK_ERROR = "Connexion HubSpot impossible. Réessayez plus tard.";
const DISCONNECT_FALLBACK_ERROR = "La déconnexion n'a pas abouti. Réessayez plus tard.";

/** Page de retour après le détour par le fournisseur — celle qui lira `?gmail=` ou `?hubspot=`. */
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
 * Ouvre un parcours d'autorisation et renvoie l'URL de consentement.
 * Le corps 403 (droits) ou 409 (CRM déjà connecté) porte le message métier ;
 * supabase-js ne l'expose pas dans `error.message` — même extraction que
 * `deleteAccount()`.
 */
async function startConnection(
  functionName: string,
  organizationId: string,
  fallbackError: string,
): Promise<string> {
  const { data, error } = await supabase.functions.invoke(functionName, {
    method: "POST",
    body: { organizationId, returnTo: returnToUrl() },
  });

  if (error) {
    if (error instanceof FunctionsHttpError) {
      const body: unknown = await error.context.json().catch(() => null);
      throw new Error(errorFromBody(body) ?? fallbackError);
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

/** Ouvre le parcours d'autorisation Google. */
export function startGmailConnection(organizationId: string): Promise<string> {
  return startConnection("gmail-oauth-start", organizationId, GMAIL_START_FALLBACK_ERROR);
}

/**
 * Ouvre le parcours d'autorisation HubSpot. Refusé en 409 si l'organisation a
 * déjà un portail actif : une entreprise n'a qu'un CRM.
 */
export function startHubspotConnection(organizationId: string): Promise<string> {
  return startConnection("hubspot-oauth-start", organizationId, HUBSPOT_START_FALLBACK_ERROR);
}

/**
 * Comptes raccordés de l'organisation, les plus récents d'abord.
 * La RLS réserve la lecture aux owner et admin : pour les autres rôles, la
 * requête aboutit sur une liste vide plutôt que sur une erreur.
 */
export async function listConnections(scope: Scope): Promise<Connection[]> {
  const { data, error } = await supabase
    .from("integrations")
    .select("id, provider, account_email, external_account_id, status, connected_by, created_at")
    .eq("organization_id", scope.organizationId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => ({
    id: row.id,
    provider: row.provider,
    accountEmail: row.account_email,
    externalAccountId: row.external_account_id,
    status: toConnectionStatus(row.status),
    connectedBy: row.connected_by,
    createdAt: row.created_at,
  }));
}

/**
 * Révoque l'accès à un compte raccordé, Gmail ou HubSpot : `disconnect-gmail`
 * ne filtre pas sur le fournisseur. Pour HubSpot, seul notre jeton est
 * supprimé — l'app reste installée sur le portail tant que
 * `disconnect-hubspot` n'existe pas.
 *
 * Idempotente côté Edge Function : rappeler sur une intégration déjà révoquée
 * renvoie 200 sans rien changer, donc aucun état local particulier n'est requis
 * ici pour ce cas.
 *
 * Le corps 403 (droits) ou 404 (intégration étrangère à l'organisation) porte
 * le message métier ; supabase-js ne l'expose pas dans `error.message` — même
 * extraction que `startConnection()`.
 */
export async function disconnectGmail(scope: Scope, integrationId: string): Promise<void> {
  const { error } = await supabase.functions.invoke("disconnect-gmail", {
    method: "POST",
    body: { organizationId: scope.organizationId, integrationId },
  });

  if (error) {
    if (error instanceof FunctionsHttpError) {
      const body: unknown = await error.context.json().catch(() => null);
      throw new Error(errorFromBody(body) ?? DISCONNECT_FALLBACK_ERROR);
    }
    throw new Error(error.message);
  }
}
