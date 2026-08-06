import { Lock } from "lucide-react";

import { SettingRow, SettingsCard } from "@/components/settings/settings-rows";
import { Badge } from "@/components/ui/badge";
import {
  AUTONOMY_LEVEL,
  READ_ONLY_NOTICE,
  VALIDATION_THRESHOLD,
} from "@/lib/settings/meta";
import { aiSettingsMock } from "@/lib/settings/mocks";

export function AiSection() {
  const ai = aiSettingsMock;
  const autonomy = AUTONOMY_LEVEL[ai.defaultAutonomyLevel];
  const validation = VALIDATION_THRESHOLD[ai.defaultValidationThreshold];

  return (
    <SettingsCard
      title="IA & Automatisation"
      action={
        <Badge variant="neutral">
          <Lock aria-hidden="true" />
          {READ_ONLY_NOTICE}
        </Badge>
      }
    >
      <SettingRow label="Modèle par défaut">{ai.defaultModel}</SettingRow>
      <SettingRow
        label="Niveau d'autonomie par défaut"
        hint="Appliqué aux nouveaux collaborateurs IA."
      >
        <Badge variant={autonomy.variant}>{autonomy.label}</Badge>
      </SettingRow>
      <SettingRow label="Seuil de validation par défaut">
        <Badge variant={validation.variant}>{validation.label}</Badge>
      </SettingRow>
      <SettingRow label="Missions simultanées maximum">{ai.maxConcurrentMissions}</SettingRow>
      <SettingRow label="Rétention de la mémoire">{ai.memoryRetentionDays} jours</SettingRow>
      <SettingRow label="Seuil d'alerte de coût">{ai.costAlertThreshold} / mois</SettingRow>
    </SettingsCard>
  );
}