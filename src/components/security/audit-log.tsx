import { ScrollText } from "lucide-react";
import { useMemo, useState } from "react";

import { EmptyState } from "@/components/common/empty-state";
import { SecurityEventItem } from "@/components/security/security-event-item";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  EVENT_SEVERITY,
  EVENT_SEVERITY_ORDER,
  EVENT_SOURCE,
  EVENT_SOURCE_ORDER,
} from "@/lib/security/meta";
import type { SecurityEvent, SecurityEventSeverity, SecurityEventSource } from "@/lib/security/types";

/** Journal d'audit complet avec filtres sévérité + source (multi-sélection). */
export function AuditLog({ events }: { events: SecurityEvent[] }) {
  const [severities, setSeverities] = useState<SecurityEventSeverity[]>([]);
  const [sources, setSources] = useState<SecurityEventSource[]>([]);

  const filtered = useMemo(
    () =>
      events.filter(
        (e) =>
          (severities.length === 0 || severities.includes(e.severity)) &&
          (sources.length === 0 || sources.includes(e.source)),
      ),
    [events, severities, sources],
  );

  const reset = () => {
    setSeverities([]);
    setSources([]);
  };

  return (
    <Card className="min-w-0 border-border bg-card p-4">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-2">
          {EVENT_SEVERITY_ORDER.map((severity) => {
            const meta = EVENT_SEVERITY[severity];
            const Icon = meta.icon;
            const active = severities.includes(severity);
            return (
              <Button
                key={severity}
                type="button"
                size="sm"
                variant={active ? "secondary" : "ghost"}
                aria-pressed={active}
                onClick={() =>
                  setSeverities((prev) =>
                    prev.includes(severity)
                      ? prev.filter((s) => s !== severity)
                      : [...prev, severity],
                  )
                }
              >
                <Icon aria-hidden="true" />
                {meta.label}
              </Button>
            );
          })}
        </div>
        <div className="flex flex-wrap gap-2">
          {EVENT_SOURCE_ORDER.map((source) => {
            const meta = EVENT_SOURCE[source];
            const Icon = meta.icon;
            const active = sources.includes(source);
            return (
              <Button
                key={source}
                type="button"
                size="sm"
                variant={active ? "secondary" : "ghost"}
                aria-pressed={active}
                onClick={() =>
                  setSources((prev) =>
                    prev.includes(source) ? prev.filter((s) => s !== source) : [...prev, source],
                  )
                }
              >
                <Icon aria-hidden="true" />
                {meta.label}
              </Button>
            );
          })}
          {severities.length > 0 || sources.length > 0 ? (
            <Button type="button" size="sm" variant="ghost" onClick={reset}>
              Réinitialiser
            </Button>
          ) : null}
        </div>
      </div>

      <p className="mt-4 text-[12px] text-muted-foreground">
        {filtered.length} événement{filtered.length > 1 ? "s" : ""} sur {events.length}
      </p>

      {filtered.length === 0 ? (
        <div className="mt-2">
          <EmptyState
            icon={ScrollText}
            title="Aucun événement pour ce filtre"
            description="Modifiez ou réinitialisez les filtres pour afficher le journal."
          />
          <div className="flex justify-center">
            <Button type="button" size="sm" variant="secondary" onClick={reset}>
              Réinitialiser les filtres
            </Button>
          </div>
        </div>
      ) : (
        <ul className="mt-3 flex flex-col gap-2">
          {filtered.map((event) => (
            <SecurityEventItem key={event.id} event={event} />
          ))}
        </ul>
      )}
    </Card>
  );
}