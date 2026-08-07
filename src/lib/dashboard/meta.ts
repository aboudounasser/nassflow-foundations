import type { Priority } from "./types";

export const PRIORITY_BADGE: Record<
  Priority,
  { label: string; variant: "neutral" | "info" | "warning" | "destructive" }
> = {
  low: { label: "Basse", variant: "neutral" },
  medium: { label: "Moyenne", variant: "info" },
  high: { label: "Haute", variant: "warning" },
  critical: { label: "Critique", variant: "destructive" },
};