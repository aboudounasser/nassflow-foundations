import { agentsDetailMock } from "@/lib/agents/mocks";
import type { AgentDetail } from "@/lib/agents/types";
import { defaultOrganization } from "@/lib/tenancy/mocks";

import type { CompanyProfile, Department, OrgMember } from "./types";

export const companyProfileMock: CompanyProfile = {
  id: defaultOrganization.id,
  name: defaultOrganization.name,
  industry: "Logiciel B2B — AI Operating System",
  size: "11-50 employés",
  foundedYear: 2023,
  plan: "Enterprise",
  timezone: "Europe/Paris",
  primaryLocale: "fr-FR",
};

/** Les 7 départements reprennent à l'identique les `domain` des agents IA. */
export const departmentsMock: Department[] = [
  {
    id: "d-direction",
    name: "Direction",
    description:
      "Pilotage stratégique de NASSFLOW OS, arbitrages d'investissement et supervision du CEO Agent.",
    leadMemberId: "u-nassim",
  },
  {
    id: "d-commercial",
    name: "Commercial",
    description:
      "Acquisition, pipeline et closing — équipe hybride opérant avec le Sales Agent sur le CRM.",
    leadMemberId: "u-camille",
  },
  {
    id: "d-marketing",
    name: "Marketing",
    description: "Marque, contenu et campagnes multicanal, orchestrés avec le Marketing Agent.",
    leadMemberId: "u-lea",
  },
  {
    id: "d-finance",
    name: "Finance",
    description:
      "Trésorerie, marge et prévisions, avec rapprochement automatisé par le Finance Agent.",
    leadMemberId: "u-antoine",
  },
  {
    id: "d-rh",
    name: "RH",
    description: "Recrutement, onboarding et culture interne, assistés par le HR Agent.",
    leadMemberId: "u-sofia",
  },
  {
    id: "d-support",
    name: "Support",
    description:
      "Satisfaction client et résolution des tickets en première ligne avec le Support Agent.",
    leadMemberId: "u-karim",
  },
  {
    id: "d-operations",
    name: "Opérations",
    description:
      "Processus internes, workflows techniques et fiabilité de la plateforme avec l'Operations Agent.",
    leadMemberId: "u-marc",
  },
];

