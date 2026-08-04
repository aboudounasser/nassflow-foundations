import { missionsDetailMock } from "@/lib/missions/mocks";

import type { AgentConfig, AgentDetail, AgentLogEntry, AgentMemoryEntry } from "./types";

type AgentBase = Omit<AgentDetail, "memory" | "logs" | "config">;

/** MOCKS STATIQUES — ids alignés sur missionAgents (src/lib/missions/mocks.ts). */
const agentsBase: AgentBase[] = [
  {
    id: "a-ceo",
    name: "CEO Agent",
    avatar: "CE",
    role: "Pilotage stratégique",
    domain: "Direction",
    version: "v2.4.1",
    status: "active",
    description:
      "Orchestre l'ensemble de la workforce IA : arbitre les priorités, consolide les signaux de chaque domaine et prépare les décisions qui remontent au comité de direction.",
    capabilities: [
      {
        id: "c-ceo-1",
        label: "Arbitrage des priorités",
        description:
          "Compare l'impact business des missions en attente et propose un ordre d'exécution argumenté.",
      },
      {
        id: "c-ceo-2",
        label: "Synthèse exécutive",
        description: "Produit un briefing quotidien consolidé à partir des 6 autres agents.",
      },
      {
        id: "c-ceo-3",
        label: "Détection de risques",
        description: "Identifie les dérives budgétaires, retards et blocages inter-domaines.",
      },
      {
        id: "c-ceo-4",
        label: "Délégation inter-agents",
        description: "Crée et assigne des missions aux agents métier avec objectifs mesurables.",
      },
    ],
    tools: [
      {
        id: "t-ceo-1",
        name: "Notion",
        category: "Documentation",
        accessLevel: "write",
        status: "connected",
      },
      {
        id: "t-ceo-2",
        name: "Slack",
        category: "Communication",
        accessLevel: "write",
        status: "connected",
      },
      {
        id: "t-ceo-3",
        name: "Google Agenda",
        category: "Productivité",
        accessLevel: "execute",
        status: "connected",
      },
    ],
    permissions: [
      { resource: "Missions", read: true, write: true, execute: true, approve: true },
      { resource: "Documents", read: true, write: true, execute: false, approve: true },
      { resource: "Finance", read: true, write: false, execute: false, approve: true },
      { resource: "CRM", read: true, write: false, execute: false, approve: false },
    ],
    kpis: [
      { label: "Décisions préparées", value: "142", trend: "up" },
      { label: "Missions orchestrées", value: "38", trend: "up" },
      { label: "Délai d'arbitrage", value: "1,4 h", trend: "down" },
    ],
    confidenceScore: 94,
    uptime: "99,8 %",
    lastActivity: "2026-08-04T07:20:00.000Z",
    collaboratesWith: ["a-sales", "a-marketing", "a-finance", "a-hr", "a-support", "a-ops"],
  },
  {
    id: "a-sales",
    name: "Sales Agent",
    avatar: "SA",
    role: "Développement commercial",
    domain: "Commercial",
    version: "v3.1.0",
    status: "active",
    description:
      "Prend en charge le cycle de vente de bout en bout : qualification des leads entrants, séquences de relance personnalisées et mise à jour continue du pipeline CRM.",
    capabilities: [
      {
        id: "c-sales-1",
        label: "Qualification des leads",
        description: "Score chaque lead selon le profil ICP et l'intention détectée.",
      },
      {
        id: "c-sales-2",
        label: "Séquences de relance",
        description: "Rédige et déclenche des relances multicanal adaptées au stade du deal.",
      },
      {
        id: "c-sales-3",
        label: "Préparation de propositions",
        description: "Génère un devis structuré à partir du besoin exprimé et du catalogue.",
      },
      {
        id: "c-sales-4",
        label: "Hygiène du pipeline",
        description: "Détecte les deals dormants et propose une action corrective.",
      },
    ],
    tools: [
      {
        id: "t-sales-1",
        name: "HubSpot",
        category: "CRM",
        accessLevel: "write",
        status: "connected",
      },
      {
        id: "t-sales-2",
        name: "Gmail",
        category: "Communication",
        accessLevel: "execute",
        status: "connected",
      },
      {
        id: "t-sales-3",
        name: "LinkedIn",
        category: "Prospection",
        accessLevel: "read",
        status: "disconnected",
      },
    ],
    permissions: [
      { resource: "CRM", read: true, write: true, execute: true, approve: false },
      { resource: "Emails", read: true, write: true, execute: true, approve: false },
      { resource: "Facturation", read: true, write: false, execute: false, approve: false },
      { resource: "Documents", read: true, write: true, execute: false, approve: false },
    ],
    kpis: [
      { label: "Leads qualifiés", value: "312", trend: "up" },
      { label: "Taux de réponse", value: "38 %", trend: "up" },
      { label: "Pipeline généré", value: "1,2 M€", trend: "up" },
    ],
    confidenceScore: 91,
    uptime: "99,4 %",
    lastActivity: "2026-08-04T08:05:00.000Z",
    collaboratesWith: ["a-ceo", "a-marketing", "a-finance"],
  },
  {
    id: "a-marketing",
    name: "Marketing Agent",
    avatar: "MA",
    role: "Acquisition",
    domain: "Marketing",
    version: "v2.9.3",
    status: "active",
    description:
      "Conçoit et pilote les campagnes d'acquisition : production de contenu, ciblage publicitaire, arbitrage budgétaire et mesure de la performance par canal.",
    capabilities: [
      {
        id: "c-mkt-1",
        label: "Production de contenu",
        description: "Rédige posts, newsletters et pages d'atterrissage alignés sur la marque.",
      },
      {
        id: "c-mkt-2",
        label: "Pilotage des campagnes",
        description: "Ajuste ciblage et budget quotidien selon le coût par lead observé.",
      },
      {
        id: "c-mkt-3",
        label: "Analyse d'audience",
        description: "Segmente la base et détecte les segments à plus fort potentiel.",
      },
    ],
    tools: [
      {
        id: "t-mkt-1",
        name: "Mailchimp",
        category: "Emailing",
        accessLevel: "execute",
        status: "connected",
      },
      {
        id: "t-mkt-2",
        name: "Meta Ads",
        category: "Publicité",
        accessLevel: "write",
        status: "error",
      },
      {
        id: "t-mkt-3",
        name: "Canva",
        category: "Création",
        accessLevel: "write",
        status: "connected",
      },
    ],
    permissions: [
      { resource: "Campagnes", read: true, write: true, execute: true, approve: false },
      { resource: "CRM", read: true, write: false, execute: false, approve: false },
      { resource: "Documents", read: true, write: true, execute: false, approve: false },
      { resource: "Budget marketing", read: true, write: true, execute: false, approve: false },
    ],
    kpis: [
      { label: "Coût par lead", value: "18 €", trend: "down" },
      { label: "Contenus publiés", value: "86", trend: "up" },
      { label: "Trafic généré", value: "42 k", trend: "up" },
    ],
    confidenceScore: 88,
    uptime: "98,9 %",
    lastActivity: "2026-08-04T06:45:00.000Z",
    collaboratesWith: ["a-ceo", "a-sales"],
  },
  {
    id: "a-finance",
    name: "Finance Agent",
    avatar: "FI",
    role: "Analyse financière",
    domain: "Finance",
    version: "v3.0.2",
    status: "active",
    description:
      "Sécurise la trésorerie et la rentabilité : rapprochement des flux, suivi des impayés, prévisions de cash et contrôle des coûts d'exécution IA.",
    capabilities: [
      {
        id: "c-fin-1",
        label: "Rapprochement bancaire",
        description: "Réconcilie les encaissements Stripe avec les écritures bancaires.",
      },
      {
        id: "c-fin-2",
        label: "Prévision de trésorerie",
        description: "Projette le cash à 90 jours selon le pipeline et les échéances connues.",
      },
      {
        id: "c-fin-3",
        label: "Recouvrement",
        description: "Séquence les relances d'impayés en respectant les seuils autorisés.",
      },
      {
        id: "c-fin-4",
        label: "Contrôle des coûts IA",
        description: "Suit la consommation par mission et alerte au-delà du budget.",
      },
    ],
    tools: [
      {
        id: "t-fin-1",
        name: "Stripe",
        category: "Paiement",
        accessLevel: "read",
        status: "connected",
      },
      { id: "t-fin-2", name: "Qonto", category: "Banque", accessLevel: "read", status: "connected" },
      {
        id: "t-fin-3",
        name: "Google Sheets",
        category: "Finance",
        accessLevel: "write",
        status: "connected",
      },
    ],
    permissions: [
      { resource: "Facturation", read: true, write: true, execute: true, approve: true },
      { resource: "Comptabilité", read: true, write: true, execute: false, approve: false },
      { resource: "CRM", read: true, write: false, execute: false, approve: false },
      { resource: "Documents", read: true, write: true, execute: false, approve: false },
    ],
    kpis: [
      { label: "Marge suivie", value: "68 %", trend: "up" },
      { label: "Impayés relancés", value: "27", trend: "down" },
      { label: "Écart prévisionnel", value: "2,1 %", trend: "flat" },
    ],
    confidenceScore: 96,
    uptime: "99,9 %",
    lastActivity: "2026-08-04T07:55:00.000Z",
    collaboratesWith: ["a-ceo", "a-sales", "a-ops"],
  },
  {
    id: "a-hr",
    name: "HR Agent",
    avatar: "HR",
    role: "Ressources humaines",
    domain: "RH",
    version: "v1.8.0",
    status: "maintenance",
    description:
      "Fluidifie le cycle de vie collaborateur : tri des candidatures, coordination des entretiens, onboarding documentaire et suivi des demandes internes.",
    capabilities: [
      {
        id: "c-hr-1",
        label: "Tri des candidatures",
        description: "Classe les CV reçus selon la grille de compétences du poste.",
      },
      {
        id: "c-hr-2",
        label: "Coordination d'entretiens",
        description: "Propose des créneaux et envoie les convocations aux parties prenantes.",
      },
      {
        id: "c-hr-3",
        label: "Onboarding",
        description: "Génère et fait signer le pack d'arrivée du nouveau collaborateur.",
      },
    ],
    tools: [
      { id: "t-hr-1", name: "Personio", category: "RH", accessLevel: "write", status: "connected" },
      {
        id: "t-hr-2",
        name: "Gmail",
        category: "Communication",
        accessLevel: "execute",
        status: "connected",
      },
      {
        id: "t-hr-3",
        name: "DocuSign",
        category: "Signature",
        accessLevel: "approve",
        status: "disconnected",
      },
    ],
    permissions: [
      { resource: "Dossiers RH", read: true, write: true, execute: false, approve: false },
      { resource: "Emails", read: true, write: true, execute: true, approve: false },
      { resource: "Documents", read: true, write: true, execute: false, approve: true },
      { resource: "Facturation", read: false, write: false, execute: false, approve: false },
    ],
    kpis: [
      { label: "Candidatures traitées", value: "418", trend: "up" },
      { label: "Délai de recrutement", value: "24 j", trend: "down" },
      { label: "Onboardings", value: "12", trend: "flat" },
    ],
    confidenceScore: 82,
    uptime: "97,2 %",
    lastActivity: "2026-08-03T16:10:00.000Z",
    collaboratesWith: ["a-ceo", "a-ops"],
  },
  {
    id: "a-support",
    name: "Support Agent",
    avatar: "SU",
    role: "Relation client",
    domain: "Support",
    version: "v4.0.1",
    status: "active",
    description:
      "Absorbe le premier niveau de support : réponse aux demandes récurrentes, escalade qualifiée des cas complexes et surveillance de la satisfaction client.",
    capabilities: [
      {
        id: "c-sup-1",
        label: "Réponse niveau 1",
        description: "Traite les tickets récurrents à partir de la base de connaissances.",
      },
      {
        id: "c-sup-2",
        label: "Escalade qualifiée",
        description: "Résume le contexte et route le ticket vers la bonne équipe.",
      },
      {
        id: "c-sup-3",
        label: "Veille satisfaction",
        description: "Détecte les signaux d'insatisfaction et alerte le Sales Agent.",
      },
      {
        id: "c-sup-4",
        label: "Enrichissement FAQ",
        description: "Propose de nouveaux articles à partir des tickets répétitifs.",
      },
    ],
    tools: [
      {
        id: "t-sup-1",
        name: "Zendesk",
        category: "Support",
        accessLevel: "write",
        status: "connected",
      },
      {
        id: "t-sup-2",
        name: "Intercom",
        category: "Support",
        accessLevel: "execute",
        status: "connected",
      },
      {
        id: "t-sup-3",
        name: "Slack",
        category: "Communication",
        accessLevel: "write",
        status: "connected",
      },
    ],
    permissions: [
      { resource: "Tickets", read: true, write: true, execute: true, approve: false },
      { resource: "CRM", read: true, write: true, execute: false, approve: false },
      { resource: "Documents", read: true, write: false, execute: false, approve: false },
      { resource: "Facturation", read: true, write: false, execute: false, approve: false },
    ],
    kpis: [
      { label: "Tickets résolus", value: "1 284", trend: "up" },
      { label: "Temps de réponse", value: "3 min", trend: "down" },
      { label: "CSAT", value: "4,6/5", trend: "up" },
    ],
    confidenceScore: 93,
    uptime: "99,6 %",
    lastActivity: "2026-08-04T08:25:00.000Z",
    collaboratesWith: ["a-ceo", "a-sales", "a-ops"],
  },
  {
    id: "a-ops",
    name: "Operations Agent",
    avatar: "OP",
    role: "Opérations",
    domain: "Opérations",
    version: "v2.6.4",
    status: "paused",
    description:
      "Garantit l'exécution opérationnelle : suivi des livrables, automatisation des tâches répétitives et surveillance de la santé des intégrations.",
    capabilities: [
      {
        id: "c-ops-1",
        label: "Suivi des livrables",
        description: "Contrôle l'avancement des tâches Jira et signale les retards.",
      },
      {
        id: "c-ops-2",
        label: "Automatisation",
        description: "Déclenche les scénarios Zapier liés aux processus internes.",
      },
      {
        id: "c-ops-3",
        label: "Supervision des intégrations",
        description: "Vérifie la santé des connecteurs et remonte les incidents.",
      },
    ],
    tools: [
      { id: "t-ops-1", name: "Jira", category: "Projet", accessLevel: "write", status: "connected" },
      {
        id: "t-ops-2",
        name: "Google Drive",
        category: "Documentation",
        accessLevel: "write",
        status: "connected",
      },
      {
        id: "t-ops-3",
        name: "Zapier",
        category: "Automatisation",
        accessLevel: "execute",
        status: "error",
      },
    ],
    permissions: [
      { resource: "Projets", read: true, write: true, execute: true, approve: false },
      { resource: "Documents", read: true, write: true, execute: false, approve: false },
      { resource: "Intégrations", read: true, write: false, execute: true, approve: false },
      { resource: "Facturation", read: false, write: false, execute: false, approve: false },
    ],
    kpis: [
      { label: "Tâches automatisées", value: "2 140", trend: "up" },
      { label: "Incidents ouverts", value: "3", trend: "down" },
      { label: "Temps économisé", value: "312 h", trend: "up" },
    ],
    confidenceScore: 87,
    uptime: "98,1 %",
    lastActivity: "2026-08-03T21:40:00.000Z",
    collaboratesWith: ["a-ceo", "a-finance", "a-hr", "a-support"],
  },
];
