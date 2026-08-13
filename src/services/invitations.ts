/**
 * Service Layer du module Invitations.
 *
 * Les trois RPC sont des fonctions SECURITY DEFINER déjà durcies côté base :
 * droits de l'appelant, doublons et plafond de membres y sont vérifiés. Leurs
 * messages d'erreur sont rédigés pour l'utilisateur final — ce module les
 * propage tels quels, sans jamais les remplacer par un texte générique.
 */
import type {
  CreatedInvitation,
  Invitation,
  InvitationPreview,
  JoinedOrganization,
  MyPendingInvitation,
} from "@/lib/invitations/types";
import { supabase } from "@/lib/supabase/client";
import type { MemberRoleDb } from "@/lib/supabase/database.types";
import type { Scope } from "@/lib/tenancy/types";

/**
 * PostgREST renvoie un objet pour une fonction scalaire et un tableau pour un
 * `setof`. On normalise ici pour ne pas dépendre de ce détail de signature.
 */
function firstRow<T>(value: T | T[] | null): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
}

/** Invitations encore ouvertes : ni acceptées, ni expirées. Plus récentes d'abord. */
export async function listInvitations(scope: Scope): Promise<Invitation[]> {
  const { data, error } = await supabase
    .from("invitations")
    .select("id, email, role, expires_at, created_at")
    .eq("organization_id", scope.organizationId)
    .is("accepted_at", null)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => ({
    id: row.id,
    email: row.email,
    role: row.role,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
  }));
}

export async function createInvitation(
  scope: Scope,
  email: string,
  role: MemberRoleDb,
): Promise<CreatedInvitation> {
  const { data, error } = await supabase.rpc("create_invitation", {
    org_id: scope.organizationId,
    invitee: email,
    new_role: role,
  });

  if (error) throw new Error(error.message);

  const row = firstRow(data);
  if (!row) throw new Error("Invitation impossible : réponse vide du serveur.");

  return {
    invitationId: row.invitation_id,
    token: row.token,
    alreadyMember: row.already_member,
  };
}

/** La RLS restreint déjà la suppression ; le filtre d'organisation est une ceinture. */
export async function revokeInvitation(scope: Scope, invitationId: string): Promise<void> {
  const { error } = await supabase
    .from("invitations")
    .delete()
    .eq("id", invitationId)
    .eq("organization_id", scope.organizationId);

  if (error) throw new Error(error.message);
}

/**
 * Invitations en attente adressées à l'utilisateur connecté.
 * Sans scope : appelée précisément quand l'utilisateur n'appartient encore à
 * aucune organisation. La RPC cible toujours `auth.uid()` — aucun paramètre ne
 * permet de viser quelqu'un d'autre.
 */
export async function getMyPendingInvitations(): Promise<MyPendingInvitation[]> {
  const { data, error } = await supabase.rpc("pending_invitations_for_me");

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => ({
    invitationId: row.invitation_id,
    organizationId: row.organization_id,
    organizationName: row.organization_name,
    role: row.role,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
  }));
}

/**
 * Acceptation depuis la liste « mes invitations », sans jeton.
 * La base n'ayant que `token_hash`, le lien n'est pas reconstituable : c'est la
 * correspondance d'adresse vérifiée côté serveur qui autorise, exactement comme
 * pour le parcours par lien.
 */
export async function acceptInvitationById(invitationId: string): Promise<JoinedOrganization> {
  const { data, error } = await supabase.rpc("accept_invitation_by_id", {
    invitation_id: invitationId,
  });

  if (error) throw new Error(error.message);

  const row = firstRow(data);
  if (!row) throw new Error("Cette invitation n'a pas pu être acceptée.");

  return { id: row.id, name: row.name };
}

/** Sans scope : l'appelant n'a pas encore d'organisation active. */
export async function acceptInvitation(token: string): Promise<JoinedOrganization> {
  const { data, error } = await supabase.rpc("accept_invitation", { raw_token: token });

  if (error) throw new Error(error.message);

  const row = firstRow(data);
  if (!row) throw new Error("Cette invitation n'a pas pu être acceptée.");

  return { id: row.id, name: row.name };
}

/** Sans scope ni authentification : appelée depuis la page publique /invite. */
export async function previewInvitation(token: string): Promise<InvitationPreview | null> {
  const { data, error } = await supabase.rpc("invitation_preview", { raw_token: token });

  if (error) throw new Error(error.message);

  const row = firstRow(data);
  if (!row) return null;

  return {
    organizationName: row.organization_name,
    email: row.email,
    expired: row.expired,
    accepted: row.accepted,
  };
}
