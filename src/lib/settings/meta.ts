import { AUTONOMY_LEVEL, VALIDATION_THRESHOLD } from "@/lib/agents/meta";

import type { DisplaySettings } from "./types";

export { AUTONOMY_LEVEL, VALIDATION_THRESHOLD };

export const THEME_OPTIONS: {
  value: DisplaySettings["theme"];
  label: string;
  available: boolean;
}[] = [
  { value: "dark", label: "Sombre", available: true },
  { value: "light", label: "Clair", available: false },
  { value: "system", label: "Système", available: false },
];

export const DENSITY_LABEL: Record<DisplaySettings["density"], string> = {
  comfortable: "Confortable",
  compact: "Compacte",
};

export const FIRST_DAY_LABEL: Record<DisplaySettings["firstDayOfWeek"], string> = {
  monday: "Lundi",
  sunday: "Dimanche",
};

export const READ_ONLY_NOTICE = "Lecture seule — l'édition arrivera dans une prochaine itération";

const DATE_FMT = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Paris",
});

export function formatSettingsDate(iso: string | null): string {
  if (!iso) return "Jamais utilisée";
  return DATE_FMT.format(new Date(iso));
}