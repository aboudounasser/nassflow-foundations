/** Modèle du module Invitations — rattaché à l'écran Organization. */

import type { MemberRoleDb } from "@/lib/supabase/database.types";

/** Invitation en attente, telle que listée dans l'écran Organization. */
export interface Invitation {
  id: string;
  email: string;
  role: MemberRoleDb;
  expiresAt: string;
  createdAt: string;
}

/**
 * Résultat de `create_invitation`.
 * `alreadyMember` à true : la personne avait déjà un compte et vient d'être
 * ajoutée directement — il n'y a alors aucun token à transmettre.
 */
export interface CreatedInvitation {
  invitationId: string;
  token: string | null;
  alreadyMember: boolean;
}

/**
 * Invitation adressée à l'utilisateur connecté, vue depuis son côté.
 * Renvoyée par `pending_invitations_for_me()`, qui ne divulgue jamais de jeton :
 * l'acceptation passe donc par l'identifiant, pas par un lien.
 */
export interface MyPendingInvitation {
  invitationId: string;
  organizationId: string;
  organizationName: string;
  role: MemberRoleDb;
  expiresAt: string;
  createdAt: string;
}

/** Aperçu public d'une invitation, lisible sans authentification. */
export interface InvitationPreview {
  organizationName: string;
  email: string;
  expired: boolean;
  accepted: boolean;
}

/** Organisation rejointe, renvoyée par `accept_invitation`. */
export interface JoinedOrganization {
  id: string;
  name: string;
}
