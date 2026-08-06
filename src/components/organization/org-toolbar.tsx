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
  MEMBER_ROLE,
  MEMBER_ROLE_ORDER,
  MEMBER_STATUS,
  MEMBER_STATUS_ORDER,
} from "@/lib/organization/meta";
import type {
  MemberRole,
  MemberSortKey,
  MemberStatus,
  OrgView,
} from "@/lib/organization/types";

export interface MemberFilters {
  search: string;
  department: string | "all";
  role: MemberRole | "all";
  status: MemberStatus | "all";
  sort: MemberSortKey;
}

const SORT_LABELS: Record<MemberSortKey, string> = {
  name: "Nom",
  joinedAt: "Date d'arrivée",
  department: "Département",
};

export function OrgToolbar({
  filters,
  departments,
  onChange,
  view,
  onViewChange,
  onReset,
  resultCount,
}: {
  filters: MemberFilters;
  departments: string[];
  onChange: (next: MemberFilters) => void;
  view: OrgView;
  onViewChange: (view: OrgView) => void;
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
            placeholder="Rechercher un nom, un e-mail, un poste…"
            aria-label="Rechercher un membre"
            className="pl-9"
          />
        </div>

        <Select
          value={filters.department}
          onValueChange={(v) => onChange({ ...filters, department: v })}
        >
          <SelectTrigger className="w-[180px]" aria-label="Filtrer par département">
            <SelectValue placeholder="Département" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les départements</SelectItem>
            {departments.map((d) => (
              <SelectItem key={d} value={d}>
                {d}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.role}
          onValueChange={(v) => onChange({ ...filters, role: v as MemberRole | "all" })}
        >
          <SelectTrigger className="w-[170px]" aria-label="Filtrer par rôle">
            <SelectValue placeholder="Rôle" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les rôles</SelectItem>
            {MEMBER_ROLE_ORDER.map((r) => (
              <SelectItem key={r} value={r}>
                {MEMBER_ROLE[r].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.status}
          onValueChange={(v) => onChange({ ...filters, status: v as MemberStatus | "all" })}
        >
          <SelectTrigger className="w-[170px]" aria-label="Filtrer par statut">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            {MEMBER_STATUS_ORDER.map((s) => (
              <SelectItem key={s} value={s}>
                {MEMBER_STATUS[s].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.sort}
          onValueChange={(v) => onChange({ ...filters, sort: v as MemberSortKey })}
        >
          <SelectTrigger className="w-[190px]" aria-label="Trier les membres">
            <SelectValue placeholder="Trier" />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(SORT_LABELS) as MemberSortKey[]).map((key) => (
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
          onValueChange={(v) => v && onViewChange(v as OrgView)}
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
          {resultCount} membre{resultCount > 1 ? "s" : ""}
        </span>
        <Button variant="ghost" size="sm" onClick={onReset}>
          <RotateCcw />
          Réinitialiser
        </Button>
      </div>
    </div>
  );
}