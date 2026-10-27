import { Link } from "@tanstack/react-router";
import { Copy, Loader2, RefreshCw, TriangleAlert } from "lucide-react";
import { useEffect, useRef } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { NAME_PLACEHOLDER } from "@/lib/inbox/meta";
import { useGenerateReplyDraft, useLatestDraft } from "@/lib/inbox/queries";
import { formatScanDateTime } from "@/lib/scans/meta";

const GENERATE_FALLBACK_ERROR = "La proposition de réponse n'a pas pu être générée.";

/**
 * Proposition de réponse d'un message, dépliée sous sa carte.
 *
 * Ouvrir le panneau affiche la dernière proposition conservée ; s'il n'y en a
 * pas, une seule est demandée automatiquement — le clic sur « Proposer une
 * réponse » en exprimait déjà l'intention. « Régénérer » en demande une autre,
 * payée elle aussi sur le budget du jour de la boîte.
 *
 * Rien n'est envoyé : l'utilisateur copie le texte et répond depuis Gmail.
 */
export function ReplyDraftPanel({ messageId }: { messageId: string }) {
  const draftQuery = useLatestDraft(messageId, true);
  const generateMutation = useGenerateReplyDraft(messageId);
  const requested = useRef(false);

  const generate = () => {
    requested.current = true;
    generateMutation.mutate(undefined, {
      // Budget atteint, Gmail à reconnecter, double clic : messages rédigés
      // pour l'utilisateur, affichés tels quels.
      onError: (e) => toast.error(e instanceof Error ? e.message : GENERATE_FALLBACK_ERROR),
    });
  };

  const noStoredDraft = draftQuery.isSuccess && draftQuery.data === null;
  useEffect(() => {
    if (noStoredDraft && !requested.current) generate();
    // `generate` change à chaque rendu ; la garde `requested` suffit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [noStoredDraft]);

  const draft = draftQuery.data ?? null;

  const copy = async () => {
    if (!draft) return;
    try {
      await navigator.clipboard.writeText(draft.body);
      toast.success("Réponse copiée. Collez-la dans Gmail après relecture.");
    } catch {
      toast.error("Copie impossible : sélectionnez le texte et copiez-le à la main.");
    }
  };

  if (draftQuery.isPending || (generateMutation.isPending && !draft)) {
    return (
      <div
        className="mt-3 flex flex-col gap-2 rounded-lg border border-border bg-card p-3"
        role="status"
      >
        <p className="flex items-center gap-2 text-[12px] text-muted-foreground">
          <Loader2 className="size-5 shrink-0 animate-spin" aria-hidden="true" />
          {generateMutation.isPending ? "Rédaction de la proposition…" : "Chargement…"}
        </p>
        <Skeleton className="h-24 w-full rounded-lg" />
      </div>
    );
  }

  if (draftQuery.isError) {
    return (
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-card p-3">
        <p className="text-[14px] text-muted-foreground">La proposition n'a pas pu être chargée.</p>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={() => void draftQuery.refetch()}
        >
          Réessayer
        </Button>
      </div>
    );
  }

  if (!draft) {
    // Génération refusée (budget, Gmail inactif…) : le toast a donné la raison.
    return (
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-card p-3">
        <p className="text-[14px] text-muted-foreground">Aucune proposition pour ce message.</p>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          loading={generateMutation.isPending}
          onClick={generate}
        >
          <RefreshCw />
          Réessayer
        </Button>
      </div>
    );
  }

  const unsigned = draft.body.includes(NAME_PLACEHOLDER);

  return (
    <div className="mt-3 flex flex-col gap-3 rounded-lg border border-border bg-card p-3">
      <p className="flex items-start gap-2 text-[12px] text-muted-foreground">
        <TriangleAlert className="size-5 shrink-0 text-warning" aria-hidden="true" />
        Proposition rédigée par l'IA le {formatScanDateTime(draft.createdAt)}. Relisez-la et
        complétez les champs entre crochets avant de l'envoyer : rien n'est envoyé automatiquement.
      </p>

      <p className="text-[14px] leading-6 break-words whitespace-pre-wrap text-foreground">
        {draft.body}
      </p>

      {draft.missingInfo.length > 0 ? (
        <div className="space-y-1">
          <p className="text-[12px] text-muted-foreground">À compléter avant envoi</p>
          <ul className="list-disc space-y-1 pl-5 text-[14px] text-foreground">
            {draft.missingInfo.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {unsigned ? (
        <p className="text-[12px] text-muted-foreground">
          Votre nom n'est pas renseigné : il apparaît comme « {NAME_PLACEHOLDER} ».{" "}
          <Link to="/account" className="text-primary underline-offset-4 hover:underline">
            Complétez votre profil
          </Link>{" "}
          pour signer vos réponses.
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" size="sm" onClick={() => void copy()}>
          <Copy />
          Copier
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          loading={generateMutation.isPending}
          disabled={generateMutation.isPending}
          onClick={generate}
        >
          <RefreshCw />
          Régénérer
        </Button>
      </div>
    </div>
  );
}
