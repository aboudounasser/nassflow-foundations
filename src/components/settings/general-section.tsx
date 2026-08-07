import { Link } from "@tanstack/react-router";
import { ArrowUpRight, Lock } from "lucide-react";

import { SettingRow, SettingsCard } from "@/components/settings/settings-rows";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useCompanyProfile } from "@/lib/organization/queries";
import {
  DENSITY_LABEL,
  FIRST_DAY_LABEL,
  READ_ONLY_NOTICE,
  THEME_OPTIONS,
} from "@/lib/settings/meta";
import type { DisplaySettings } from "@/lib/settings/types";

export function GeneralSection({ display }: { display: DisplaySettings }) {
  const d = display;
  const companyQuery = useCompanyProfile();
  const company = companyQuery.data;

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
        {companyQuery.isError ? (
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <p className="text-[13px] text-muted-foreground">
              Le profil d'entreprise n'a pas pu être chargé.
            </p>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => void companyQuery.refetch()}
            >
              Réessayer
            </Button>
          </div>
        ) : company ? (
          <div className="mt-2">
            <SettingRow label="Nom">{company.name}</SettingRow>
            <SettingRow label="Secteur">{company.industry}</SettingRow>
            <SettingRow label="Taille">{company.size}</SettingRow>
            <SettingRow label="Année de création">{company.foundedYear}</SettingRow>
            <SettingRow label="Plan">
              <Badge variant="primary">{company.plan}</Badge>
            </SettingRow>
            <SettingRow label="Fuseau horaire">{company.timezone}</SettingRow>
            <SettingRow label="Locale principale">{company.primaryLocale}</SettingRow>
          </div>
        ) : (
          <div className="mt-2 flex flex-col gap-2">
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full rounded-lg" />
            ))}
          </div>
        )}
      </SettingsCard>
    </div>
  );
}
