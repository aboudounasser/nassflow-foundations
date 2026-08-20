import { AtSign, ChevronDown, CircleCheck, Phone, ScrollText, Send } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { useSession } from "@/components/providers/session-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { confidenceVariant, formatConfidence, formatScanDateTime } from "@/lib/scans/meta";
import { usePushToCrm } from "@/lib/scans/queries";
import type { RunResult } from "@/lib/scans/types";
import { cn } from "@/lib/utils";

/** Rôles acceptés par l'Edge Function `push-to-hubspot`. */
const CRM_ROLES = ["owner", "admin"];

const NO_EMAIL_HINT =
  "Aucune adresse e-mail n'a été extraite de ce message : il n'y a rien à envoyer au CRM.";

const CRM_FALLBACK_ERROR = "L'envoi vers le CRM n'a pas abouti.";

function TraceRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 @md:grid-cols-[140px_minmax(0,1fr)]">
      <dt className="text-[12px] text-muted-foreground">{label}</dt>
      <dd className="text-[12px] break-words text-foreground">{value}</dd>
    </div>
  );
}

/**
 * Un prospect extrait, avec sa trace.
 *
 * La trace n'est pas un repli technique : elle est la démonstration du produit.
 * L'expéditeur réel du message et le nom extrait sont affichés tous les deux,
 * précisément parce qu'ils diffèrent souvent — c'est ce qui montre que l'agent
 * a lu la signature plutôt que recopié l'en-tête.
 *
 * L'envoi vers le CRM n'est proposé qu'aux rôles que l'Edge Function accepte —
 * la vérification faisant autorité reste côté serveur — et disparaît une fois
 * fait : une action déjà accomplie n'a plus à être offerte, fût-ce désactivée.
 */
export function RunResultCard({ result }: { result: RunResult }) {
  const [open, setOpen] = useState(false);
  const { session } = useSession();
  const pushMutation = usePushToCrm();
  const { extracted } = result;

  const title = extracted.name ?? extracted.company ?? "Contact non identifié";
  const subtitle = extracted.name && extracted.company ? extracted.company : null;

  const canPush = CRM_ROLES.includes(session.role);
  const missingEmail = extracted.email === null;

  const push = () => {
    pushMutation.mutate(result.id, {
      onSuccess: (outcome) => {
        // Contact bien créé mais trace non écrite : l'avertissement prime sur le
        // succès, sans quoi la carte semblerait figée sans raison.
        if (outcome.warning) {
          toast.warning(outcome.warning);
          return;
        }
        if (outcome.action === "created") {
          toast.success(`${title} a été créé dans HubSpot`);
        } else if (outcome.action === "updated") {
          toast.success(`${title} existait déjà, sa fiche a été complétée`);
        } else {
          toast.success(`${title} a été envoyé dans HubSpot`);
        }
      },
      // Les corps 403 / 404 / 409 / 422 / 502 portent un message rédigé pour
      // l'utilisateur : il est affiché tel quel.
      onError: (e) => toast.error(e instanceof Error ? e.message : CRM_FALLBACK_ERROR),
    });
  };

  return (
    <li className="rounded-lg border border-border bg-surface p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-[14px] font-medium text-foreground">{title}</p>
          {subtitle ? (
            <p className="truncate text-[12px] text-muted-foreground">{subtitle}</p>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Badge variant={confidenceVariant(result.confidence)}>
            {formatConfidence(result.confidence)}
          </Badge>
          {canPush ? (
            result.pushedToCrmAt !== null ? (
              <Badge title={`Envoyé le ${formatScanDateTime(result.pushedToCrmAt)}`}>
                <CircleCheck aria-hidden="true" />
                Dans le CRM
              </Badge>
            ) : (
              // `disabled:pointer-events-none` neutralise le survol du bouton :
              // l'infobulle est portée par l'enveloppe, sinon elle ne
              // s'afficherait jamais — or elle doit être lue avant le clic.
              <span className="inline-flex" title={missingEmail ? NO_EMAIL_HINT : undefined}>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  loading={pushMutation.isPending}
                  disabled={missingEmail}
                  onClick={push}
                >
                  <Send aria-hidden="true" />
                  Envoyer dans le CRM
                </Button>
              </span>
            )
          ) : null}
        </div>
      </div>

      {extracted.email || extracted.phone ? (
        <div className="mt-2 flex flex-wrap items-center gap-3">
          {extracted.email ? (
            <span className="flex min-w-0 items-center gap-1 text-[12px] text-muted-foreground">
              <AtSign className="size-5 shrink-0" aria-hidden="true" />
              <span className="truncate">{extracted.email}</span>
            </span>
          ) : null}
          {extracted.phone ? (
            <span className="flex min-w-0 items-center gap-1 text-[12px] text-muted-foreground">
              <Phone className="size-5 shrink-0" aria-hidden="true" />
              <span className="truncate">{extracted.phone}</span>
            </span>
          ) : null}
        </div>
      ) : null}

      {extracted.request ? (
        <p className="mt-2 text-[14px] text-foreground">{extracted.request}</p>
      ) : (
        <p className="mt-2 text-[14px] text-muted-foreground">
          Demande non reformulée par l'agent.
        </p>
      )}

      <Collapsible open={open} onOpenChange={setOpen} className="mt-2">
        <CollapsibleTrigger className="flex h-11 cursor-pointer items-center gap-1 rounded-lg text-[12px] font-medium text-primary transition-colors duration-150 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background">
          <ScrollText className="size-5 shrink-0" aria-hidden="true" />
          Voir la trace
          {/* Radix pose `data-state` sur le déclencheur, pas sur ses enfants :
              la rotation suit l'état React plutôt qu'un sélecteur d'attribut. */}
          <ChevronDown
            className={cn(
              "size-5 shrink-0 transition-transform duration-150",
              open && "rotate-180",
            )}
            aria-hidden="true"
          />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <dl className="@container grid gap-2 rounded-lg border border-border bg-card p-3">
            <TraceRow label="Objet du message" value={result.sourceSubject ?? "—"} />
            <TraceRow label="Expéditeur réel" value={result.sourceFrom ?? "—"} />
            <TraceRow label="Reçu le" value={formatScanDateTime(result.sourceDate)} />
            <TraceRow label="Raisonnement" value={result.reasoning ?? "—"} />
          </dl>
        </CollapsibleContent>
      </Collapsible>
    </li>
  );
}
