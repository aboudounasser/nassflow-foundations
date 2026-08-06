import { LayoutGrid, List, RotateCcw, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  TRIGGER_KIND,
  TRIGGER_KIND_ORDER,
  WORKFLOW_STATUS,
  WORKFLOW_STATUS_ORDER,
} from "@/lib/workflows/meta";
import type {
  TriggerKind,
  WorkflowSortKey,
  WorkflowStatus,
  WorkflowView,
} from "@/lib/workflows/types";

export interface WorkflowFilters {
  search: string;
  status: WorkflowStatus | "all";
  trigger: TriggerKind | "all";
  sort: WorkflowSortKey;
}

const SORT_LABELS: Record<WorkflowSortKey, string> = {
  lastRun: "Dernière exécution",
  successRate: "Taux de réussite",
  name: "Nom",
};

export function WorkflowToolbar({
  filters,
  onChange,
  view,
  onViewChange,
  onReset,
  resultCount,
}: {
  filters: WorkflowFilters;
  onChange: (next: WorkflowFilters) => void;
  view: WorkflowView;
  onViewChange: (view: WorkflowView) => void;
  onReset: () => void;
  resultCount: number;
}) {
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
            placeholder="Rechercher un workflow, une description…"
            aria-label="Rechercher un workflow"
            className="pl-9"
          />
        </div>

        <Select
          value={filters.status}
          onValueChange={(v) => onChange({ ...filters, status: v as WorkflowStatus | "all" })}
        >
          <SelectTrigger className="w-[170px]" aria-label="Filtrer par statut">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            {WORKFLOW_STATUS_ORDER.map((s) => (
              <SelectItem key={s} value={s}>
                {WORKFLOW_STATUS[s].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.trigger}
          onValueChange={(v) => onChange({ ...filters, trigger: v as TriggerKind | "all" })}
        >
          <SelectTrigger className="w-[190px]" aria-label="Filtrer par déclencheur">
            <SelectValue placeholder="Déclencheur" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les déclencheurs</SelectItem>
            {TRIGGER_KIND_ORDER.map((t) => (
              <SelectItem key={t} value={t}>
                {TRIGGER_KIND[t].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.sort}
          onValueChange={(v) => onChange({ ...filters, sort: v as WorkflowSortKey })}
        >
          <SelectTrigger className="w-[220px]" aria-label="Trier les workflows">
            <SelectValue placeholder="Trier" />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(SORT_LABELS) as WorkflowSortKey[]).map((key) => (
              <SelectItem key={key} value={key}>
                Tri : {SORT_LABELS[key]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <ToggleGroup
          type="single"
          value={view}
          onValueChange={(v) => v && onViewChange(v as WorkflowView)}
          aria-label="Changer de vue"
        >
          <ToggleGroupItem value="grid" aria-label="Vue grille">
            <LayoutGrid className="size-4" />
            <span className="hidden @md:inline">Grille</span>
          </ToggleGroupItem>
          <ToggleGroupItem value="list" aria-label="Vue liste">
            <List className="size-4" />
            <span className="hidden @md:inline">Liste</span>
          </ToggleGroupItem>
        </ToggleGroup>
        <span className="text-[12px] text-muted-foreground">
          {resultCount} workflow{resultCount > 1 ? "s" : ""}
        </span>
        <Button variant="ghost" size="sm" onClick={onReset}>
          <RotateCcw />
          Réinitialiser
        </Button>
      </div>
    </div>
  );
}