import { ArrowUpDown, Calendar, LayoutGrid, List, Plus, RotateCcw, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { MISSION_STATUS } from "@/lib/missions/meta";
import type {
  MissionAgent,
  MissionSortKey,
  MissionStatus,
  MissionView,
} from "@/lib/missions/types";
import { PRIORITY_BADGE } from "@/components/dashboard/decision-item-card";
import type { Priority } from "@/lib/dashboard/types";

const STATUS_ORDER: MissionStatus[] = [
  "draft",
  "ready",
  "running",
  "waiting",
  "blocked",
  "completed",
  "failed",
  "cancelled",
  "archived",
];

const PRIORITY_ORDER: Priority[] = ["critical", "high", "medium", "low"];

export interface MissionFilters {
  search: string;
  statuses: MissionStatus[];
  priority: Priority | "all";
  agentId: string | "all";
  sort: MissionSortKey;
}

export function MissionToolbar({
  filters,
  onChange,
  view,
  onViewChange,
  agents,
  onReset,
  onCreate,
  resultCount,
}: {
  filters: MissionFilters;
  onChange: (next: MissionFilters) => void;
  view: MissionView;
  onViewChange: (view: MissionView) => void;
  agents: MissionAgent[];
  onReset: () => void;
  onCreate: () => void;
  resultCount: number;
}) {
  const toggleStatus = (status: MissionStatus) => {
    const next = filters.statuses.includes(status)
      ? filters.statuses.filter((s) => s !== status)
      : [...filters.statuses, status];
    onChange({ ...filters, statuses: next });
  };

  return (
    <div className="@container flex flex-col gap-3 rounded-xl border border-border bg-surface p-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            value={filters.search}
            onChange={(e) => onChange({ ...filters, search: e.target.value })}
            placeholder="Rechercher une mission ou un tag…"
            aria-label="Rechercher une mission"
            className="pl-9"
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary">
              Statuts
              {filters.statuses.length > 0 ? ` (${filters.statuses.length})` : ""}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            {STATUS_ORDER.map((status) => (
              <DropdownMenuCheckboxItem
                key={status}
                checked={filters.statuses.includes(status)}
                onSelect={(e) => e.preventDefault()}
                onCheckedChange={() => toggleStatus(status)}
              >
                {MISSION_STATUS[status].label}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Select
          value={filters.priority}
          onValueChange={(v) => onChange({ ...filters, priority: v as Priority | "all" })}
        >
          <SelectTrigger className="w-[150px]" aria-label="Filtrer par priorité">
            <SelectValue placeholder="Priorité" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes priorités</SelectItem>
            {PRIORITY_ORDER.map((p) => (
              <SelectItem key={p} value={p}>
                {PRIORITY_BADGE[p].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filters.agentId} onValueChange={(v) => onChange({ ...filters, agentId: v })}>
          <SelectTrigger className="w-[170px]" aria-label="Filtrer par agent">
            <SelectValue placeholder="Agent" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les agents</SelectItem>
            {agents.map((a) => (
              <SelectItem key={a.id} value={a.id}>
                {a.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.sort}
          onValueChange={(v) => onChange({ ...filters, sort: v as MissionSortKey })}
        >
          <SelectTrigger className="w-[170px]" aria-label="Trier les missions">
            <ArrowUpDown className="size-4 text-muted-foreground" aria-hidden="true" />
            <SelectValue placeholder="Trier" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="dueDate">Échéance</SelectItem>
            <SelectItem value="priority">Priorité</SelectItem>
            <SelectItem value="progress">Progression</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <ToggleGroup
            type="single"
            value={view}
            onValueChange={(v) => v && onViewChange(v as MissionView)}
            aria-label="Changer de vue"
          >
            <ToggleGroupItem value="list" aria-label="Vue liste">
              <List className="size-4" />
              <span className="hidden @md:inline">Liste</span>
            </ToggleGroupItem>
            <ToggleGroupItem value="kanban" aria-label="Vue kanban">
              <LayoutGrid className="size-4" />
              <span className="hidden @md:inline">Kanban</span>
            </ToggleGroupItem>
            <ToggleGroupItem value="calendar" aria-label="Vue calendrier">
              <Calendar className="size-4" />
              <span className="hidden @md:inline">Calendrier</span>
            </ToggleGroupItem>
          </ToggleGroup>
          <span className="text-[12px] text-muted-foreground">
            {resultCount} mission{resultCount > 1 ? "s" : ""}
          </span>
          <Button variant="ghost" size="sm" onClick={onReset}>
            <RotateCcw />
            Réinitialiser
          </Button>
        </div>

        <Button onClick={onCreate}>
          <Plus />
          Créer une Mission
        </Button>
      </div>
    </div>
  );
}
