import { LayoutGrid, List, RotateCcw, Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
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
  KNOWLEDGE_STATUS,
  KNOWLEDGE_STATUS_ORDER,
  KNOWLEDGE_TYPE,
  KNOWLEDGE_TYPE_ORDER,
} from "@/lib/knowledge/meta";
import type {
  KnowledgeStatus,
  KnowledgeType,
  KnowledgeView,
} from "@/lib/knowledge/types";
import { cn } from "@/lib/utils";

export interface KnowledgeFilters {
  search: string;
  types: KnowledgeType[];
  category: string | "all";
  status: KnowledgeStatus | "all";
}

export function KnowledgeToolbar({
  filters,
  onChange,
  view,
  onViewChange,
  onReset,
  categories,
  typeCounts,
  resultCount,
}: {
  filters: KnowledgeFilters;
  onChange: (next: KnowledgeFilters) => void;
  view: KnowledgeView;
  onViewChange: (view: KnowledgeView) => void;
  onReset: () => void;
  categories: { category: string; count: number }[];
  typeCounts: Record<KnowledgeType, number>;
  resultCount: number;
}) {
  const toggleType = (type: KnowledgeType) => {
    const next = filters.types.includes(type)
      ? filters.types.filter((t) => t !== type)
      : [...filters.types, type];
    onChange({ ...filters, types: next });
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
            placeholder="Rechercher un titre, un résumé, un tag…"
            aria-label="Rechercher une connaissance"
            className="pl-9"
          />
        </div>

        <Select
          value={filters.category}
          onValueChange={(v) => onChange({ ...filters, category: v })}
        >
          <SelectTrigger className="w-[180px]" aria-label="Filtrer par catégorie">
            <SelectValue placeholder="Catégorie" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les catégories</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.category} value={c.category}>
                {c.category} ({c.count})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.status}
          onValueChange={(v) => onChange({ ...filters, status: v as KnowledgeStatus | "all" })}
        >
          <SelectTrigger className="w-[160px]" aria-label="Filtrer par statut">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            {KNOWLEDGE_STATUS_ORDER.map((s) => (
              <SelectItem key={s} value={s}>
                {KNOWLEDGE_STATUS[s].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {KNOWLEDGE_TYPE_ORDER.map((type) => {
          const meta = KNOWLEDGE_TYPE[type];
          const TypeIcon = meta.icon;
          const active = filters.types.includes(type);
          return (
            <button
              key={type}
              type="button"
              aria-pressed={active}
              onClick={() => toggleType(type)}
              className={cn(
                "flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-[12px] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                active
                  ? "border-primary bg-accent text-foreground"
                  : "border-border bg-card text-muted-foreground hover:bg-accent",
              )}
            >
              <TypeIcon className="size-4" aria-hidden="true" />
              {meta.plural}
              <span className="tabular-nums">({typeCounts[type]})</span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <ToggleGroup
          type="single"
          value={view}
          onValueChange={(v) => v && onViewChange(v as KnowledgeView)}
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
          {resultCount} connaissance{resultCount > 1 ? "s" : ""}
        </span>
        {filters.types.length > 0 ? (
          <Badge variant="primary">
            {filters.types.length} type{filters.types.length > 1 ? "s" : ""} filtré
            {filters.types.length > 1 ? "s" : ""}
          </Badge>
        ) : null}
        <Button variant="ghost" size="sm" onClick={onReset}>
          <RotateCcw />
          Réinitialiser
        </Button>
      </div>
    </div>
  );
}
