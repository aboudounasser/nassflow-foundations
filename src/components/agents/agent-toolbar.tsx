import { ArrowUpDown, LayoutGrid, List, RotateCcw, Search } from "lucide-react";

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
import { AGENT_DOMAINS, AGENT_STATUS, AGENT_STATUS_ORDER } from "@/lib/agents/meta";
import type { AgentDomain, AgentSortKey, AgentStatus, AgentView } from "@/lib/agents/types";

export interface AgentFilters {
  search: string;
  domain: AgentDomain | "all";
  status: AgentStatus | "all";
  sort: AgentSortKey;
}

export function AgentToolbar({
  filters,
  onChange,
  view,
  onViewChange,
  onReset,
  resultCount,
}: {
  filters: AgentFilters;
  onChange: (next: AgentFilters) => void;
  view: AgentView;
  onViewChange: (view: AgentView) => void;
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
            placeholder="Rechercher un agent, un rôle, un domaine…"
            aria-label="Rechercher un agent"
            className="pl-9"
          />
        </div>

        <Select
          value={filters.domain}
          onValueChange={(v) => onChange({ ...filters, domain: v as AgentDomain | "all" })}
        >
          <SelectTrigger className="w-[170px]" aria-label="Filtrer par domaine">
            <SelectValue placeholder="Domaine" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les domaines</SelectItem>
            {AGENT_DOMAINS.map((d) => (
              <SelectItem key={d} value={d}>
                {d}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.status}
          onValueChange={(v) => onChange({ ...filters, status: v as AgentStatus | "all" })}
        >
          <SelectTrigger className="w-[160px]" aria-label="Filtrer par statut">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            {AGENT_STATUS_ORDER.map((s) => (
              <SelectItem key={s} value={s}>
                {AGENT_STATUS[s].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.sort}
          onValueChange={(v) => onChange({ ...filters, sort: v as AgentSortKey })}
        >
          <SelectTrigger className="w-[180px]" aria-label="Trier les agents">
            <ArrowUpDown className="size-4 text-muted-foreground" aria-hidden="true" />
            <SelectValue placeholder="Trier" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">Nom</SelectItem>
            <SelectItem value="confidence">Confiance</SelectItem>
            <SelectItem value="activity">Activité récente</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <ToggleGroup
          type="single"
          value={view}
          onValueChange={(v) => v && onViewChange(v as AgentView)}
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
          {resultCount} agent{resultCount > 1 ? "s" : ""}
        </span>
        <Button variant="ghost" size="sm" onClick={onReset}>
          <RotateCcw />
          Réinitialiser
        </Button>
      </div>
    </div>
  );
}
