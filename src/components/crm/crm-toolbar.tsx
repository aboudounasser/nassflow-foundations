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
  CONTACT_STATUS,
  CONTACT_STATUS_ORDER,
  CONTACT_TYPE,
  CONTACT_TYPE_ORDER,
} from "@/lib/crm/meta";
import type {
  ContactSortKey,
  ContactStatus,
  ContactType,
  CrmView,
} from "@/lib/crm/types";

export interface ContactFilters {
  search: string;
  type: ContactType | "all";
  status: ContactStatus | "all";
  sort: ContactSortKey;
}

const SORT_LABELS: Record<ContactSortKey, string> = {
  lastContact: "Dernier contact",
  value: "Valeur",
  name: "Nom",
};

export function CrmToolbar({
  filters,
  onChange,
  view,
  onViewChange,
  onReset,
  resultCount,
}: {
  filters: ContactFilters;
  onChange: (next: ContactFilters) => void;
  view: CrmView;
  onViewChange: (view: CrmView) => void;
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
            placeholder="Rechercher un nom, une entreprise, un e-mail…"
            aria-label="Rechercher un contact"
            className="pl-9"
          />
        </div>

        <Select
          value={filters.type}
          onValueChange={(v) => onChange({ ...filters, type: v as ContactType | "all" })}
        >
          <SelectTrigger className="w-[160px]" aria-label="Filtrer par type">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les types</SelectItem>
            {CONTACT_TYPE_ORDER.map((t) => (
              <SelectItem key={t} value={t}>
                {CONTACT_TYPE[t].plural}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.status}
          onValueChange={(v) => onChange({ ...filters, status: v as ContactStatus | "all" })}
        >
          <SelectTrigger className="w-[180px]" aria-label="Filtrer par statut">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            {CONTACT_STATUS_ORDER.map((s) => (
              <SelectItem key={s} value={s}>
                {CONTACT_STATUS[s].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.sort}
          onValueChange={(v) => onChange({ ...filters, sort: v as ContactSortKey })}
        >
          <SelectTrigger className="w-[180px]" aria-label="Trier les contacts">
            <SelectValue placeholder="Trier" />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(SORT_LABELS) as ContactSortKey[]).map((key) => (
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
          onValueChange={(v) => v && onViewChange(v as CrmView)}
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
          {resultCount} contact{resultCount > 1 ? "s" : ""}
        </span>
        <Button variant="ghost" size="sm" onClick={onReset}>
          <RotateCcw />
          Réinitialiser
        </Button>
      </div>
    </div>
  );
}