import { Check } from "lucide-react";
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
import { formatEuro } from "@/lib/billing/aggregations";
import { billingPlansMock } from "@/lib/billing/mocks";
import type { BillingPlan } from "@/lib/billing/types";
import { cn } from "@/lib/utils";

export function PlansSection() {
  const [target, setTarget] = useState<BillingPlan | null>(null);

  return (
    <>
      <div className="grid min-w-0 gap-4 @3xl:grid-cols-3">
        {billingPlansMock.map((plan) => (
          <Card
            key={plan.id}
            className={cn(
              "flex min-w-0 flex-col border-border bg-card p-5",
              plan.isCurrent && "border-primary",
            )}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-[16px] font-medium text-foreground">{plan.name}</p>
              {plan.isCurrent ? <Badge variant="primary">Plan actuel</Badge> : null}
            </div>
            <p className="mt-3 text-[24px] font-bold tabular-nums text-foreground">
              {formatEuro(plan.pricePerMonth, 0)}
              <span className="text-[12px] font-normal text-muted-foreground"> / mois</span>
            </p>
            <p className="mt-2 text-[12px] text-muted-foreground">
              {plan.includedAiCalls.toLocaleString("fr-FR")} appels IA inclus ·{" "}
              {plan.includedSeats} sièges
            </p>
            <ul className="mt-4 flex flex-1 flex-col gap-2">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-[12px] text-muted-foreground">
                  <Check className="mt-0.5 size-3.5 shrink-0 text-primary" aria-hidden="true" />
                  {feature}
                </li>
              ))}
            </ul>
            <Button
              type="button"
              className="mt-5 w-full"
              variant={plan.isCurrent ? "secondary" : "primary"}
              disabled={plan.isCurrent}
              onClick={() => setTarget(plan)}
            >
              {plan.isCurrent ? "Plan actuel" : "Changer de plan"}
            </Button>
          </Card>
        ))}
      </div>

      <AlertDialog open={target !== null} onOpenChange={(open) => !open && setTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Passer au plan {target?.name} ?</AlertDialogTitle>
            <AlertDialogDescription>
              Le changement de plan modifierait la facturation et les quotas de l'organisation.
              Cette action est simulée à ce stade et ne modifie aucune donnée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={() => toast(`Passage au plan ${target?.name} (mock)`)}>
              Confirmer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}