import { Link } from "@tanstack/react-router";
import { ArrowUpRight, ShieldCheck } from "lucide-react";

import { SettingRow, SettingsCard } from "@/components/settings/settings-rows";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatSettingsDate } from "@/lib/settings/meta";
import { systemInfoMock } from "@/lib/settings/mocks";

export function SystemSection() {
  const s = systemInfoMock;

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

      <SettingsCard
        title="Sécurité & conformité"
        action={
          <Button type="button" size="sm" variant="secondary" asChild>
            <Link to="/security-center">
              Ouvrir Security Center
              <ArrowUpRight aria-hidden="true" />
            </Link>
          </Button>
        }
      >
        <div className="flex items-start gap-3 rounded-lg border border-border bg-surface p-3">
          <ShieldCheck
            className="mt-0.5 size-4 shrink-0 text-muted-foreground"
            aria-hidden="true"
          />
          <p className="text-[12px] leading-4 text-muted-foreground">
            L'authentification à deux facteurs, la politique de mot de passe, la durée de session,
            les adresses IP autorisées et la rétention des journaux d'audit sont configurées dans le
            module Security Center.
          </p>
        </div>
      </SettingsCard>
    </div>
  );
}
