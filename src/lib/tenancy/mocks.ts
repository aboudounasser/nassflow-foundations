import { currentUserMock } from "@/lib/account/mocks";

import type { Organization, Session } from "./types";

/**
 * Source de vérité UNIQUE des organisations. companyProfileMock
 * réutilise ces valeurs — ne duplique jamais le nom ailleurs.
 */
export const organizationsMock: Organization[] = [
  { id: "org-nassflow", name: "NASSFLOW OS" },
  { id: "org-acme", name: "Acme Industries" },
];

export const defaultOrganization: Organization = organizationsMock[0]!;

export function sessionForOrganization(organization: Organization): Session {
  return {
    userId: currentUserMock.id,
    name: currentUserMock.name,
    email: currentUserMock.email,
    initials: currentUserMock.initials,
    jobTitle: currentUserMock.jobTitle,
    organization,
    role: "owner",
  };
}