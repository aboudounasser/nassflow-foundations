import { ArrowUpDown, ChevronDown, LayoutGrid, List, RotateCcw, Search } from "lucide-react";
import type { LucideIcon } from "lucide-react";

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

export type ToolbarOption = {
  value: string;
  label: string;
  /** Compteur optionnel affiché à droite de l'option. */
  count?: number;
};

export type FilterDescriptor =
  | {
      kind: "select";
      key: string;
      ariaLabel: string;
      placeholder: string;
      allLabel: string;
      width?: string;
      options: ToolbarOption[];
    }
  | {
      kind: "multiselect";
      key: string;
      ariaLabel: string;
      buttonLabel: string;
      options: ToolbarOption[];
    }
  | {
      kind: "sort";
      key: string;
      ariaLabel: string;
      width?: string;
      options: ToolbarOption[];
    };

export type ViewDescriptor = {
  value: string;
  label: string;
  icon: LucideIcon;
};

export const GRID_LIST_VIEWS: ViewDescriptor[] = [
  { value: "grid", label: "Grille", icon: LayoutGrid },
  { value: "list", label: "Liste", icon: List },
];

export function ModuleToolbar<F extends Record<string, unknown>>({
  filters,
  onChange,
  onReset,
  searchKey,
  searchPlaceholder,
  searchAriaLabel,
  descriptors,
  views,
  view,
  onViewChange,
  resultCount,
  resultLabel,
  actions,
}: {
  filters: F;
  onChange: (next: F) => void;
  onReset: () => void;
  searchKey: keyof F & string;
  searchPlaceholder: string;
  searchAriaLabel: string;
  descriptors: FilterDescriptor[];
  views: ViewDescriptor[];
  view: string;
  onViewChange: (view: string) => void;
  resultCount: number;
  resultLabel: (count: number) => string;
  actions?: React.ReactNode;
}) {
  const set = (key: string, value: unknown) => onChange({ ...filters, [key]: value });

  return (
    <div className="@container flex flex-col gap-3 rounded-xl border border-border bg-surface p-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            value={String(filters[searchKey] ?? "")}
            onChange={(e) => set(searchKey, e.target.value)}
            placeholder={searchPlaceholder}
            aria-label={searchAriaLabel}
            className="pl-9"
          />
        </div>

        {descriptors.map((d) => {
          if (d.kind === "select") {
            return (
              <Select
                key={d.key}
                value={String(filters[d.key] ?? "all")}
                onValueChange={(v) => set(d.key, v)}
              >
                <SelectTrigger className={d.width ?? "w-[170px]"} aria-label={d.ariaLabel}>
                  <SelectValue placeholder={d.placeholder} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{d.allLabel}</SelectItem>
                  {d.options.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            );
          }

          if (d.kind === "sort") {
            return (
              <Select
                key={d.key}
                value={String(filters[d.key] ?? "")}
                onValueChange={(v) => set(d.key, v)}
              >
                <SelectTrigger className={d.width ?? "w-[180px]"} aria-label={d.ariaLabel}>
                  <ArrowUpDown className="size-4 text-muted-foreground" aria-hidden="true" />
                  <SelectValue placeholder="Trier" />
                </SelectTrigger>
                <SelectContent>
                  {d.options.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            );
          }

          const selected = (filters[d.key] as string[] | undefined) ?? [];
          return (
            <DropdownMenu key={d.key}>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" aria-label={d.ariaLabel}>
                  {d.buttonLabel}
                  {selected.length > 0 ? ` (${selected.length})` : ""}
                  <ChevronDown className="size-4" aria-hidden="true" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {d.options.map((o) => (
                  <DropdownMenuCheckboxItem
                    key={o.value}
                    checked={selected.includes(o.value)}
                    onSelect={(e) => e.preventDefault()}
                    onCheckedChange={() =>
                      set(
                        d.key,
                        selected.includes(o.value)
                          ? selected.filter((v) => v !== o.value)
                          : [...selected, o.value],
                      )
                    }
                  >
                    <span className="flex-1">{o.label}</span>
                    {o.count !== undefined ? (
                      <span className="ml-2 text-[12px] text-muted-foreground">{o.count}</span>
                    ) : null}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <ToggleGroup
          type="single"
          value={view}
          onValueChange={(v) => v && onViewChange(v)}
          aria-label="Changer de vue"
        >
          {views.map((v) => (
            <ToggleGroupItem key={v.value} value={v.value} aria-label={`Vue ${v.label}`}>
              <v.icon className="size-4" />
              <span className="hidden @md:inline">{v.label}</span>
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <span className="text-[12px] text-muted-foreground">{resultLabel(resultCount)}</span>
        {actions}
        <Button variant="ghost" size="sm" onClick={onReset}>
          <RotateCcw />
          Réinitialiser
        </Button>
      </div>
    </div>
  );
}
