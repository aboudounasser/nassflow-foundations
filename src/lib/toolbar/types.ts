import type { LucideIcon } from "lucide-react";

export type ToolbarOption = {
  value: string;
  label: string;
  /** Compteur optionnel affiché à droite de l'option. */
  count?: number;
};

export type FilterDescriptor =
  | {
      kind: "select";
      key: string;
      ariaLabel: string;
      placeholder: string;
      allLabel: string;
      width?: string;
      options: ToolbarOption[];
    }
  | {
      kind: "multiselect";
      key: string;
      ariaLabel: string;
      buttonLabel: string;
      options: ToolbarOption[];
    }
  | {
      kind: "sort";
      key: string;
      ariaLabel: string;
      width?: string;
      options: ToolbarOption[];
    };

export type ViewDescriptor = {
  value: string;
  label: string;
  icon: LucideIcon;
};
