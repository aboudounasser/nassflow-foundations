import { CircleCheck, MailCheck, PauseCircle, type LucideIcon } from "lucide-react";

import type { MemberRole, MemberStatus, OrgMember } from "./types";
import type { FilterDescriptor } from "@/lib/toolbar/types";
import { initialsFrom } from "@/lib/tenancy/types";

type BadgeVariant = "neutral" | "primary" | "success" | "warning" | "destructive" | "info";

export const MEMBER_ROLE: Record<MemberRole, { label: string; variant: BadgeVariant }> = {
  owner: { label: "Propriétaire", variant: "primary" },
  admin: { label: "Administrateur", variant: "info" },
  manager: { label: "Manager", variant: "warning" },
  member: { label: "Membre", variant: "neutral" },
  viewer: { label: "Lecture seule", variant: "neutral" },
};

export const MEMBER_ROLE_ORDER: MemberRole[] = ["owner", "admin", "manager", "member", "viewer"];

/** Département affiché tant que la colonne correspondante n'existe pas en base. */
export const UNASSIGNED_DEPARTMENT = "Non renseigné";

/** Initiales de repli : l'annuaire réel ne stocke pas encore d'avatar. */
export function memberInitials(member: OrgMember): string {
  return member.avatar ?? initialsFrom(member.name, member.email);
}

/** Rôles qu'un admin ne peut ni modifier, ni attribuer — cf. policy membership_update. */
export const PRIVILEGED_ROLES: MemberRole[] = ["owner", "admin"];

/**
 * Reproduit `membership_update` / `membership_delete` côté interface : un owner
 * administre tout le monde, un admin tous ceux qui ne sont ni owner ni admin.
 * Sans `membershipId`, la ligne ne désigne aucune appartenance en base et
 * aucune action ne peut aboutir.
 */
export function canAdministerMember(currentRole: MemberRole, member: OrgMember): boolean {
  if (!member.membershipId) return false;
  if (currentRole === "owner") return true;
  if (currentRole !== "admin") return false;
  return !PRIVILEGED_ROLES.includes(member.role);
}

export const MEMBER_STATUS: Record<
  MemberStatus,
  { label: string; variant: BadgeVariant; icon: LucideIcon }
> = {
  active: { label: "Actif", variant: "success", icon: CircleCheck },
  invited: { label: "Invité", variant: "info", icon: MailCheck },
  suspended: { label: "Suspendu", variant: "warning", icon: PauseCircle },
};

export const MEMBER_STATUS_ORDER: MemberStatus[] = ["active", "invited", "suspended"];

const DATE_FMT = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "long",
  year: "numeric",
  timeZone: "Europe/Paris",
});

export function formatOrgDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return DATE_FMT.format(date);
}

/** Ancienneté lisible, calculée depuis la date d'arrivée. */
export function formatSeniority(iso: string, now: Date = new Date()): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  const months = Math.max(
    0,
    (now.getFullYear() - date.getFullYear()) * 12 + (now.getMonth() - date.getMonth()),
  );
  const years = Math.floor(months / 12);
  const rest = months % 12;
  if (months < 1) return "Moins d'un mois";
  if (years === 0) return `${rest} mois`;
  const y = `${years} an${years > 1 ? "s" : ""}`;
  return rest === 0 ? y : `${y} et ${rest} mois`;
}

export function memberFilterDescriptors(departments: string[]): FilterDescriptor[] {
  return [
    {
      kind: "select",
      key: "department",
      ariaLabel: "Filtrer par département",
      placeholder: "Département",
      allLabel: "Tous les départements",
      minWidth: "min-w-[180px]",
      options: departments.map((d) => ({ value: d, label: d })),
    },
    {
      kind: "select",
      key: "role",
      ariaLabel: "Filtrer par rôle",
      placeholder: "Rôle",
      allLabel: "Tous les rôles",
      minWidth: "min-w-[170px]",
      options: MEMBER_ROLE_ORDER.map((r) => ({ value: r, label: MEMBER_ROLE[r].label })),
    },
    {
      kind: "select",
      key: "status",
      ariaLabel: "Filtrer par statut",
      placeholder: "Statut",
      allLabel: "Tous les statuts",
      minWidth: "min-w-[170px]",
      options: MEMBER_STATUS_ORDER.map((s) => ({ value: s, label: MEMBER_STATUS[s].label })),
    },
    {
      kind: "sort",
      key: "sort",
      ariaLabel: "Trier les membres",
      minWidth: "min-w-[190px]",
      options: [
        { value: "name", label: "Nom" },
        { value: "joinedAt", label: "Date d'arrivée" },
        { value: "department", label: "Département" },
      ],
    },
  ];
}
