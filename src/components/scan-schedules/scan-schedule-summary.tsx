import { Link } from "@tanstack/react-router";
import { CalendarClock } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { Connection } from "@/lib/integrations-oauth/types";
import { describeScheduleStatus, isSuspended } from "@/lib/scan-schedules/meta";
import { useScanSchedule } from "@/lib/scan-schedules/queries";
import { cn } from "@/lib/utils";

/**
 * Résumé d'une ligne de l'analyse automatique, sous une boîte Gmail de
 * l'Integrations Hub. Les réglages eux-mêmes vivent sur la fiche Sales Agent :
 * un seul endroit où les modifier.
 *
 * À ne monter que pour les owner et admin. Rien n'est affiché tant que la
 * ligne n'est pas lue, ni si elle est illisible : ce n'est qu'un raccourci.
 */
export function ScanScheduleSummary({ connection }: { connection: Connection }) {
  const scheduleQuery = useScanSchedule(connection.id);
  const schedule = scheduleQuery.data ?? null;
  if (!schedule) return null;

  return (
    <div className="flex basis-full flex-wrap items-center justify-between gap-2 border-t border-border pt-2">
      <p
        className={cn(
          "flex min-w-0 items-center gap-2 text-[12px]",
          isSuspended(schedule) ? "text-destructive" : "text-muted-foreground",
        )}
      >
        <CalendarClock className="size-5 shrink-0" aria-hidden="true" />
        <span>{describeScheduleStatus(schedule)}</span>
      </p>
      <Button asChild size="sm" variant="ghost">
        <Link to="/agents/$agentId" params={{ agentId: "a-sales" }}>
          Régler l'analyse automatique
        </Link>
      </Button>
    </div>
  );
}
