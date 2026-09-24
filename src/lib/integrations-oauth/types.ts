/**
 * Modèle des comptes externes réellement raccordés (table `integrations`).
 *
 * À ne pas confondre avec `@/lib/integrations`, qui décrit le catalogue
 * d'intégrations encore alimenté par des mocks. Ici, les lignes viennent de la
 * base : elles sont écrites exclusivement par les Edge Functions OAuth, jamais
 * depuis le navigateur.
 */

export type ConnectionStatus = "active" | "revoked" | "error";

export interface Connection {
  id: string;
  /** `gmail` ou `hubspot` ; la colonne accueillera d'autres fournisseurs. */
  provider: string;
  accountEmail: string | null;
  /** Identité du compte quand il n'a pas d'e-mail (HubSpot : `hub_id` du portail). */
  externalAccountId: string | null;
  status: ConnectionStatus;
  connectedBy: string | null;
  createdAt: string;
}

/** Codes que `gmail-oauth-callback` renvoie dans `?gmail=` au retour de Google. */
export type GmailCallbackCode =
  | "connected"
  | "refused"
  | "invalid"
  | "expired"
  | "token_error"
  | "no_refresh"
  | "profile_error"
  | "vault_error"
  | "save_error";

/** Codes que `hubspot-oauth-callback` renvoie dans `?hubspot=` au retour de HubSpot. */
export type HubspotCallbackCode =
  | "connected"
  | "refused"
  | "invalid"
  | "expired"
  | "token_error"
  | "no_refresh"
  | "vault_error"
  | "save_error"
  | "already_connected";
