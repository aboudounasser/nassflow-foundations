import type {
  ActivityEvent,
  Agent,
  AppNotification,
  CalendarEvent,
  Decision,
  EnterprisePulse,
  Forecast,
  HealthCategory,
  HistoryEvent,
  Insight,
  Kpi,
  Mission,
  Opportunity,
} from "./types";

/** MOCKS STATIQUES — aucune source de données réelle. */

export const enterprisePulseMock: EnterprisePulse = {
  generatedAt: "2026-08-03T08:00:00.000Z",
  enterpriseScore: 78,
  summary:
    "Les ventes progressent de 14% cette semaine. Deux intégrations nécessitent une reconnexion. Trois décisions sont en attente de validation.",
  priorities: [
    "Valider la campagne marketing Q3",
    "Reconnecter l'intégration facturation",
    "Clôturer le rapport financier mensuel",
  ],
  opportunities: [
    "42 prospects inactifs à relancer",
    "Upsell identifié sur 8 comptes clés",
    "Automatiser la qualification des leads",
  ],
  risks: [
    "Deux intégrations déconnectées depuis 3 jours",
    "Marge en baisse sur le segment PME",
    "Temps de réponse support au-dessus du SLA",
  ],
  recommendation:
    "Prioriser la reconnexion des intégrations avant le closing de fin de mois.",
  confidenceScore: 87,
};

export const kpisMock: Kpi[] = [
  { id: "kpi-revenue", title: "Chiffre d'affaires", value: 1284000, unit: "€", previousValue: 1126000, change: 14, trend: "up", target: 1400000, status: "success", lastUpdated: "2026-08-03T07:30:00.000Z" },
  { id: "kpi-mrr", title: "MRR", value: 96500, unit: "€", previousValue: 92100, change: 4.8, trend: "up", target: 105000, status: "success", lastUpdated: "2026-08-03T07:30:00.000Z" },
  { id: "kpi-margin", title: "Marge", value: 31.4, unit: "%", previousValue: 33.8, change: -2.4, trend: "down", target: 35, status: "warning", lastUpdated: "2026-08-03T07:30:00.000Z" },
  { id: "kpi-missions", title: "Missions réalisées", value: 248, unit: "", previousValue: 214, change: 15.9, trend: "up", target: 280, status: "success", lastUpdated: "2026-08-03T07:30:00.000Z" },
  { id: "kpi-csat", title: "Satisfaction client", value: 4.6, unit: "/5", previousValue: 4.5, change: 2.2, trend: "up", target: 4.8, status: "info", lastUpdated: "2026-08-03T07:30:00.000Z" },
  { id: "kpi-productivity", title: "Productivité", value: 87, unit: "%", previousValue: 84, change: 3.6, trend: "up", target: 90, status: "success", lastUpdated: "2026-08-03T07:30:00.000Z" },
];

export const healthMock: HealthCategory[] = [
  { id: "h-sales", name: "Commercial", score: 84, trend: "up", status: "success", lastIncident: null, recommendation: "Maintenir la cadence de relance." },
  { id: "h-finance", name: "Finance", score: 71, trend: "down", status: "info", lastIncident: "2026-07-28", recommendation: "Surveiller la marge PME." },
  { id: "h-support", name: "Support", score: 58, trend: "down", status: "warning", lastIncident: "2026-08-01", recommendation: "Renforcer l'équipe niveau 1." },
  { id: "h-ops", name: "Opérations", score: 79, trend: "flat", status: "success", lastIncident: null, recommendation: "Rien à signaler." },
  { id: "h-security", name: "Sécurité", score: 42, trend: "down", status: "destructive", lastIncident: "2026-08-02", recommendation: "Reconnecter les intégrations exposées." },
];

export const agentsMock: Agent[] = [
  { id: "a-ceo", name: "CEO Agent", role: "Pilotage stratégique", avatar: "CE", status: "active", currentMission: "Consolidation du reporting exécutif", progress: 62, confidenceScore: 91, uptime: "99.8%", lastActivity: "il y a 4 min" },
  { id: "a-sales", name: "Sales Agent", role: "Développement commercial", avatar: "SA", status: "active", currentMission: "Relance des prospects inactifs", progress: 45, confidenceScore: 84, uptime: "99.4%", lastActivity: "il y a 12 min" },
  { id: "a-finance", name: "Finance Agent", role: "Analyse financière", avatar: "FI", status: "paused", currentMission: "Rapport financier Q3", progress: 28, confidenceScore: 76, uptime: "98.1%", lastActivity: "il y a 2 h" },
  { id: "a-support", name: "Support Agent", role: "Relation client", avatar: "SU", status: "error", currentMission: "Tri des tickets prioritaires", progress: 12, confidenceScore: 41, uptime: "94.7%", lastActivity: "il y a 35 min" },
];

