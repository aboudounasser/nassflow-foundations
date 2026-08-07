import { agentsDetailMock } from "@/lib/agents/mocks";
import type { AgentDetail } from "@/lib/agents/types";

import type { KnowledgeItem } from "./types";

/** Base documentaire mockée de l'Enterprise Brain (aucune persistance). */
export const knowledgeMock: KnowledgeItem[] = [
  {
    id: "kb-objectifs-2026",
    type: "document",
    title: "Objectifs annuels 2026",
    summary:
      "Cadre d'objectifs de l'exercice 2026 : croissance ARR, marge brute et satisfaction client.",
    content: `Les objectifs annuels 2026 servent de référence à tous les arbitrages de direction.

1. Croissance ARR : +40 % sur l'exercice, portée par l'acquisition mid-market et l'expansion des comptes existants.
2. Marge brute : maintien d'un plancher à 68 %. Toute initiative dégradant ce plancher doit être arbitrée en comité.
3. NPS : atteindre et tenir un score ≥ 55, mesuré trimestriellement sur l'ensemble de la base client.

Ces trois indicateurs sont prioritaires sur toute autre métrique en cas de conflit. Ils sont revus une fois par semestre par le comité de direction.`,
    category: "Direction",
    tags: ["objectifs", "ARR", "marge", "NPS", "2026"],
    owner: "Nassim B. — Direction générale",
    status: "published",
    version: "v2.1",
    createdAt: "2026-01-08T08:00:00.000Z",
    updatedAt: "2026-07-02T09:30:00.000Z",
  },
  {
    id: "kb-grille-tarifaire",
    type: "document",
    title: "Grille tarifaire officielle",
    summary:
      "Tarifs de référence et règles de remise applicables par l'équipe commerciale et l'agent Sales.",
    content: `La grille tarifaire officielle définit les prix catalogue et les marges de négociation autorisées.

Règles de remise :
- Jusqu'à 12 % : remise accordée directement par le commercial ou l'agent Sales, sans validation.
- De 12 % à 20 % : validation explicite de la Finance requise avant envoi de la proposition.
- Au-delà de 20 % : refus par défaut, arbitrage Direction uniquement sur un motif stratégique documenté.

Toute proposition commerciale doit référencer la version de la grille utilisée. Les engagements pluriannuels ouvrent droit à un palier de remise supplémentaire de 3 %, cumulable dans la limite du plafond de 20 %.`,
    category: "Commercial",
    tags: ["tarifs", "remise", "pricing", "validation"],
    owner: "Léa M. — Direction commerciale",
    status: "published",
    version: "v4.0",
    createdAt: "2026-02-01T08:00:00.000Z",
    updatedAt: "2026-06-18T14:00:00.000Z",
  },
  {
    id: "kb-politique-depenses",
    type: "procedure",
    title: "Politique de dépenses",
    summary:
      "Seuils d'engagement et circuit de validation des dépenses de l'entreprise, humains comme agents.",
    content: `Cette politique encadre tout engagement de dépense, qu'il soit initié par un collaborateur humain ou par un agent IA.

Seuils :
- Moins de 1 000 € : engagement direct par le responsable de budget.
- De 1 000 € à 5 000 € : accord du responsable de département, notifié à la Finance.
- Plus de 5 000 € : validation humaine explicite obligatoire. Aucun agent IA ne peut engager seul une dépense au-delà de ce seuil.

Procédure : demande documentée (objet, montant, budget imputé) → contrôle Finance → validation → enregistrement. Toute dépense non conforme est rejetée et tracée dans les logs de l'agent Finance.`,
    category: "Finance",
    tags: ["dépenses", "validation", "budget", "conformité"],
    owner: "Karim D. — Direction financière",
    status: "published",
    version: "v3.2",
    createdAt: "2026-01-08T08:00:00.000Z",
    updatedAt: "2026-07-21T10:15:00.000Z",
  },
  {
    id: "kb-convention-collective",
    type: "document",
    title: "Convention collective applicable",
    summary:
      "Convention Syntec : cadre contractuel de référence pour les recrutements et les contrats cadres.",
    content: `L'entreprise applique la convention collective Syntec (bureaux d'études techniques).

Points structurants pour les processus RH :
- Période d'essai des cadres : 4 mois, renouvelable une fois avec accord écrit des deux parties.
- Préavis de démission cadre : 3 mois, sauf dispense négociée.
- Classification : positionnement des postes selon les coefficients Syntec, revu à chaque promotion.

Tout contrat rédigé ou pré-rempli par l'agent RH doit s'appuyer sur cette convention. Les écarts éventuels nécessitent une validation juridique préalable.`,
    category: "RH",
    tags: ["Syntec", "contrat", "période d'essai", "juridique"],
    owner: "Sonia R. — Direction des ressources humaines",
    status: "published",
    version: "v1.4",
    createdAt: "2026-02-10T08:00:00.000Z",
    updatedAt: "2026-05-30T08:45:00.000Z",
  },
  {
    id: "kb-procedure-onboarding",
    type: "procedure",
    title: "Procédure d'onboarding collaborateur",
    summary:
      "Parcours des 30 premiers jours d'un nouveau collaborateur, du contrat signé à l'autonomie opérationnelle.",
    content: `Le parcours d'onboarding se déroule en trois séquences.

J-7 → J0 : préparation. Contrat signé, matériel commandé, comptes créés, référent désigné.
J1 → J10 : intégration. Présentation de l'organisation, accès aux outils, lecture des documents de référence (objectifs annuels, politique de dépenses, sécurité).
J11 → J30 : montée en autonomie. Premiers livrables encadrés, point hebdomadaire avec le référent, bilan à 30 jours consigné par les RH.

Un onboarding est considéré comme réussi lorsque le bilan à 30 jours est validé par le manager et le collaborateur.`,
    category: "RH",
    tags: ["onboarding", "intégration", "process"],
    owner: "Sonia R. — Direction des ressources humaines",
    status: "published",
    version: "v2.0",
    createdAt: "2026-03-02T09:00:00.000Z",
    updatedAt: "2026-07-14T11:20:00.000Z",
  },
  {
    id: "kb-procedure-escalade-support",
    type: "procedure",
    title: "Escalade des tickets support",
    summary:
      "Règles de priorisation et de transfert des tickets support entre l'agent Support et les équipes humaines.",
    content: `Priorisation :
- P0 : incident bloquant côté client. Prise en charge immédiate, escalade humaine sous 15 minutes.
- P1 : impact direct sur le chiffre d'affaires ou sur un compte stratégique. Réponse sous 2 heures.
- P2 : amélioration, gêne mineure. Traitement dans le flux hebdomadaire.

Escalade : l'agent Support traite en autonomie les P2 et les P1 documentés. Tout P0, ainsi que toute demande impliquant un geste commercial, est transféré à un responsable humain avec le résumé de la conversation et les actions déjà tentées.`,
    category: "Support",
    tags: ["support", "escalade", "SLA", "priorité"],
    owner: "Yanis T. — Responsable support",
    status: "published",
    version: "v1.8",
    createdAt: "2026-02-20T08:30:00.000Z",
    updatedAt: "2026-07-28T16:05:00.000Z",
  },
  {
    id: "kb-wiki-architecture-agents",
    type: "wiki",
    title: "Architecture de la workforce IA",
    summary:
      "Vue d'ensemble de l'organisation des agents NASSFLOW OS, de leurs domaines et de leurs collaborations.",
    content: `La workforce IA est organisée en sept collaborateurs, un par domaine fonctionnel : Direction, Commercial, Marketing, Finance, RH, Support et Opérations.

Chaque agent dispose de son propre périmètre de capacités, de ses outils connectés et de ses permissions. L'agent Direction joue le rôle d'orchestrateur : il arbitre les priorités et déclenche les missions transverses.

Les collaborations sont déclarées explicitement (champ « collabore avec ») afin de rendre lisibles les chaînes de délégation. Une mission peut mobiliser plusieurs agents en parallèle, avec des étapes dépendantes les unes des autres.`,
    category: "Opérations",
    tags: ["agents", "architecture", "orchestration"],
    owner: "Nassim B. — Direction générale",
    status: "published",
    version: "v1.2",
    createdAt: "2026-04-05T10:00:00.000Z",
    updatedAt: "2026-07-30T09:00:00.000Z",
  },
  {
    id: "kb-wiki-glossaire",
    type: "wiki",
    title: "Glossaire NASSFLOW OS",
    summary:
      "Définitions des termes structurants de la plateforme : mission, étape, agent, mémoire, Enterprise Brain.",
    content: `Agent — collaborateur IA doté d'un rôle, de capacités, d'outils et de permissions.
Mission — objectif structuré confié à un ou plusieurs agents, découpé en étapes ordonnées.
Étape — unité d'exécution d'une mission, pouvant dépendre d'autres étapes.
Mémoire de travail — contexte temporaire lié à une exécution en cours.
Mémoire long terme — apprentissage conservé d'une exécution à l'autre.
Mémoire partagée — connaissance échangée entre plusieurs agents.
Enterprise Brain — socle documentaire officiel de l'entreprise, source de vérité des agents.`,
    category: "Opérations",
    tags: ["glossaire", "vocabulaire", "référence"],
    owner: "Nassim B. — Direction générale",
    status: "published",
    version: "v1.0",
    createdAt: "2026-04-12T08:00:00.000Z",
    updatedAt: "2026-06-09T13:10:00.000Z",
  },
  {
    id: "kb-faq-securite",
    type: "faq",
    title: "FAQ Sécurité et données",
    summary:
      "Réponses aux questions récurrentes sur l'hébergement, la confidentialité et les accès des agents.",
    content: `Où sont hébergées les données ?
Dans l'Union européenne, sur des infrastructures conformes RGPD.

Les agents peuvent-ils accéder aux données RH sensibles ?
Non. Seul l'agent RH dispose d'un accès en lecture sur ce périmètre, sans droit d'export.

Une action d'agent est-elle traçable ?
Oui. Chaque appel d'outil, décision, passage de relais et validation est enregistré dans les logs de l'agent.

Comment révoquer un accès ?
Depuis la fiche de l'agent, onglet Permissions. La révocation est immédiate et journalisée.`,
    category: "Sécurité",
    tags: ["sécurité", "RGPD", "accès", "traçabilité"],
    owner: "Karim D. — Direction financière",
    status: "published",
    version: "v1.5",
    createdAt: "2026-03-18T09:30:00.000Z",
    updatedAt: "2026-07-25T15:40:00.000Z",
  },
  {
    id: "kb-faq-commercial",
    type: "faq",
    title: "FAQ Cycle de vente",
    summary:
      "Questions fréquentes de l'équipe commerciale sur les devis, les relances et la qualification des leads.",
    content: `Quelle est la durée de validité d'un devis ?
30 jours à compter de la date d'émission, sauf mention contraire.

Combien de relances avant abandon d'un lead ?
Trois relances espacées de 5 jours ouvrés. Au-delà, le lead repasse en nurturing marketing.

Qui valide une remise supérieure à 12 % ?
La Finance, conformément à la grille tarifaire officielle.

Quand un lead est-il considéré comme qualifié ?
Lorsque le besoin, le budget et le décideur sont identifiés et consignés dans le CRM.`,
    category: "Commercial",
    tags: ["ventes", "devis", "relance", "qualification"],
    owner: "Léa M. — Direction commerciale",
    status: "published",
    version: "v2.2",
    createdAt: "2026-03-25T08:00:00.000Z",
    updatedAt: "2026-07-19T10:50:00.000Z",
  },
  {
    id: "kb-charte-editoriale",
    type: "document",
    title: "Charte éditoriale et ton de marque",
    summary:
      "Règles de rédaction appliquées à toutes les productions marketing, humaines comme générées par l'IA.",
    content: `Ton : direct, factuel, sans superlatifs. On explique, on ne survend pas.

Règles :
- Phrases courtes, voix active, vocabulaire concret.
- Pas de jargon non défini ; tout terme technique renvoie au glossaire.
- Chiffres systématiquement sourcés et datés.
- Français par défaut, anglais uniquement pour les termes techniques établis.

Toute production de l'agent Marketing est relue par un humain avant publication externe.`,
    category: "Marketing",
    tags: ["éditorial", "ton", "rédaction", "marque"],
    owner: "Inès K. — Direction marketing",
    status: "published",
    version: "v1.6",
    createdAt: "2026-02-28T09:00:00.000Z",
    updatedAt: "2026-06-27T12:00:00.000Z",
  },
  {
    id: "kb-procedure-cloture-mensuelle",
    type: "procedure",
    title: "Clôture comptable mensuelle",
    summary:
      "Séquence de clôture des comptes du mois, du rapprochement bancaire au reporting de direction.",
    content: `J+1 à J+3 : collecte des pièces, rapprochement bancaire, contrôle des notes de frais.
J+4 à J+6 : lettrage clients et fournisseurs, provisions, contrôle des écarts significatifs (> 2 %).
J+7 : production du reporting mensuel et transmission au comité de direction.

L'agent Finance prépare les états et signale les anomalies ; la validation finale reste humaine. Aucune écriture n'est passée automatiquement.`,
    category: "Finance",
    tags: ["comptabilité", "clôture", "reporting"],
    owner: "Karim D. — Direction financière",
    status: "draft",
    version: "v0.9",
    createdAt: "2026-06-15T09:00:00.000Z",
    updatedAt: "2026-08-01T08:20:00.000Z",
  },
  {
    id: "kb-wiki-roadmap-produit",
    type: "wiki",
    title: "Roadmap produit — jalons internes",
    summary: "Jalons de développement de la plateforme et principes de priorisation des chantiers.",
    content: `Principes de priorisation : impact client mesurable, dette technique maîtrisée, cohérence avec les objectifs annuels.

Jalons :
- Socle design system et master layout.
- Cockpit exécutif et modules opérationnels.
- Orchestration des missions et exécution parallèle.
- Socle documentaire Enterprise Brain.

Chaque jalon est clos par une revue interne, avec démonstration et liste des limitations connues.`,
    category: "Opérations",
    tags: ["roadmap", "produit", "priorisation"],
    owner: "Nassim B. — Direction générale",
    status: "draft",
    version: "v0.4",
    createdAt: "2026-05-11T09:00:00.000Z",
    updatedAt: "2026-07-31T17:30:00.000Z",
  },
  {
    id: "kb-politique-remises-2025",
    type: "document",
    title: "Politique de remises 2025 (obsolète)",
    summary:
      "Ancienne politique de remise remplacée par la grille tarifaire officielle en vigueur depuis 2026.",
    content: `Document conservé à titre d'historique. Il ne doit plus servir de référence.

L'ancien cadre autorisait une remise directe jusqu'à 18 % sans validation, ce qui a dégradé la marge brute sur le second semestre 2025. Il a été remplacé par la grille tarifaire officielle, qui abaisse le seuil sans validation à 12 %.

Pour toute négociation en cours, se référer exclusivement à la grille en vigueur.`,
    category: "Commercial",
    tags: ["archive", "remise", "historique"],
    owner: "Léa M. — Direction commerciale",
    status: "archived",
    version: "v3.0",
    createdAt: "2025-01-15T08:00:00.000Z",
    updatedAt: "2026-01-20T09:00:00.000Z",
  },
];

export function knowledgeById(id: string): KnowledgeItem | null {
  return knowledgeMock.find((item) => item.id === id) ?? null;
}

/** Catégories présentes dans la base, avec leur nombre de connaissances. */
export function knowledgeCategories(): { category: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const item of knowledgeMock) {
    counts.set(item.category, (counts.get(item.category) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => a.category.localeCompare(b.category, "fr"));
}

/** Agents dont une entrée de mémoire référence ce KnowledgeItem via sourceId. */
export function agentsUsingKnowledge(itemId: string): AgentDetail[] {
  return agentsDetailMock.filter((agent) =>
    agent.memory.some((entry) => entry.sourceId === itemId),
  );
}
