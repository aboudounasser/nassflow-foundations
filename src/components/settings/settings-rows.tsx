import { Card } from "@/components/ui/card";

/** Ligne libellé / valeur réutilisée par toutes les sections de configuration. */
export function SettingRow({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="flex flex-col gap-1 border-b border-border py-3 last:border-b-0 @lg:flex-row @lg:items-center @lg:justify-between @lg:gap-4">
      <div className="min-w-0">
        <p className="text-[14px] text-foreground">{label}</p>
        {hint ? <p className="text-[12px] text-muted-foreground">{hint}</p> : null}
      </div>
      <div className="flex flex-wrap items-center gap-2 text-[14px] text-muted-foreground @lg:justify-end">
        {children}
      </div>
    </div>
  );
}

export function SettingsCard({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Card className="@container min-w-0 border-border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[14px] font-medium text-foreground">{title}</p>
        {action}
      </div>
      <div className="mt-2">{children}</div>
    </Card>
  );
}