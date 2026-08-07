import type { AgentDetail } from "@/lib/agents/types";
import {
  agentsInDepartment,
  companyProfileMock,
  departmentsMock,
  directReports,
  membersInDepartment,
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