export const decisionsMock: Decision[] = [
  { id: "d-1", title: "Approuver une remise de 15% pour Client X", category: "Commercial", priority: "high", recommendation: "Approuver — le compte représente 8% du CA annuel.", confidenceScore: 88, impact: "+42 000 € de renouvellement sécurisé", dueDate: "Aujourd'hui, 18:00", createdAt: "2026-08-03T07:10:00.000Z" },
  { id: "d-2", title: "Valider la campagne marketing Q3", category: "Marketing", priority: "medium", recommendation: "Valider avec un budget réduit de 10%.", confidenceScore: 74, impact: "Portée estimée : 120 000 contacts", dueDate: "Demain, 12:00", createdAt: "2026-08-02T15:40:00.000Z" },
  { id: "d-3", title: "Reconduire le contrat fournisseur cloud", category: "Opérations", priority: "critical", recommendation: "Renégocier avant reconduction automatique.", confidenceScore: 65, impact: "-18 000 € annuels si renégocié", dueDate: "Vendredi, 09:00", createdAt: "2026-08-01T09:05:00.000Z" },
];

export const missionsMock: Mission[] = [
  { id: "m-1", title: "Relancer les prospects inactifs", priority: "high", status: "running", progress: 45, dueDate: "5 août", owner: "Sales Agent", agents: [{ id: "a-sales", name: "Sales Agent", avatar: "SA" }, { id: "a-ceo", name: "CEO Agent", avatar: "CE" }], tags: ["Commercial", "Automatisation"] },
  { id: "m-2", title: "Préparer le rapport financier Q3", priority: "critical", status: "blocked", progress: 28, dueDate: "7 août", owner: "Finance Agent", agents: [{ id: "a-finance", name: "Finance Agent", avatar: "FI" }], tags: ["Finance"] },
  { id: "m-3", title: "Reconnecter les intégrations critiques", priority: "critical", status: "running", progress: 70, dueDate: "4 août", owner: "Ops", agents: [{ id: "a-ceo", name: "CEO Agent", avatar: "CE" }, { id: "a-support", name: "Support Agent", avatar: "SU" }], tags: ["Sécurité", "Intégrations"] },
  { id: "m-4", title: "Réduire le temps de réponse support", priority: "medium", status: "todo", progress: 0, dueDate: "12 août", owner: "Support Agent", agents: [{ id: "a-support", name: "Support Agent", avatar: "SU" }], tags: ["Support"] },
  { id: "m-5", title: "Consolider le reporting exécutif", priority: "low", status: "done", progress: 100, dueDate: "1 août", owner: "CEO Agent", agents: [{ id: "a-ceo", name: "CEO Agent", avatar: "CE" }], tags: ["Pilotage"] },
];

export const activityMock: ActivityEvent[] = [
  { id: "ac-1", timestamp: "09:42", actor: "Sales Agent", actorType: "agent", action: "a relancé 18 prospects inactifs", resource: "Campagne relance été", missionId: "m-1" },
  { id: "ac-2", timestamp: "09:15", actor: "Nassim", actorType: "user", action: "a validé la décision", resource: "Remise Client X", missionId: null },
  { id: "ac-3", timestamp: "08:58", actor: "Système", actorType: "system", action: "a détecté une intégration déconnectée", resource: "Facturation", missionId: "m-3" },
  { id: "ac-4", timestamp: "08:30", actor: "CEO Agent", actorType: "agent", action: "a généré le résumé exécutif", resource: "Enterprise Pulse", missionId: null },
  { id: "ac-5", timestamp: "08:04", actor: "Finance Agent", actorType: "agent", action: "a mis en pause la mission", resource: "Rapport financier Q3", missionId: "m-2" },
  { id: "ac-6", timestamp: "07:47", actor: "Support Agent", actorType: "agent", action: "a échoué à trier 12 tickets", resource: "File support", missionId: "m-4" },
  { id: "ac-7", timestamp: "07:20", actor: "Système", actorType: "system", action: "a synchronisé les données CRM", resource: "CRM", missionId: null },
  { id: "ac-8", timestamp: "06:55", actor: "Nassim", actorType: "user", action: "a créé la mission", resource: "Reconnecter les intégrations", missionId: "m-3" },
];

export const notificationsMock: AppNotification[] = [
  { id: "n-1", type: "critical", title: "Intégration facturation déconnectée", description: "Aucune synchronisation depuis 3 jours.", read: false, priority: "critical", createdAt: "2026-08-03T08:58:00.000Z" },
  { id: "n-2", type: "warning", title: "SLA support dépassé", description: "Temps de réponse moyen : 6h12 (cible 4h).", read: false, priority: "high", createdAt: "2026-08-03T07:40:00.000Z" },
  { id: "n-3", type: "success", title: "Objectif MRR atteint à 92%", description: "96 500 € sur un objectif de 105 000 €.", read: true, priority: "medium", createdAt: "2026-08-03T06:30:00.000Z" },
  { id: "n-4", type: "info", title: "Nouveau rapport disponible", description: "Synthèse hebdomadaire générée par le CEO Agent.", read: true, priority: "low", createdAt: "2026-08-02T18:10:00.000Z" },
  { id: "n-5", type: "warning", title: "3 décisions en attente", description: "Dont une arrive à échéance aujourd'hui.", read: false, priority: "high", createdAt: "2026-08-02T16:00:00.000Z" },
];

