export interface DisplaySettings {
  theme: "dark" | "light" | "system";
  density: "comfortable" | "compact";
  language: string;
  dateFormat: string;
  numberFormat: string;
  firstDayOfWeek: "monday" | "sunday";
}

export interface AiSettings {
  defaultModel: string;
  defaultAutonomyLevel: "supervised" | "semi_autonomous" | "autonomous";
  defaultValidationThreshold: "none" | "critical_only" | "all_actions";
  maxConcurrentMissions: number;
  memoryRetentionDays: number;
  costAlertThreshold: string;
}

export interface NotificationSetting {
  id: string;
  label: string;
  description: string;
  inApp: boolean;
  email: boolean;
  slack: boolean;
}

export interface ApiKey {
  id: string;
  label: string;
  maskedKey: string;
  scopes: string[];
  createdAt: string;
  lastUsedAt: string | null;
  status: "active" | "revoked";
}

export interface DataSettings {
  exportFormat: string;
  retentionMissions: string;
  retentionLogs: string;
  backupFrequency: string;
  lastBackupAt: string;
}

export interface SystemInfo {
  version: string;
  environment: string;
  region: string;
  lastDeployedAt: string;
  uptime: string;
}

export type SettingsTab = "general" | "ai" | "notifications" | "data" | "api" | "system";
