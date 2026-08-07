/** Modèle CRM de NASSFLOW OS — Contacts unifiés (prospects/clients) et Deals. */

export type ContactType = "prospect" | "client";

export type ContactStatus = "new" | "qualified" | "engaged" | "customer" | "churned" | "lost";

export interface CrmActivity {
  id: string;
  type: "email" | "call" | "meeting" | "note";
  summary: string;
  timestamp: string;
  /** « Sales Agent » ou nom d'un humain. */
  actor: string;
}

export interface Contact {
  id: string;
  type: ContactType;
  name: string;
  company: string;
  role: string;
  email: string;
  phone: string;
  status: ContactStatus;
  agentId: string | null;
  relatedMissionId: string | null;
  tags: string[];
  /** Valeur potentielle ou réelle, en euros. */
  value: number | null;
  lastContactAt: string;
  activities: CrmActivity[];
  createdAt: string;
}

export type DealStage = "qualification" | "proposal" | "negotiation" | "won" | "lost";

export interface Deal {
  id: string;
  title: string;
  contactId: string;
  stage: DealStage;
  value: number;
  /** 0-100. */
  probability: number;
  expectedCloseDate: string;
  agentId: string | null;
  relatedMissionId: string | null;
  createdAt: string;
  updatedAt: string;
}

export type CrmTab = "contacts" | "pipeline";
export type CrmView = "grid" | "list";
export type ContactSortKey = "lastContact" | "value" | "name";

export interface ContactFilters {
  search: string;
  type: ContactType | "all";
  status: ContactStatus | "all";
  sort: ContactSortKey;
}
