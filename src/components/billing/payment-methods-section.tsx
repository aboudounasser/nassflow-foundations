import { Banknote, CreditCard, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { paymentMethodsMock } from "@/lib/billing/mocks";
import type { PaymentMethod } from "@/lib/billing/types";

const DATE_FMT = new Intl.DateTimeFormat("fr-FR", {
  month: "2-digit",
  year: "numeric",
  timeZone: "Europe/Paris",
});

export function PaymentMethodsSection() {
  const [target, setTarget] = useState<PaymentMethod | null>(null);

  return (
    <>
      <Card className="min-w-0 border-border bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[14px] font-medium text-foreground">Moyens de paiement</p>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => toast("Moyen de paiement ajouté (mock)")}
          >
            <Plus aria-hidden="true" />
            Ajouter un moyen de paiement
          </Button>
        </div>

        <ul className="mt-4 flex flex-col gap-2">
          {paymentMethodsMock.map((method) => {
            const Icon = method.type === "card" ? CreditCard : Banknote;
            return (
              <li
                key={method.id}
                className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4 @2xl:flex-row @2xl:items-center @2xl:justify-between"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-card">
                    <Icon className="size-4 text-muted-foreground" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-[14px] text-foreground">{method.label}</p>
                      {method.isDefault ? <Badge variant="primary">Par défaut</Badge> : null}
                    </div>
                    <p className="mt-1 text-[12px] text-muted-foreground">
                      {method.type === "card" ? "Carte bancaire" : "Prélèvement SEPA"}
                      {method.expiresAt
                        ? ` · Expire ${DATE_FMT.format(new Date(method.expiresAt))}`
                        : " · Sans expiration"}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {method.isDefault ? null : (
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => toast(`${method.label} défini par défaut (mock)`)}
                    >
                      Définir par défaut
                    </Button>
                  )}
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => setTarget(method)}
                  >
                    Supprimer
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      </Card>

      <AlertDialog open={target !== null} onOpenChange={(open) => !open && setTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer {target?.label} ?</AlertDialogTitle>
            <AlertDialogDescription>
              Ce moyen de paiement ne serait plus utilisable pour les prochaines factures. Cette
              action est simulée à ce stade et ne modifie aucune donnée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={() => toast(`${target?.label} supprimé (mock)`)}>
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}