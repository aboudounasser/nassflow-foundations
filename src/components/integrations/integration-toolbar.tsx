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
  INTEGRATION_CATEGORY_ORDER,
  INTEGRATION_STATUS,
  INTEGRATION_STATUS_ORDER,
} from "@/lib/integrations/meta";
import type {
  IntegrationCategory,
  IntegrationSortKey,
  IntegrationStatus,
  IntegrationView,
} from "@/lib/integrations/types";

export interface IntegrationFilters {
  search: string;
  category: IntegrationCategory | "all";
  status: IntegrationStatus | "all";
  sort: IntegrationSortKey;
}

const SORT_LABELS: Record<IntegrationSortKey, string> = {
  name: "Nom",
  status: "Statut",
  lastSync: "Dernière synchro",
};

export function IntegrationToolbar({
  filters,
  onChange,
  view,
  onViewChange,
  onReset,
  resultCount,
}: {
  filters: IntegrationFilters;
  onChange: (next: IntegrationFilters) => void;
  view: IntegrationView;
  onViewChange: (view: IntegrationView) => void;
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
            placeholder="Rechercher une intégration, une description…"
            aria-label="Rechercher une intégration"
            className="pl-9"
          />
        </div>

        <Select
          value={filters.category}
          onValueChange={(v) =>
            onChange({ ...filters, category: v as IntegrationCategory | "all" })
          }
        >
          <SelectTrigger className="w-[190px]" aria-label="Filtrer par catégorie">
            <SelectValue placeholder="Catégorie" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les catégories</SelectItem>
            {INTEGRATION_CATEGORY_ORDER.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.status}
          onValueChange={(v) => onChange({ ...filters, status: v as IntegrationStatus | "all" })}
        >
          <SelectTrigger className="w-[180px]" aria-label="Filtrer par statut">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            {INTEGRATION_STATUS_ORDER.map((s) => (
              <SelectItem key={s} value={s}>
                {INTEGRATION_STATUS[s].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.sort}
          onValueChange={(v) => onChange({ ...filters, sort: v as IntegrationSortKey })}
        >
          <SelectTrigger className="w-[210px]" aria-label="Trier les intégrations">
            <SelectValue placeholder="Trier" />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(SORT_LABELS) as IntegrationSortKey[]).map((key) => (
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
          onValueChange={(v) => v && onViewChange(v as IntegrationView)}
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
          {resultCount} intégration{resultCount > 1 ? "s" : ""}
        </span>
        <Button variant="ghost" size="sm" onClick={onReset}>
          <RotateCcw />
          Réinitialiser
        </Button>
      </div>
    </div>
  );
}
