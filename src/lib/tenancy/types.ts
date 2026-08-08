import type { MemberRole } from "@/lib/organization/types";

/** Une organisation cliente de NASSFLOW OS. */
export interface Organization {
  id: string;
  name: string;
}

/**
 * Portée de toute lecture de données.
 * Objet volontairement encapsulé : le jour où le concept de Workspace
 * se concrétise, on ajoute un champ ici sans toucher aux appelants.
 */
export interface Scope {
  organizationId: string;
}

/** Session courante : qui, dans quelle organisation, avec quel rôle. */
export interface Session {
  userId: string;
  name: string;
  email: string;
  initials: string;
  jobTitle: string;
  organization: Organization;
  role: MemberRole;
}

/** Initiales dérivées du nom complet, avec repli sur l'e-mail. */
export function initialsFrom(name: string | null, email: string): string {
  const source = name?.trim() || email;
  const parts = source.split(/[\s@._-]+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}
