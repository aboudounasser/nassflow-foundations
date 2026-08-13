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
      /**
       * Largeur *plancher* du trigger (classe `min-w-[…]`), pas une largeur fixe :
       * le trigger se dimensionne au contenu et déborde sur la ligne suivante
       * plutôt que de tronquer le libellé. Sert à aligner visuellement les filtres.
       */
      minWidth?: string;
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
      /** Voir `minWidth` du variant "select". */
      minWidth?: string;
      options: ToolbarOption[];
    };

export type ViewDescriptor = {
  value: string;
  label: string;
  icon: LucideIcon;
};
