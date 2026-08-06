/** Correspondance variantes de badge → jetons de couleur du design system. */
export const VARIANT_COLOR: Record<string, string> = {
  neutral: "var(--color-muted-foreground)",
  primary: "var(--color-primary)",
  success: "var(--color-success)",
  warning: "var(--color-warning)",
  destructive: "var(--color-destructive)",
  info: "var(--color-info)",
};

export const euroCompact = (v: number) =>
  v >= 1000
    ? `${(v / 1000).toLocaleString("fr-FR", { maximumFractionDigits: 0 })} k€`
    : `${v.toLocaleString("fr-FR")} €`;

export const percentFormat = (v: number) => `${v.toLocaleString("fr-FR")} %`;

export const CHART_TOOLTIP_STYLE = {
  background: "var(--color-card)",
  border: "1px solid var(--color-border)",
  borderRadius: 12,
  fontSize: 12,
} as const;
