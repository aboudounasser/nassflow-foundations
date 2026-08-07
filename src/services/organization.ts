import type { AgentDetail } from "@/lib/agents/types";
import {
  agentsInDepartment,
  companyProfileMock,
  departmentsMock,
  directReports,
  orgMemberById,
  orgMembersMock,
} from "@/lib/organization/mocks";
import type { CompanyProfile, Department, OrgMember } from "@/lib/organization/types";
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

export async function getDepartments(_scope: Scope): Promise<Department[]> {
  return delay(departmentsMock);
}

export async function getOrgMembers(_scope: Scope): Promise<OrgMember[]> {
  return delay(orgMembersMock);
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
