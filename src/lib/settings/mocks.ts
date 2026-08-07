import type {
  AiSettings,
  ApiKey,
  DataSettings,
  DisplaySettings,
  NotificationSetting,
  SystemInfo,
} from "./types";

/** Cohérent avec companyProfileMock (primaryLocale fr-FR, timezone Europe/Paris). */
export const displaySettingsMock: DisplaySettings = {
  theme: "dark",
  density: "comfortable",
  language: "Français (fr-FR)",
  dateFormat: "JJ/MM/AAAA",
  numberFormat: "1 234,56",
  firstDayOfWeek: "monday",
};

export const aiSettingsMock: AiSettings = {
  defaultModel: "NASSFLOW Core v4",
  defaultAutonomyLevel: "semi_autonomous",
  defaultValidationThreshold: "critical_only",
  maxConcurrentMissions: 6,
  memoryRetentionDays: 180,
  costAlertThreshold: "500,00 €",
};

export const notificationSettingsMock: NotificationSetting[] = [
  {
    id: "n-mission-done",
    label: "Mission terminée",
    description: "Une mission passe au statut Terminée, avec son résumé de raisonnement.",
    inApp: true,
    email: true,
    slack: false,
  },
  {
    id: "n-mission-failed",
    label: "Mission échouée",
    description: "Une mission s'interrompt sur une erreur bloquante d'un de ses steps.",
    inApp: true,
    email: true,
    slack: true,
  },
  {
    id: "n-agent-error",
    label: "Agent en erreur",
    description: "Un collaborateur IA renvoie une erreur d'exécution ou d'appel d'outil.",
    inApp: true,
    email: false,
    slack: true,
  },
  {
    id: "n-validation",
    label: "Validation humaine requise",
    description: "Un agent atteint le seuil de validation et attend une décision humaine.",
    inApp: true,
    email: true,
    slack: true,
  },
  {
    id: "n-workflow-failed",
    label: "Workflow en échec",
    description: "Une exécution du Workflow Engine se termine avec le statut Échec.",
    inApp: true,
    email: false,
    slack: true,
  },
  {
    id: "n-integration-down",
    label: "Intégration déconnectée",
    description: "Une intégration perd son authentification ou échoue à se synchroniser.",
    inApp: true,
    email: true,
    slack: false,
  },
  {
    id: "n-cost",
    label: "Seuil de coût atteint",
    description: "La consommation IA du mois dépasse le seuil d'alerte défini.",
    inApp: true,
    email: true,
    slack: false,
  },
  {
    id: "n-member",
    label: "Nouveau membre invité",
    description: "Un membre est invité dans l'organisation et n'a pas encore activé son compte.",
    inApp: true,
    email: false,
    slack: false,
  },
];

export const apiKeysMock: ApiKey[] = [
  {
    id: "k-prod",
    label: "Production",
    maskedKey: "nsf_live_••••••••4f2a",
    scopes: ["missions:read", "missions:write", "agents:read"],
    createdAt: "2025-02-11T10:15:00+01:00",
    lastUsedAt: "2026-08-06T08:42:00+02:00",
    status: "active",
  },
  {
    id: "k-zapier",
    label: "Intégration Zapier",
    maskedKey: "nsf_live_••••••••91c7",
    scopes: ["missions:read", "crm:read"],
    createdAt: "2025-06-03T14:30:00+02:00",
    lastUsedAt: "2026-08-05T19:10:00+02:00",
    status: "active",
  },
  {
    id: "k-analytics",
    label: "Reporting interne",
    maskedKey: "nsf_read_••••••••02be",
    scopes: ["insights:read", "billing:read"],
    createdAt: "2026-01-20T09:05:00+01:00",
    lastUsedAt: null,
    status: "active",
  },
  {
    id: "k-legacy",
    label: "Ancien connecteur Ops",
    maskedKey: "nsf_live_••••••••7d10",
    scopes: ["workflows:read"],
    createdAt: "2024-09-14T11:00:00+02:00",
    lastUsedAt: "2025-11-02T16:25:00+01:00",
    status: "revoked",
  },
];

export const dataSettingsMock: DataSettings = {
  exportFormat: "JSON",
  retentionMissions: "24 mois",
  retentionLogs: "12 mois",
  backupFrequency: "Quotidienne",
  lastBackupAt: "2026-08-06T03:00:00+02:00",
};

export const systemInfoMock: SystemInfo = {
  version: "NASSFLOW OS v1.4.2",
  environment: "Production",
  region: "EU-West (Paris)",
  lastDeployedAt: "2026-08-04T18:20:00+02:00",
  uptime: "99,98 % sur 90 jours",
};
