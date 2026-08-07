import type { AgentDetail } from "@/lib/agents/types";
import {
  contactById,
  contactsMock,
  crmAgentById,
  crmMissionById,
  dealsMock,
  dealsOfContact,
} from "@/lib/crm/mocks";
import type { Contact, Deal } from "@/lib/crm/types";
import type { MissionDetail } from "@/lib/missions/types";
import type { Scope } from "@/lib/tenancy/types";
import { delay } from "@/services/latency";

export interface ContactListItem {
  contact: Contact;
  deals: Deal[];
}

export async function getContacts(_scope: Scope): Promise<ContactListItem[]> {
  return delay(contactsMock.map((contact) => ({ contact, deals: dealsOfContact(contact.id) })));
}

/** Agrégat de la vue détail : un seul aller-retour par identifiant (option B). */
export interface ContactDetailData {
  contact: Contact;
  deals: Deal[];
  agent: AgentDetail | null;
  mission: MissionDetail | null;
}

export async function getContact(
  _scope: Scope,
  contactId: string,
): Promise<ContactDetailData | null> {
  const contact = contactById(contactId);
  if (!contact) return delay(null);
  return delay({
    contact,
    deals: dealsOfContact(contactId),
    agent: crmAgentById(contact.agentId ?? null),
    mission: crmMissionById(contact.relatedMissionId ?? null),
  });
}

export async function getDeals(_scope: Scope): Promise<Deal[]> {
  return delay(dealsMock);
}
