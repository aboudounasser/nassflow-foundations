import { SettingRow, SettingsCard } from "@/components/settings/settings-rows";
import { Badge } from "@/components/ui/badge";
import { formatSettingsDate } from "@/lib/settings/meta";
import type { SystemInfo } from "@/lib/settings/types";

export function SystemSection({ system }: { system: SystemInfo }) {
  const s = system;

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <SettingsCard title="Environnement système">
        <SettingRow label="Version">{s.version}</SettingRow>
        <SettingRow label="Environnement">
          <Badge variant="success">{s.environment}</Badge>
        </SettingRow>
        <SettingRow label="Région">{s.region}</SettingRow>
        <SettingRow label="Dernier déploiement">{formatSettingsDate(s.lastDeployedAt)}</SettingRow>
        <SettingRow label="Disponibilité">{s.uptime}</SettingRow>
      </SettingsCard>
    </div>
  );
}
