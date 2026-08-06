import { Link } from "@tanstack/react-router";
import { ArrowUpRight, Lock } from "lucide-react";

import { SettingRow, SettingsCard } from "@/components/settings/settings-rows";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { companyProfileMock } from "@/lib/organization/mocks";
import {
  DENSITY_LABEL,
  FIRST_DAY_LABEL,
  READ_ONLY_NOTICE,
  THEME_OPTIONS,
} from "@/lib/settings/meta";
import { displaySettingsMock } from "@/lib/settings/mocks";

export function GeneralSection() {
  const d = displaySettingsMock;

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <SettingsCard
        title="Affichage"
        action={
          <Badge variant="neutral">
            <Lock aria-hidden="true" />
            {READ_ONLY_NOTICE}
          </Badge>
        }
      >
        <SettingRow label="Thème" hint="Seul le mode sombre est implémenté dans le Design System.">
          <div className="flex flex-wrap gap-2">
            {THEME_OPTIONS.map((option) => {
              const active = option.value === d.theme && option.available;
              return (
                <Button
                  key={option.value}
                  type="button"
                  size="sm"
                  variant={active ? "secondary" : "ghost"}
                  disabled={!option.available}
                  aria-pressed={active}
                  title={option.available ? undefined : "Bientôt disponible"}
                >
                  {option.label}
                  {option.available ? null : (
                    <span className="text-[11px] text-muted-foreground">Bientôt disponible</span>
                  )}
                </Button>
              );
            })}
          </div>
        </SettingRow>
        <SettingRow label="Densité d'interface">{DENSITY_LABEL[d.density]}</SettingRow>
        <SettingRow label="Langue">{d.language}</SettingRow>
        <SettingRow label="Format de date">{d.dateFormat}</SettingRow>
        <SettingRow label="Format de nombre">{d.numberFormat}</SettingRow>
        <SettingRow label="Premier jour de la semaine">
          {FIRST_DAY_LABEL[d.firstDayOfWeek]}
        </SettingRow>
      </SettingsCard>

      <SettingsCard
        title="Entreprise"
        action={
          <Button type="button" size="sm" variant="secondary" asChild>
            <Link to="/organization">
              Gérer dans Organization
              <ArrowUpRight aria-hidden="true" />
            </Link>
          </Button>
        }
      >
        <p className="text-[12px] leading-4 text-muted-foreground">
          Ces informations sont gérées dans le module Organization et s'affichent ici en lecture
          seule.
        </p>
        <div className="mt-2">
          <SettingRow label="Nom">{companyProfileMock.name}</SettingRow>
          <SettingRow label="Secteur">{companyProfileMock.industry}</SettingRow>
          <SettingRow label="Taille">{companyProfileMock.size}</SettingRow>
          <SettingRow label="Année de création">{companyProfileMock.foundedYear}</SettingRow>
          <SettingRow label="Plan">
            <Badge variant="primary">{companyProfileMock.plan}</Badge>
          </SettingRow>
          <SettingRow label="Fuseau horaire">{companyProfileMock.timezone}</SettingRow>
          <SettingRow label="Locale principale">{companyProfileMock.primaryLocale}</SettingRow>
        </div>
      </SettingsCard>
    </div>
  );
}