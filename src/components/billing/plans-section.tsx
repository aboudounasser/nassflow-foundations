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
import { Skeleton } from "@/components/ui/skeleton";
import { formatPlanPrice, planCta, showsMonthlySuffix } from "@/lib/billing/aggregations";
import { useBillingPlans } from "@/lib/billing/queries";
import type { BillingPlan, PlanCta } from "@/lib/billing/types";
import { cn } from "@/lib/utils";

const CTA: Record<PlanCta, { label: string; variant: "primary" | "secondary" }> = {
  current: { label: "Plan actuel", variant: "secondary" },
  upgrade: { label: "Passer à ce plan", variant: "primary" },
  downgrade: { label: "Choisir ce plan", variant: "secondary" },
  contact_sales: { label: "Contacter l'équipe commerciale", variant: "secondary" },
};

export function PlansSection() {
  const [target, setTarget] = useState<BillingPlan | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const { data: plans, isPending } = useBillingPlans();

  const current = plans?.find((p) => p.isCurrent) ?? plans?.at(-1);
  const targetCta = target && current ? planCta(target, current) : null;
  const isDowngrade = targetCta === "downgrade";

  const agentsLabel =
    target?.limits.agents === null
      ? "un nombre illimité d'agents"
      : `${target?.limits.agents} agent${(target?.limits.agents ?? 0) > 1 ? "s" : ""}`;

  const missionsLabel =
    target?.limits.missionsPerMonth === null
      ? "un nombre illimité de missions par mois"
      : `${target?.limits.missionsPerMonth} missions par mois`;

  if (isPending) {
    return (
      <div className="grid min-w-0 gap-4 @3xl:grid-cols-2 @6xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[420px] rounded-xl" />
        ))}
      </div>
    );
  }

  if (!plans || !current) return null;

  return (
    <>
      <div className="grid min-w-0 gap-4 @3xl:grid-cols-2 @6xl:grid-cols-4">
        {plans.map((plan) => {
          const ctaType = planCta(plan, current);
          const cta = CTA[ctaType];
          return (
            <Card
              key={plan.id}
              className={cn(
                "flex min-w-0 flex-col border-border bg-card p-5",
                (plan.isCurrent || plan.isRecommended) && "border-primary",
              )}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-[16px] font-medium text-foreground">{plan.name}</p>
                {plan.isCurrent ? (
                  <Badge variant="primary">Plan actuel</Badge>
                ) : plan.isRecommended ? (
                  <Badge variant="primary">Recommandé</Badge>
                ) : null}
              </div>
              <p className="mt-1 text-[12px] text-muted-foreground">{plan.tagline}</p>
              <p className="mt-3 text-[24px] font-bold tabular-nums text-foreground">
                {formatPlanPrice(plan)}
                {showsMonthlySuffix(plan) ? (
                  <span className="text-[12px] font-normal text-muted-foreground"> / mois</span>
                ) : null}
              </p>
              <p className="mt-2 text-[12px] text-muted-foreground">
                {plan.limits.aiCalls.toLocaleString("fr-FR")} appels IA · {plan.limits.seats}{" "}
                {plan.limits.seats > 1 ? "sièges" : "siège"}
              </p>
              <ul className="mt-4 flex flex-1 flex-col gap-2">
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-2 text-[12px] text-muted-foreground"
                  >
                    <Check className="mt-0.5 size-3.5 shrink-0 text-primary" aria-hidden="true" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Button
                type="button"
                className="mt-5 w-full"
                variant={cta.variant}
                disabled={ctaType === "current"}
                onClick={() =>
                  ctaType === "contact_sales"
                    ? toast("Demande de contact envoyée (mock)")
                    : setTarget(plan)
                }
              >
                {cta.label}
              </Button>
              <p className="mt-2 min-h-[16px] text-center text-[11px] text-muted-foreground">
                {plan.trialDays !== null
                  ? `${plan.trialDays} jours d'essai, sans carte bancaire`
                  : null}
              </p>
            </Card>
          );
        })}
      </div>

      <Card className="mt-6 border-border bg-card p-5">
        <p className="text-[14px] font-medium text-foreground">Résilier l'abonnement</p>
        <p className="mt-2 text-[12px] text-muted-foreground">
          L'accès à NASSFLOW OS resterait actif jusqu'à la fin de la période facturée en cours. Les
          données de l'organisation seraient conservées 90 jours avant suppression définitive.
        </p>
        <Button
          type="button"
          variant="destructive"
          size="sm"
          className="mt-4"
          onClick={() => setCancelOpen(true)}
        >
          Résilier l'abonnement
        </Button>
      </Card>

      <AlertDialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Résilier l'abonnement ?</AlertDialogTitle>
            <AlertDialogDescription>
              L'abonnement prendrait fin à l'issue de la période facturée en cours. Cette action est
              simulée à ce stade et ne modifie aucune donnée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={() => toast("Résiliation programmée (mock)")}>
              Confirmer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={target !== null} onOpenChange={(open) => !open && setTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Passer au plan {target?.name} ?</AlertDialogTitle>
            <AlertDialogDescription>
              {isDowngrade && target
                ? `Votre organisation perdrait les fonctionnalités du plan ${current.name} et serait limitée à ${agentsLabel} et ${missionsLabel}. Cette action est simulée à ce stade.`
                : "Le changement de plan modifierait la facturation et les quotas de l'organisation. Cette action est simulée à ce stade et ne modifie aucune donnée."}
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
