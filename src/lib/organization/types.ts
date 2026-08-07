/** Modèle du module Organization — annuaire humain + départements hybrides humains/IA. */

export type MemberRole = "owner" | "admin" | "manager" | "member" | "viewer";

export type MemberStatus = "active" | "invited" | "suspended";

export interface OrgMember {
  id: string;
  name: string;
  email: string;
  jobTitle: string;
  /** Une des 7 valeurs de `domain` déjà utilisées côté agents. */
  department: string;
  role: MemberRole;
  status: MemberStatus;
  avatar: string;
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
  name: string;
  industry: string;
  size: string;
  foundedYear: number;
  plan: string;
  timezone: string;
  primaryLocale: string;
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
