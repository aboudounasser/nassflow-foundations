import {
  aiSettingsMock,
  apiKeysMock,
  dataSettingsMock,
  displaySettingsMock,
  notificationSettingsMock,
  systemInfoMock,
} from "@/lib/settings/mocks";
import type {
  AiSettings,
  ApiKey,
  DataSettings,
  DisplaySettings,
  NotificationSetting,
  SystemInfo,
} from "@/lib/settings/types";
import type { Scope } from "@/lib/tenancy/types";
import { delay } from "@/services/latency";

/** Ces réglages sont toujours affichés ensemble : un seul appel. */
export interface SettingsData {
  display: DisplaySettings;
  ai: AiSettings;
  notifications: NotificationSetting[];
  apiKeys: ApiKey[];
  data: DataSettings;
  system: SystemInfo;
}

export async function getSettings(_scope: Scope): Promise<SettingsData> {
  return delay({
    display: displaySettingsMock,
    ai: aiSettingsMock,
    notifications: notificationSettingsMock,
    apiKeys: apiKeysMock,
    data: dataSettingsMock,
    system: systemInfoMock,
  });
}
