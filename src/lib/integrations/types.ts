/** Modèle du module Integrations Hub — catalogue d'intégrations (mocks statiques). */

export type IntegrationCategory =
  | "CRM"
  | "Communication"
  | "Productivité"
  | "Finance"
  | "RH"
  | "Support"
  | "Marketing"
  | "Documentation"
  | "Projet"
  | "Automatisation"
  | "E-commerce";

export type IntegrationStatus = "connected" | "disconnected" | "error" | "not_installed";

export interface IntegrationPermission {
  scope: string;
  granted: boolean;
}

export interface Integration {
  id: string;
  name: string;
  category: IntegrationCategory;
  description: string;
  status: IntegrationStatus;
  permissions: IntegrationPermission[];
  syncFrequency: string | null;
  lastSyncAt: string | null;
  connectedSince: string | null;
}

export type IntegrationSortKey = "name" | "status" | "lastSync";
export type IntegrationView = "grid" | "list";
