import { useState } from "react";
import { ChevronLeft, ChevronRight, Inbox } from "lucide-react";

import { MissionSummaryCard } from "@/components/dashboard/mission-summary-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/empty-state";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ARCHIVE_STATUSES, KANBAN_COLUMNS, MISSION_STATUS } from "@/lib/missions/meta";
import { cn } from "@/lib/utils";
import type { MissionDetail } from "@/lib/missions/types";

const PAGE_SIZE = 10;

export interface ViewProps {
  missions: MissionDetail[];
  selectedId: string | null;
  onSelect: (mission: MissionDetail) => void;
}

export function MissionListSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-[132px] w-full rounded-lg" />
      ))}
    </div>
  );
}

export function MissionKanbanSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3 xl:grid-cols-5">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="space-y-3">
          <Skeleton className="h-6 w-24 rounded-md" />
          <Skeleton className="h-24 w-full rounded-lg" />
          <Skeleton className="h-24 w-full rounded-lg" />
        </div>
      ))}
    </div>
  );
}

export function MissionListView({ missions, selectedId, onSelect }: ViewProps) {
  const [page, setPage] = useState(0);
  const pageCount = Math.max(1, Math.ceil(missions.length / PAGE_SIZE));
  const current = Math.min(page, pageCount - 1);
  const slice = missions.slice(current * PAGE_SIZE, current * PAGE_SIZE + PAGE_SIZE);

  return (
    <div className="space-y-3">
      {slice.map((mission) => (
        <MissionSummaryCard
          key={mission.id}
          mission={mission}
          selected={mission.id === selectedId}
          onSelect={(m) => onSelect(m as MissionDetail)}
        />
      ))}

      {pageCount > 1 ? (
        <div className="flex items-center justify-end gap-2 pt-2">
          <span className="text-[12px] text-muted-foreground">
            Page {current + 1} / {pageCount}
          </span>
          <Button
            variant="secondary"
            size="sm"
            disabled={current === 0}
            onClick={() => setPage(current - 1)}
          >
            <ChevronLeft />
            Précédent
          </Button>
          <Button
            variant="secondary"
            size="sm"
            disabled={current >= pageCount - 1}
            onClick={() => setPage(current + 1)}
          >
            Suivant
            <ChevronRight />
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function KanbanCards({ missions, selectedId, onSelect }: ViewProps) {
  if (missions.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border p-4 text-[12px] text-muted-foreground">
        Aucune mission
      </p>
    );
  }
  return (
    <div className="space-y-2">
      {missions.map((mission) => (
        <MissionSummaryCard
          key={mission.id}
          mission={mission}
          compact
          selected={mission.id === selectedId}
          onSelect={(m) => onSelect(m as MissionDetail)}
        />
      ))}
    </div>
  );
}

export function MissionKanbanView({ missions, selectedId, onSelect }: ViewProps) {
  const archived = missions.filter((m) => ARCHIVE_STATUSES.includes(m.status));

  return (
    <div className="space-y-4">
      <div className="-mx-1 flex snap-x gap-4 overflow-x-auto px-1 pb-2 xl:grid xl:grid-cols-5 xl:overflow-visible">
        {KANBAN_COLUMNS.map((column) => {
          const items = missions.filter((m) => column.statuses.includes(m.status));
          return (
            <section
              key={column.id}
              className="w-[280px] shrink-0 snap-start space-y-3 rounded-xl border border-border bg-surface p-3 xl:w-auto"
            >
              <header className="flex items-center justify-between gap-2">
                <h3 className="truncate text-[14px] font-medium text-foreground">{column.label}</h3>
                <Badge>{items.length}</Badge>
              </header>
              <KanbanCards missions={items} selectedId={selectedId} onSelect={onSelect} />
            </section>
          );
        })}
      </div>

      <Collapsible>
        <CollapsibleTrigger asChild>
          <Button variant="secondary" size="sm">
            Archives ({archived.length})
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-3">
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
            {archived.length === 0 ? (
              <p className="text-[12px] text-muted-foreground">Aucune mission archivée.</p>
            ) : (
              archived.map((mission) => (
                <MissionSummaryCard
                  key={mission.id}
                  mission={mission}
                  compact
                  selected={mission.id === selectedId}
                  onSelect={(m) => onSelect(m as MissionDetail)}
                />
              ))
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

const WEEKDAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const MONTH_FMT = new Intl.DateTimeFormat("fr-FR", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

export function MissionCalendarView({ missions, selectedId, onSelect }: ViewProps) {
  const [monthOffset, setMonthOffset] = useState(0);
  const base = new Date(Date.UTC(2026, 7, 1));
  const month = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth() + monthOffset, 1));
  const daysInMonth = new Date(
    Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + 1, 0),
  ).getUTCDate();
  const firstWeekday = (month.getUTCDay() + 6) % 7; // lundi = 0

  const byDay = new Map<number, MissionDetail[]>();
  for (const mission of missions) {
    const due = new Date(mission.dueDate);
    if (Number.isNaN(due.getTime())) continue;
    if (
      due.getUTCFullYear() !== month.getUTCFullYear() ||
      due.getUTCMonth() !== month.getUTCMonth()
    )
      continue;
    const day = due.getUTCDate();
    byDay.set(day, [...(byDay.get(day) ?? []), mission]);
  }

  const cells = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-[14px] font-medium capitalize text-foreground">
          {MONTH_FMT.format(month)}
        </h3>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="icon"
            aria-label="Mois précédent"
            onClick={() => setMonthOffset((v) => v - 1)}
          >
            <ChevronLeft />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            aria-label="Mois suivant"
            onClick={() => setMonthOffset((v) => v + 1)}
          >
            <ChevronRight />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[12px] text-muted-foreground">
        {WEEKDAYS.map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, index) => (
          <div
            key={index}
            className={cn(
              "min-h-[92px] rounded-lg border border-border p-1",
              day === null ? "bg-transparent" : "bg-surface",
            )}
          >
            {day === null ? null : (
              <>
                <span className="block px-1 text-[12px] tabular-nums text-muted-foreground">
                  {day}
                </span>
                <div className="mt-1 space-y-1">
                  {(byDay.get(day) ?? []).map((mission) => {
                    const status = MISSION_STATUS[mission.status];
                    return (
                      <button
                        key={mission.id}
                        type="button"
                        onClick={() => onSelect(mission)}
                        aria-pressed={mission.id === selectedId}
                        className={cn(
                          "block w-full truncate rounded-md border px-1.5 py-1 text-left text-[12px] transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                          mission.id === selectedId
                            ? "border-primary bg-primary/10 text-foreground"
                            : "border-border text-muted-foreground",
                        )}
                        title={`${mission.title} — ${status.label}`}
                      >
                        {mission.title}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {missions.length === 0 ? (
        <EmptyState icon={Inbox} title="Aucune mission planifiée." className="py-6" />
      ) : null}
    </div>
  );
}