export const orgMembersMock: OrgMember[] = [
  {
    id: "u-nassim",
    name: "Nassim",
    email: "nassim@nassflow.com",
    jobTitle: "CEO & Fondateur",
    department: "Direction",
    role: "owner",
    status: "active",
    avatar: "NA",
    managerId: null,
    joinedAt: "2023-01-09T09:00:00+01:00",
  },
  {
    id: "u-marc",
    name: "Marc Delaunay",
    email: "marc.delaunay@nassflow.com",
    jobTitle: "Directeur des Opérations",
    department: "Opérations",
    role: "admin",
    status: "active",
    avatar: "MD",
    managerId: "u-nassim",
    joinedAt: "2023-03-06T09:00:00+01:00",
  },
  {
    id: "u-camille",
    name: "Camille Roussel",
    email: "camille.roussel@nassflow.com",
    jobTitle: "Directrice Commerciale",
    department: "Commercial",
    role: "manager",
    status: "active",
    avatar: "CR",
    managerId: "u-nassim",
    joinedAt: "2023-05-15T09:00:00+02:00",
  },
  {
    id: "u-lea",
    name: "Léa Bertrand",
    email: "lea.bertrand@nassflow.com",
    jobTitle: "Head of Marketing",
    department: "Marketing",
    role: "manager",
    status: "active",
    avatar: "LB",
    managerId: "u-nassim",
    joinedAt: "2023-09-04T09:00:00+02:00",
  },
  {
    id: "u-antoine",
    name: "Antoine Mercier",
    email: "antoine.mercier@nassflow.com",
    jobTitle: "Directeur Financier",
    department: "Finance",
    role: "admin",
    status: "active",
    avatar: "AM",
    managerId: "u-nassim",
    joinedAt: "2023-11-02T09:00:00+01:00",
  },
  {
    id: "u-sofia",
    name: "Sofia Nakamura",
    email: "sofia.nakamura@nassflow.com",
    jobTitle: "Responsable RH",
    department: "RH",
    role: "manager",
    status: "active",
    avatar: "SN",
    managerId: "u-nassim",
    joinedAt: "2024-01-15T09:00:00+01:00",
  },
  {
    id: "u-karim",
    name: "Karim Benali",
    email: "karim.benali@nassflow.com",
    jobTitle: "Responsable Support",
    department: "Support",
    role: "manager",
    status: "active",
    avatar: "KB",
    managerId: "u-marc",
    joinedAt: "2024-02-19T09:00:00+01:00",
  },
  {
    id: "u-julie",
    name: "Julie Fontaine",
    email: "julie.fontaine@nassflow.com",
    jobTitle: "Account Executive",
    department: "Commercial",
    role: "member",
    status: "active",
    avatar: "JF",
    managerId: "u-camille",
    joinedAt: "2024-04-08T09:00:00+02:00",
  },
  {
    id: "u-thomas",
    name: "Thomas Girard",
    email: "thomas.girard@nassflow.com",
    jobTitle: "Business Developer",
    department: "Commercial",
    role: "member",
    status: "invited",
    avatar: "TG",
    managerId: "u-camille",
    joinedAt: "2026-07-27T09:00:00+02:00",
  },
  {
    id: "u-ines",
    name: "Inès Lambert",
    email: "ines.lambert@nassflow.com",
    jobTitle: "Content Manager",
    department: "Marketing",
    role: "member",
    status: "active",
    avatar: "IL",
    managerId: "u-lea",
    joinedAt: "2024-09-02T09:00:00+02:00",
  },
  {
    id: "u-hugo",
    name: "Hugo Petit",
    email: "hugo.petit@nassflow.com",
    jobTitle: "Contrôleur de gestion",
    department: "Finance",
    role: "member",
    status: "active",
    avatar: "HP",
    managerId: "u-antoine",
    joinedAt: "2025-01-13T09:00:00+01:00",
  },
  {
    id: "u-amina",
    name: "Amina Cherif",
    email: "amina.cherif@nassflow.com",
    jobTitle: "Talent Acquisition",
    department: "RH",
    role: "member",
    status: "active",
    avatar: "AC",
    managerId: "u-sofia",
    joinedAt: "2025-03-10T09:00:00+01:00",
  },
  {
    id: "u-lucas",
    name: "Lucas Moreau",
    email: "lucas.moreau@nassflow.com",
    jobTitle: "Chargé de support N2",
    department: "Support",
    role: "member",
    status: "suspended",
    avatar: "LM",
    managerId: "u-karim",
    joinedAt: "2025-05-05T09:00:00+02:00",
  },
  {
    id: "u-elena",
    name: "Elena Rossi",
    email: "elena.rossi@nassflow.com",
    jobTitle: "Ops Analyst",
    department: "Opérations",
    role: "viewer",
    status: "active",
    avatar: "ER",
    managerId: "u-marc",
    joinedAt: "2025-10-06T09:00:00+02:00",
  },
];

/** Agents IA rattachés à un département (croisement sur `domain`). */
export function agentsInDepartment(departmentName: string): AgentDetail[] {
  return agentsDetailMock.filter((agent) => agent.domain === departmentName);
}

/** Membres humains d'un département. */
export function membersInDepartment(departmentName: string): OrgMember[] {
  return orgMembersMock.filter((member) => member.department === departmentName);
}

export function orgMemberById(id: string | null): OrgMember | null {
  if (!id) return null;
  return orgMembersMock.find((member) => member.id === id) ?? null;
}

/** Membres dont ce membre est le manager direct. */
export function directReports(memberId: string): OrgMember[] {
  return orgMembersMock.filter((member) => member.managerId === memberId);
}
