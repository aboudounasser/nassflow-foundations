import { UNASSIGNED_DEPARTMENT } from "@/lib/organization/meta";
import type { MemberRole, OrganizationProfile, OrgMember } from "@/lib/organization/types";
import { supabase } from "@/lib/supabase/client";
import type { Scope } from "@/lib/tenancy/types";

/**
 * Profil réel de l'organisation active (table `organizations`).
 *
 * Seul `name` existe en base : `foundedYear`, `plan`, `timezone` et
 * `primaryLocale` n'ont pas de colonne et restent `null` — à l'appelant
 * d'afficher une mention neutre plutôt qu'une valeur inventée.
 */
export async function getOrganizationProfile(scope: Scope): Promise<OrganizationProfile> {
  const { data, error } = await supabase
    .from("organizations")
    .select("id, name")
    .eq("id", scope.organizationId)
    .single();

  if (error) throw new Error(error.message);

  return {
    id: data.id,
    name: data.name,
    foundedYear: null,
    plan: null,
    timezone: null,
    primaryLocale: null,
  };
}

/** Colonnes lues dans `memberships` pour un membre de l'annuaire. */
interface MembershipRow {
  id: string;
  user_id: string;
  role: MemberRole;
  created_at: string;
}

/** Colonnes lues dans `profiles`. */
interface ProfileRow {
  id: string;
  email: string | null;
  full_name: string | null;
  job_title: string | null;
}

/**
 * Assemble un membre à partir de son appartenance et de son profil. Partagée
 * par l'annuaire et par la fiche, pour que les deux ne puissent pas diverger.
 *
 * Champs en attente d'une colonne, valeur neutre explicite plutôt qu'inventée :
 *   department → "Non renseigné"   status → "active"
 *   avatar     → null              managerId → null
 * L'interface n'affiche ni le département ni le statut.
 */
function toOrgMember(membership: MembershipRow, profile: ProfileRow | null | undefined): OrgMember {
  const email = profile?.email ?? "";
  return {
    id: membership.id,
    membershipId: membership.id,
    userId: membership.user_id,
    name: profile?.full_name ?? email,
    email,
    jobTitle: profile?.job_title ?? "",
    department: UNASSIGNED_DEPARTMENT,
    role: membership.role,
    status: "active",
    avatar: null,
    managerId: null,
    joinedAt: membership.created_at,
  };
}

/**
 * Annuaire réel, lu dans `memberships` et `profiles`.
 *
 * Champs réels :
 *   membershipId, userId (memberships.id, memberships.user_id)
 *   role, joinedAt        (memberships.role, memberships.created_at)
 *   email, name, jobTitle (profiles.email, full_name, job_title)
 */
export async function getOrgMembers(scope: Scope): Promise<OrgMember[]> {
  const { data, error } = await supabase
    .from("memberships")
    .select("id, user_id, role, created_at")
    .eq("organization_id", scope.organizationId);

  if (error) throw new Error(error.message);

  const memberships = data ?? [];
  if (memberships.length === 0) return [];

  // Jointure côté service : aucune clé étrangère ne relie memberships à profiles
  // — les deux référencent auth.users — donc PostgREST ne peut pas l'imbriquer.
  const { data: profileRows, error: profilesError } = await supabase
    .from("profiles")
    .select("id, email, full_name, job_title")
    .in(
      "id",
      memberships.map((membership) => membership.user_id),
    );

  if (profilesError) throw new Error(profilesError.message);

  const profiles = new Map((profileRows ?? []).map((profile) => [profile.id, profile]));

  return memberships.map((membership) => toOrgMember(membership, profiles.get(membership.user_id)));
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Un membre de l'annuaire réel, par identifiant d'appartenance.
 *
 * Un identifiant qui n'a pas la forme d'un UUID ne peut désigner aucune ligne :
 * il vaut « introuvable » sans interroger la base, qui répondrait sinon par une
 * erreur de syntaxe (22P02) et ferait afficher « Impossible de charger ».
 */
export async function getOrgMember(scope: Scope, memberId: string): Promise<OrgMember | null> {
  if (!UUID_PATTERN.test(memberId)) return null;

  const { data: membership, error } = await supabase
    .from("memberships")
    .select("id, user_id, role, created_at")
    .eq("organization_id", scope.organizationId)
    .eq("id", memberId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!membership) return null;

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, email, full_name, job_title")
    .eq("id", membership.user_id)
    .maybeSingle();

  if (profileError) throw new Error(profileError.message);

  return toOrgMember(membership, profile);
}

/**
 * Administration des membres — seules fonctions de ce module branchées sur la base.
 *
 * Les policies `membership_update` / `membership_delete` et le trigger
 * `prevent_last_owner_removal` arbitrent seuls ce qui est permis. Leurs refus
 * arrivent ici sous forme de messages rédigés pour l'utilisateur final : ils
 * remontent tels quels, sans reformulation.
 */
export async function updateMemberRole(
  _scope: Scope,
  membershipId: string,
  role: MemberRole,
): Promise<void> {
  const { error } = await supabase.from("memberships").update({ role }).eq("id", membershipId);
  if (error) throw new Error(error.message);
}

export async function removeMember(_scope: Scope, membershipId: string): Promise<void> {
  const { error } = await supabase.from("memberships").delete().eq("id", membershipId);
  if (error) throw new Error(error.message);
}
