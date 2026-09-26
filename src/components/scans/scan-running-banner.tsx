import { Loader2 } from "lucide-react";

/**
 * Bandeau d'attente. L'appel à `run-gmail-scan` dure 30 à 60 secondes sans
 * étape intermédiaire : sans ce message, l'utilisateur reste devant une
 * interface immobile et conclut à une panne.
 */
export function RunningBanner() {
  return (
    <div
      className="mb-3 flex items-start gap-2 rounded-lg border border-info/30 bg-info/10 p-3"
      role="status"
      aria-live="polite"
    >
      <Loader2 className="size-5 shrink-0 animate-spin text-info" aria-hidden="true" />
      <div className="min-w-0">
        <p className="text-[14px] text-foreground">
          Analyse en cours, cela peut prendre une minute.
        </p>
        <p className="text-[12px] text-muted-foreground">
          L'agent lit vos 50 derniers messages un par un, puis rédige une fiche pour chaque demande
          qu'il identifie. Vous pouvez quitter cette page, l'analyse se poursuit.
        </p>
      </div>
    </div>
  );
}
