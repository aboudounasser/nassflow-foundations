import { Lock } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { securityPoliciesMock } from "@/lib/security/mocks";

/** Politiques de sécurité — lecture seule. */
export function PoliciesSection() {
  return (
    <Card className="min-w-0 border-border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[14px] font-medium text-foreground">Politiques de sécurité</p>
        <Badge variant="neutral">
          <Lock aria-hidden="true" />
          Lecture seule — l'édition arrivera dans une prochaine itération
        </Badge>
      </div>

      <ul className="mt-4 grid gap-3 @3xl:grid-cols-2">
        {securityPoliciesMock.map((policy) => (
          <li key={policy.id} className="rounded-lg border border-border bg-surface p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-[14px] text-foreground">{policy.label}</p>
              <Badge variant="primary">{policy.value}</Badge>
            </div>
            <p className="mt-1 text-[12px] leading-4 text-muted-foreground">{policy.description}</p>
            {policy.items ? (
              <ul className="mt-2 space-y-1">
                {policy.items.map((item) => (
                  <li key={item} className="text-[12px] text-muted-foreground">
                    • {item}
                  </li>
                ))}
              </ul>
            ) : null}
          </li>
        ))}
      </ul>
    </Card>
  );
}