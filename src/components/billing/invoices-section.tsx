import { Download, ReceiptText } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { EmptyState } from "@/components/common/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatEuro } from "@/lib/billing/aggregations";
import { invoicesMock } from "@/lib/billing/mocks";
import type { InvoiceStatus } from "@/lib/billing/types";

const STATUS: Record<
  InvoiceStatus,
  { label: string; variant: "success" | "warning" | "destructive" }
> = {
  paid: { label: "Payée", variant: "success" },
  pending: { label: "En attente", variant: "warning" },
  failed: { label: "Échec", variant: "destructive" },
};

const STATUS_ORDER: InvoiceStatus[] = ["paid", "pending", "failed"];

const DATE_FMT = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "Europe/Paris",
});

export function InvoicesSection() {
  const [statuses, setStatuses] = useState<InvoiceStatus[]>([]);

  const sorted = useMemo(
    () => [...invoicesMock].sort((a, b) => b.issuedAt.localeCompare(a.issuedAt)),
    [],
  );
  const filtered = useMemo(
    () => sorted.filter((i) => statuses.length === 0 || statuses.includes(i.status)),
    [sorted, statuses],
  );

  const reset = () => setStatuses([]);

  return (
    <Card className="min-w-0 border-border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[14px] font-medium text-foreground">Factures</p>
        <div className="flex flex-wrap gap-2">
          {STATUS_ORDER.map((status) => {
            const active = statuses.includes(status);
            return (
              <Button
                key={status}
                type="button"
                size="sm"
                variant={active ? "secondary" : "ghost"}
                aria-pressed={active}
                onClick={() =>
                  setStatuses((prev) =>
                    prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status],
                  )
                }
              >
                {STATUS[status].label}
              </Button>
            );
          })}
          {statuses.length > 0 ? (
            <Button type="button" size="sm" variant="ghost" onClick={reset}>
              Réinitialiser
            </Button>
          ) : null}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="mt-2">
          <EmptyState
            icon={ReceiptText}
            title="Aucune facture pour ce filtre"
            description="Modifiez ou réinitialisez les filtres pour afficher les factures."
          />
          <div className="flex justify-center">
            <Button type="button" size="sm" variant="secondary" onClick={reset}>
              Réinitialiser les filtres
            </Button>
          </div>
        </div>
      ) : (
        <ul className="mt-4 flex flex-col gap-2">
          {filtered.map((invoice) => {
            const meta = STATUS[invoice.status];
            return (
              <li
                key={invoice.id}
                className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4 @2xl:flex-row @2xl:items-center @2xl:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[14px] text-foreground">{invoice.number}</p>
                    <Badge variant={meta.variant}>{meta.label}</Badge>
                  </div>
                  <p className="mt-1 text-[12px] text-muted-foreground">
                    Période du {DATE_FMT.format(new Date(invoice.periodStart))} au{" "}
                    {DATE_FMT.format(new Date(invoice.periodEnd))} · Échéance{" "}
                    {DATE_FMT.format(new Date(invoice.dueAt))}
                  </p>
                </div>
                <div className="flex items-center justify-between gap-3 @2xl:justify-end">
                  <p className="text-[16px] font-medium tabular-nums text-foreground">
                    {formatEuro(invoice.amount)}
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => toast("Facture téléchargée (mock)")}
                  >
                    <Download aria-hidden="true" />
                    Télécharger
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}