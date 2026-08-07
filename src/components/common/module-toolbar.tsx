import { ArrowUpDown, LayoutGrid, List, RotateCcw, Search } from "lucide-react";

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
import type { FilterDescriptor, ToolbarOption, ViewDescriptor } from "@/lib/toolbar/types";

export type { ToolbarOption, FilterDescriptor, ViewDescriptor };

export const GRID_LIST_VIEWS: ViewDescriptor[] = [
  { value: "grid", label: "Grille", icon: LayoutGrid },
  { value: "list", label: "Liste", icon: List },
];

export function ModuleToolbar<F extends object>({
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
  const record = filters as Record<string, unknown>;
  const set = (key: string, value: unknown) => onChange({ ...filters, [key]: value } as F);

  return (
    <div className="@container flex flex-col gap-3 rounded-xl border border-border bg-surface p-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            value={String(record[searchKey] ?? "")}
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
                value={String(record[d.key] ?? "all")}
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
                value={String(record[d.key] ?? "")}
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

          const selected = (record[d.key] as string[] | undefined) ?? [];
          return (
            <DropdownMenu key={d.key}>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" aria-label={d.ariaLabel}>
                  {d.buttonLabel}
                  {selected.length > 0 ? ` (${selected.length})` : ""}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
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
        <Button variant="ghost" size="sm" onClick={onReset}>
          <RotateCcw />
          Réinitialiser
        </Button>
        {actions ? <div className="ml-auto">{actions}</div> : null}
      </div>
    </div>
  );
}
