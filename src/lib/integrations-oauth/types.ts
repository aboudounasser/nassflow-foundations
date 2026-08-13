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
  /** `gmail` aujourd'hui ; la colonne accueillera d'autres fournisseurs. */
  provider: string;
  accountEmail: string | null;
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
