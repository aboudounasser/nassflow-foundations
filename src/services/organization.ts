import type { AgentDetail } from "@/lib/agents/types";
import {
  agentsInDepartment,
  companyProfileMock,
  departmentsMock,
  directReports,
  membersInDepartment,
  orgMemberById,
} from "@/lib/organization/mocks";
import { UNASSIGNED_DEPARTMENT } from "@/lib/organization/meta";
import type {
  CompanyProfile,
  Department,
  MemberRole,
  OrganizationProfile,
  OrgMember,
} from "@/lib/organization/types";
import { supabase } from "@/lib/supabase/client";
import type { Scope } from "@/lib/tenancy/types";
import { delay } from "@/services/latency";

/** Agrégat de la vue détail : un seul aller-retour par identifiant (option B). */
export interface OrgMemberDetail {
  member: OrgMember;
  directReports: OrgMember[];
  departmentAgents: AgentDetail[];
}

export async function getCompanyProfile(_scope: Scope): Promise<CompanyProfile> {
  return delay(companyProfileMock);
}

/**
 * Profil réel de l'organisation active (table `organizations`).
 *
 * Seuls `name`/`industry`/`size` existent en base : `foundedYear`, `plan`,
 * `timezone` et `primaryLocale` n'ont pas de colonne et restent `null` — à
 * l'appelant d'afficher une mention neutre plutôt qu'une valeur inventée.
 */
export async function getOrganizationProfile(scope: Scope): Promise<OrganizationProfile> {
  const { data, error } = await supabase
    .from("organizations")
    .select("id, name, industry, size")
    .eq("id", scope.organizationId)
    .single();

  if (error) throw new Error(error.message);

  return {
    id: data.id,
    name: data.name,
    industry: data.industry,
    size: data.size,
    foundedYear: null,
    plan: null,
    timezone: null,
    primaryLocale: null,
  };
}

export async function getDepartments(_scope: Scope): Promise<Department[]> {
  return delay(departmentsMock);
}

/** Départements enrichis : lead, membres humains et agents IA du même domaine. */
export interface DepartmentSummary {
  department: Department;
  lead: OrgMember | null;
  members: OrgMember[];
  agents: AgentDetail[];
}

export async function getDepartmentSummaries(_scope: Scope): Promise<DepartmentSummary[]> {
  return delay(
    departmentsMock.map((department) => ({
      department,
      lead: orgMemberById(department.leadMemberId),
      members: membersInDepartment(department.name),
      agents: agentsInDepartment(department.name),
    })),
  );
}

/**
 * Annuaire réel — seule lecture du module branchée sur la base.
 *
 * Champs réels, lus dans `memberships` et `profiles` :
 *   membershipId, userId (memberships.id, memberships.user_id)
 *   role, joinedAt        (memberships.role, memberships.created_at)
 *   email, name, jobTitle (profiles.email, full_name, job_title)
 *
 * Champs en attente d'une colonne, valeur neutre explicite plutôt qu'inventée :
 *   department → "Non renseigné"   status → "active"
 *   avatar     → null              managerId → null
 *
 * Conséquence assumée le temps de la transition : l'onglet Départements, le
 * filtre par département et la fiche détaillée continuent de s'appuyer sur les
 * fixtures, via getDepartmentSummaries et getOrgMember restés inchangés.
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

  return memberships.map((membership) => {
    const profile = profiles.get(membership.user_id);
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
  });
}

export async function getOrgMember(
  _scope: Scope,
  memberId: string,
): Promise<OrgMemberDetail | null> {
  const member = orgMemberById(memberId);
  if (!member) return delay(null);
  return delay({
    member,
    directReports: directReports(member.id),
    departmentAgents: agentsInDepartment(member.department),
  });
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
