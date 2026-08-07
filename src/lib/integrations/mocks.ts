import { agentsDetailMock } from "@/lib/agents/mocks";
import type { AgentDetail, AgentTool } from "@/lib/agents/types";

import type { Integration } from "./types";

/**
 * Catalogue Integrations Hub.
 * Les 19 premières intégrations reprennent exactement les `tools` des 7 agents
 * (src/lib/agents/mocks.ts) — noms identiques, statuts globaux cohérents :
 * LinkedIn / DocuSign déconnectées, Meta Ads / Zapier en erreur.
 */
export const integrationsMock: Integration[] = [
  {
    id: "int-notion",
    name: "Notion",
    category: "Documentation",
    description:
      "Base documentaire de l'entreprise : notes de direction, comptes rendus et pages de référence.",
    status: "connected",
    permissions: [
      { scope: "Lecture des pages et bases", granted: true },
      { scope: "Création et édition de pages", granted: true },
      { scope: "Suppression de contenus", granted: false },
    ],
    syncFrequency: "Toutes les 15 min",
    lastSyncAt: "2026-08-06T07:45:00+02:00",
    connectedSince: "2025-11-04T10:00:00+02:00",
  },
  {
    id: "int-slack",
    name: "Slack",
    category: "Communication",
    description:
      "Canal de communication interne utilisé par les agents pour les alertes et les demandes de validation.",
    status: "connected",
    permissions: [
      { scope: "Lecture des canaux publics", granted: true },
      { scope: "Envoi de messages", granted: true },
      { scope: "Lecture des messages privés", granted: false },
    ],
    syncFrequency: "Temps réel",
    lastSyncAt: "2026-08-06T07:58:00+02:00",
    connectedSince: "2025-10-12T09:30:00+02:00",
  },
  {
    id: "int-google-agenda",
    name: "Google Agenda",
    category: "Productivité",
    description:
      "Agenda de direction : disponibilités, planification des comités et rappels automatiques.",
    status: "connected",
    permissions: [
      { scope: "Lecture des événements", granted: true },
      { scope: "Création d'événements", granted: true },
      { scope: "Invitation de participants externes", granted: true },
    ],
    syncFrequency: "Toutes les 5 min",
    lastSyncAt: "2026-08-06T07:55:00+02:00",
    connectedSince: "2025-10-12T09:30:00+02:00",
  },
  {
    id: "int-hubspot",
    name: "HubSpot",
    category: "CRM",
    description:
      "Référentiel commercial : contacts, deals et étapes de pipeline exploités par le Sales Agent.",
    status: "connected",
    permissions: [
      { scope: "Lecture des contacts", granted: true },
      { scope: "Mise à jour des deals", granted: true },
      { scope: "Suppression d'enregistrements", granted: false },
    ],
    syncFrequency: "Toutes les 10 min",
    lastSyncAt: "2026-08-06T07:50:00+02:00",
    connectedSince: "2025-09-18T14:00:00+02:00",
  },
  {
    id: "int-gmail",
    name: "Gmail",
    category: "Communication",
    description:
      "Boîte mail professionnelle : suivi des échanges clients et envoi de séquences par les agents.",
    status: "connected",
    permissions: [
      { scope: "Lecture des emails", granted: true },
      { scope: "Envoi d'emails", granted: true },
      { scope: "Suppression d'emails", granted: false },
    ],
    syncFrequency: "Temps réel",
    lastSyncAt: "2026-08-06T07:59:00+02:00",
    connectedSince: "2025-09-18T14:00:00+02:00",
  },
  {
    id: "int-linkedin",
    name: "LinkedIn",
    category: "CRM",
    description:
      "Prospection sociale : enrichissement des comptes cibles et suivi des signaux d'intention.",
    status: "disconnected",
    permissions: [
      { scope: "Lecture des profils publics", granted: false },
      { scope: "Envoi de messages InMail", granted: false },
    ],
    syncFrequency: null,
    lastSyncAt: "2026-06-22T11:20:00+02:00",
    connectedSince: null,
  },
  {
    id: "int-mailchimp",
    name: "Mailchimp",
    category: "Marketing",
    description:
      "Campagnes email marketing : audiences, envois programmés et statistiques d'ouverture.",
    status: "connected",
    permissions: [
      { scope: "Lecture des audiences", granted: true },
      { scope: "Création de campagnes", granted: true },
      { scope: "Envoi de campagnes", granted: true },
      { scope: "Export des contacts", granted: false },
    ],
    syncFrequency: "Toutes les 30 min",
    lastSyncAt: "2026-08-06T07:30:00+02:00",
    connectedSince: "2025-11-25T16:40:00+02:00",
  },
  {
    id: "int-meta-ads",
    name: "Meta Ads",
    category: "Marketing",
    description:
      "Régie publicitaire Facebook / Instagram : budgets, audiences et performance des campagnes.",
    status: "error",
    permissions: [
      { scope: "Lecture des campagnes", granted: true },
      { scope: "Modification des budgets", granted: false },
      { scope: "Création de campagnes", granted: false },
    ],
    syncFrequency: "Toutes les heures",
    lastSyncAt: "2026-08-05T18:10:00+02:00",
    connectedSince: "2025-12-02T09:15:00+02:00",
  },
  {
    id: "int-canva",
    name: "Canva",
    category: "Marketing",
    description: "Production de visuels marketing à partir des gabarits de marque validés.",
    status: "connected",
    permissions: [
      { scope: "Lecture des gabarits", granted: true },
      { scope: "Création de visuels", granted: true },
    ],
    syncFrequency: "Toutes les 6 h",
    lastSyncAt: "2026-08-06T06:00:00+02:00",
    connectedSince: "2026-01-14T10:05:00+02:00",
  },
  {
    id: "int-stripe",
    name: "Stripe",
    category: "Finance",
    description: "Encaissements et abonnements : revenus, impayés et rapprochement automatique.",
    status: "connected",
    permissions: [
      { scope: "Lecture des paiements", granted: true },
      { scope: "Lecture des abonnements", granted: true },
      { scope: "Émission de remboursements", granted: false },
    ],
    syncFrequency: "Temps réel",
    lastSyncAt: "2026-08-06T07:57:00+02:00",
    connectedSince: "2025-08-30T08:20:00+02:00",
  },
  {
    id: "int-qonto",
    name: "Qonto",
    category: "Finance",
    description: "Compte bancaire professionnel : soldes, transactions et justificatifs.",
    status: "connected",
    permissions: [
      { scope: "Lecture des soldes", granted: true },
      { scope: "Lecture des transactions", granted: true },
      { scope: "Initiation de virements", granted: false },
    ],
    syncFrequency: "Toutes les 30 min",
    lastSyncAt: "2026-08-06T07:35:00+02:00",
    connectedSince: "2025-08-30T08:20:00+02:00",
  },
  {
    id: "int-google-sheets",
    name: "Google Sheets",
    category: "Productivité",
    description: "Feuilles de calcul financières : budgets, prévisions et exports de reporting.",
    status: "connected",
    permissions: [
      { scope: "Lecture des feuilles", granted: true },
      { scope: "Écriture dans les feuilles", granted: true },
      { scope: "Partage externe des documents", granted: false },
    ],
    syncFrequency: "Toutes les 15 min",
    lastSyncAt: "2026-08-06T07:45:00+02:00",
    connectedSince: "2025-09-05T11:10:00+02:00",
  },
  {
    id: "int-personio",
    name: "Personio",
    category: "RH",
    description: "SIRH : dossiers collaborateurs, absences et suivi des recrutements.",
    status: "connected",
    permissions: [
      { scope: "Lecture des dossiers collaborateurs", granted: true },
      { scope: "Mise à jour des candidatures", granted: true },
      { scope: "Accès aux données de rémunération", granted: false },
    ],
    syncFrequency: "Toutes les heures",
    lastSyncAt: "2026-08-06T07:00:00+02:00",
    connectedSince: "2025-10-01T09:00:00+02:00",
  },
  {
    id: "int-docusign",
    name: "DocuSign",
    category: "RH",
    description: "Signature électronique des contrats de travail et avenants.",
    status: "disconnected",
    permissions: [
      { scope: "Lecture des enveloppes", granted: false },
      { scope: "Envoi de documents à signer", granted: false },
      { scope: "Validation finale des signatures", granted: false },
    ],
    syncFrequency: null,
    lastSyncAt: "2026-05-14T15:45:00+02:00",
    connectedSince: null,
  },
  {
    id: "int-zendesk",
    name: "Zendesk",
    category: "Support",
    description: "Gestion des tickets clients : priorisation, réponses et escalades.",
    status: "connected",
    permissions: [
      { scope: "Lecture des tickets", granted: true },
      { scope: "Réponse aux tickets", granted: true },
      { scope: "Fermeture des tickets", granted: true },
    ],
    syncFrequency: "Temps réel",
    lastSyncAt: "2026-08-06T07:56:00+02:00",
    connectedSince: "2025-09-22T13:30:00+02:00",
  },
  {
    id: "int-intercom",
    name: "Intercom",
    category: "Support",
    description: "Messagerie client en direct : conversations entrantes et réponses assistées.",
    status: "connected",
    permissions: [
      { scope: "Lecture des conversations", granted: true },
      { scope: "Envoi de réponses", granted: true },
      { scope: "Modification des profils clients", granted: false },
    ],
    syncFrequency: "Temps réel",
    lastSyncAt: "2026-08-06T07:59:00+02:00",
    connectedSince: "2025-09-22T13:30:00+02:00",
  },
  {
    id: "int-jira",
    name: "Jira",
    category: "Projet",
    description: "Suivi opérationnel : tickets, sprints et incidents de production.",
    status: "connected",
    permissions: [
      { scope: "Lecture des tickets", granted: true },
      { scope: "Création et mise à jour de tickets", granted: true },
      { scope: "Administration des projets", granted: false },
    ],
    syncFrequency: "Toutes les 10 min",
    lastSyncAt: "2026-08-06T07:50:00+02:00",
    connectedSince: "2025-08-18T08:45:00+02:00",
  },
  {
    id: "int-google-drive",
    name: "Google Drive",
    category: "Documentation",
    description: "Stockage documentaire partagé : procédures, modèles et archives.",
    status: "connected",
    permissions: [
      { scope: "Lecture des fichiers", granted: true },
      { scope: "Création et édition de fichiers", granted: true },
      { scope: "Suppression définitive", granted: false },
    ],
    syncFrequency: "Toutes les 15 min",
    lastSyncAt: "2026-08-06T07:45:00+02:00",
    connectedSince: "2025-08-18T08:45:00+02:00",
  },
  {
    id: "int-zapier",
    name: "Zapier",
    category: "Automatisation",
    description: "Passerelle d'automatisation vers les outils tiers non connectés nativement.",
    status: "error",
    permissions: [
      { scope: "Lecture des zaps", granted: true },
      { scope: "Déclenchement de zaps", granted: false },
      { scope: "Création de zaps", granted: false },
    ],
    syncFrequency: "Temps réel",
    lastSyncAt: "2026-08-05T21:40:00+02:00",
    connectedSince: "2025-12-11T17:25:00+02:00",
  },

  // ── Catalogue disponible, pas encore connecté ───────────────────────────────
  {
    id: "int-salesforce",
    name: "Salesforce",
    category: "CRM",
    description: "CRM d'entreprise : comptes, opportunités et prévisions commerciales avancées.",
    status: "not_installed",
    permissions: [
      { scope: "Lecture des comptes et opportunités", granted: false },
      { scope: "Mise à jour des opportunités", granted: false },
      { scope: "Accès aux rapports", granted: false },
    ],
    syncFrequency: null,
    lastSyncAt: null,
    connectedSince: null,
  },
  {
    id: "int-shopify",
    name: "Shopify",
    category: "E-commerce",
    description: "Boutique en ligne : catalogue produits, commandes et suivi des expéditions.",
    status: "not_installed",
    permissions: [
      { scope: "Lecture des commandes", granted: false },
      { scope: "Lecture du catalogue produits", granted: false },
      { scope: "Mise à jour des stocks", granted: false },
    ],
    syncFrequency: null,
    lastSyncAt: null,
    connectedSince: null,
  },
  {
    id: "int-whatsapp-business",
    name: "WhatsApp Business",
    category: "Communication",
    description:
      "Messagerie client mobile : notifications transactionnelles et support conversationnel.",
    status: "not_installed",
    permissions: [
      { scope: "Lecture des conversations", granted: false },
      { scope: "Envoi de messages modèles", granted: false },
    ],
    syncFrequency: null,
    lastSyncAt: null,
    connectedSince: null,
  },
  {
    id: "int-google-calendar",
    name: "Google Calendar",
    category: "Productivité",
    description: "Agendas d'équipe complémentaires : salles, ressources et calendriers partagés.",
    status: "not_installed",
    permissions: [
      { scope: "Lecture des calendriers d'équipe", granted: false },
      { scope: "Réservation de ressources", granted: false },
    ],
    syncFrequency: null,
    lastSyncAt: null,
    connectedSince: null,
  },
  {
    id: "int-microsoft-teams",
    name: "Microsoft Teams",
    category: "Communication",
    description: "Collaboration Microsoft 365 : canaux d'équipe, réunions et notifications.",
    status: "not_installed",
    permissions: [
      { scope: "Lecture des canaux", granted: false },
      { scope: "Envoi de messages", granted: false },
      { scope: "Planification de réunions", granted: false },
    ],
    syncFrequency: null,
    lastSyncAt: null,
    connectedSince: null,
  },
];

export function integrationById(id: string): Integration | undefined {
  return integrationsMock.find((integration) => integration.id === id);
}

export interface IntegrationAgentUsage {
  agent: AgentDetail;
  tool: AgentTool;
}

/** Croisement réel : agents dont un outil porte exactement ce nom d'intégration. */
export function agentsUsingIntegration(integrationName: string): IntegrationAgentUsage[] {
  const usages: IntegrationAgentUsage[] = [];
  for (const agent of agentsDetailMock) {
    const tool = agent.tools.find((t) => t.name === integrationName);
    if (tool) usages.push({ agent, tool });
  }
  return usages;
}
