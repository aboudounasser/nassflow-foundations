import * as React from "react";
import { Eye, EyeOff, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** NASSFLOW OS Input — height 44px, radius 12px. */
export interface InputProps extends React.ComponentProps<"input"> {
  invalid?: boolean;
  success?: boolean;
}

const inputBase =
  "flex h-11 w-full rounded-lg border border-border bg-card px-4 text-[14px] text-foreground transition-colors duration-150 placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-50";

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, invalid, success, ...props }, ref) => (
    <input
      type={type}
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(
        inputBase,
        invalid && "border-destructive focus-visible:border-destructive",
        success && "border-success focus-visible:border-success",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";

/**
 * Champ de recherche avec icône à gauche.
 *
 * ⚠️ L'échelle de spacing est redéfinie dans styles.css (grille 8px) : les
 * classes ne valent pas leur valeur Tailwind habituelle. Géométrie mesurée
 * dans le CSS généré, à ne pas « corriger » de mémoire :
 *   left-4 = 32px  (l'icône occupe l'inset de texte natif de Input, px-4 = 32px)
 *   size-5 = 20px  (clé non redéfinie → base 4px ; c'est la taille d'icône du DS)
 *   → l'icône s'arrête à 52px, pl-8 = 64px laisse 12px avant le texte.
 */
const SearchInput = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => (
    <div className="relative w-full">
      <Search
        className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground"
        aria-hidden="true"
      />
      <Input ref={ref} type="search" className={cn("pl-8", className)} {...props} />
    </div>
  ),
);
SearchInput.displayName = "SearchInput";

/**
 * Champ mot de passe avec bascule d'affichage.
 * Chaque instance porte son propre état : afficher un champ n'affiche jamais
 * le champ de confirmation voisin. Le bouton est retiré de l'ordre de
 * tabulation (tabIndex={-1}) pour ne pas s'intercaler entre deux champs.
 */
const PasswordInput = React.forwardRef<HTMLInputElement, Omit<InputProps, "type">>(
  ({ className, disabled, ...props }, ref) => {
    const [visible, setVisible] = React.useState(false);
    const ToggleIcon = visible ? EyeOff : Eye;

    return (
      <div className="relative w-full">
        <Input
          ref={ref}
          type={visible ? "text" : "password"}
          disabled={disabled}
          className={cn("pr-14", className)}
          {...props}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          tabIndex={-1}
          disabled={disabled}
          aria-label={visible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
          aria-pressed={visible}
          onClick={() => setVisible((v) => !v)}
          className="absolute right-1 top-1/2 size-9 -translate-y-1/2"
        >
          <ToggleIcon aria-hidden="true" />
        </Button>
      </div>
    );
  },
);
PasswordInput.displayName = "PasswordInput";

export { Input, SearchInput, PasswordInput, inputBase };