export const calendarMock: CalendarEvent[] = [
  { id: "c-1", title: "Comité de direction", startDate: "2026-08-03T14:00:00.000Z", endDate: "2026-08-03T15:00:00.000Z", category: "meeting", participants: ["Nassim", "Direction"], missionId: null },
  { id: "c-2", title: "Échéance rapport Q3", startDate: "2026-08-07T09:00:00.000Z", endDate: "2026-08-07T09:00:00.000Z", category: "deadline", participants: ["Finance Agent"], missionId: "m-2" },
  { id: "c-3", title: "Point pipeline commercial", startDate: "2026-08-04T10:30:00.000Z", endDate: "2026-08-04T11:00:00.000Z", category: "meeting", participants: ["Sales Agent", "Nassim"], missionId: "m-1" },
  { id: "c-4", title: "Rappel : renégocier le contrat cloud", startDate: "2026-08-05T08:00:00.000Z", endDate: "2026-08-05T08:15:00.000Z", category: "reminder", participants: ["Nassim"], missionId: null },
];

export const opportunitiesMock: Opportunity[] = [
  { id: "o-1", title: "Upsell sur 8 comptes clés", description: "Ces comptes utilisent 90% de leur quota depuis 2 mois.", estimatedImpact: "+64 000 € ARR", effort: "low", confidenceScore: 82, priority: "high" },
  { id: "o-2", title: "Automatiser la qualification des leads", description: "Le Sales Agent peut traiter 70% des leads entrants.", estimatedImpact: "-12 h / semaine", effort: "medium", confidenceScore: 76, priority: "medium" },
  { id: "o-3", title: "Réactiver 42 prospects dormants", description: "Aucun contact depuis plus de 90 jours.", estimatedImpact: "+18 000 € pipeline", effort: "low", confidenceScore: 68, priority: "medium" },
];

export const insightsMock: Insight[] = [
  { id: "i-1", title: "La marge PME se dégrade", summary: "La marge du segment PME a reculé de 2,4 points en 30 jours, principalement sur les remises accordées.", explanation: "Corrélation forte entre remises > 10% et baisse de marge sur 34 contrats.", confidenceScore: 84, recommendation: "Plafonner les remises PME à 10% jusqu'à fin de trimestre.", generatedAt: "2026-08-03T08:00:00.000Z" },
  { id: "i-2", title: "Le support est le goulot d'étranglement", summary: "Le temps de réponse support impacte le NPS et la rétention des comptes < 5k€.", explanation: "Les comptes ayant attendu > 6h ont 2,3x plus de risque de churn.", confidenceScore: 79, recommendation: "Activer le Support Agent en tri automatique niveau 1.", generatedAt: "2026-08-03T08:00:00.000Z" },
  { id: "i-3", title: "Fenêtre favorable sur l'upsell", summary: "L'usage produit dépasse les quotas sur 8 comptes clés, moment idéal pour un upsell.", explanation: "Usage moyen à 91% du quota sur les 60 derniers jours.", confidenceScore: 88, recommendation: "Lancer une mission d'upsell ciblée cette semaine.", generatedAt: "2026-08-03T08:00:00.000Z" },
];

export const forecastMock: Forecast = {
  id: "f-revenue",
  metric: "Revenus",
  currentValue: 1284000,
  predictedValue: 1452000,
  confidenceInterval: [1380000, 1524000],
  predictionDate: "2026-11-01T00:00:00.000Z",
  series: [
    { label: "Mai", actual: 1042000, predicted: 1050000 },
    { label: "Juin", actual: 1126000, predicted: 1118000 },
    { label: "Juil", actual: 1284000, predicted: 1240000 },
    { label: "Août", actual: null, predicted: 1330000 },
    { label: "Sept", actual: null, predicted: 1392000 },
    { label: "Oct", actual: null, predicted: 1452000 },
  ],
};

export const historyMock: HistoryEvent[] = [
  { id: "hi-1", title: "Mission « Consolider le reporting » terminée", type: "mission", actor: "CEO Agent", timestamp: "1 août, 17:40", resource: "m-5" },
  { id: "hi-2", title: "Décision « Budget outillage » approuvée", type: "decision", actor: "Nassim", timestamp: "31 juil., 11:20", resource: "d-0" },
  { id: "hi-3", title: "Intégration CRM reconnectée", type: "integration", actor: "Système", timestamp: "30 juil., 09:05", resource: "CRM" },
  { id: "hi-4", title: "Audit de sécurité mensuel exécuté", type: "security", actor: "Système", timestamp: "29 juil., 22:00", resource: "Security Center" },
  { id: "hi-5", title: "Rapport hebdomadaire généré", type: "report", actor: "CEO Agent", timestamp: "28 juil., 07:00", resource: "Insights" },
];
