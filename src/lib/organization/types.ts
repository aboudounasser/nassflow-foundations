/** Modèle du module Organization — annuaire humain + départements hybrides humains/IA. */

export type MemberRole = "owner" | "admin" | "manager" | "member" | "viewer";

export type MemberStatus = "active" | "invited" | "suspended";

export interface OrgMember {
  id: string;
  /**
   * Identifiant de la ligne `memberships` visée par les actions d'administration.
   * Absent tant que l'annuaire est alimenté par les fixtures : sans lui, aucune
   * action ne peut cibler la base, et le menu d'actions reste masqué.
   */
  membershipId?: string | undefined;
  /** Utilisateur Supabase derrière ce membre, pour reconnaître sa propre ligne. */
  userId?: string | undefined;
  name: string;
  email: string;
  jobTitle: string;
  /** Une des 7 valeurs de `domain` déjà utilisées côté agents. */
  department: string;
  role: MemberRole;
  status: MemberStatus;
  /** null pour les membres réels : aucune colonne d'avatar en base à ce stade. */
  avatar: string | null;
  managerId: string | null;
  joinedAt: string;
}

export interface Department {
  id: string;
  name: string;
  description: string;
  leadMemberId: string | null;
}

export interface CompanyProfile {
  id: string;
  name: string;
  industry: string;
  size: string;
  foundedYear: number;
  plan: string;
  timezone: string;
  primaryLocale: string;
}

/**
 * Profil réellement persisté (table `organizations`), par opposition à
 * `CompanyProfile` qui reste un agrégat mocké tant que le reste du module
 * Organization (départements, plan, etc.) n'est pas branché.
 *
 * Seuls `name`/`industry`/`size` ont une colonne en base. `foundedYear`,
 * `plan`, `timezone` et `primaryLocale` n'ont aucun équivalent : ils restent
 * `null` plutôt qu'une valeur inventée, en attendant ces colonnes.
 */
export interface OrganizationProfile {
  id: string;
  name: string;
  industry: string | null;
  size: string | null;
  foundedYear: number | null;
  plan: string | null;
  timezone: string | null;
  primaryLocale: string | null;
}

export type OrgTab = "directory" | "departments";
export type OrgView = "grid" | "list";
export type MemberSortKey = "name" | "joinedAt" | "department";

export interface MemberFilters {
  search: string;
  department: string | "all";
  role: MemberRole | "all";
  status: MemberStatus | "all";
  sort: MemberSortKey;
}
