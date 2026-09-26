import { MissionRowContent } from "@/components/missions/recent-mission-row";
import type { Mission } from "@/lib/missions/types";
import { cn } from "@/lib/utils";

/** Une ligne de la liste `/missions` : un clic ouvre le panneau de contexte. */
export function MissionRow({
  mission,
  selected,
  onSelect,
}: {
  mission: Mission;
  selected: boolean;
  onSelect: (mission: Mission) => void;
}) {
  return (
    <li>
      <button
        type="button"
        aria-pressed={selected}
        onClick={() => onSelect(mission)}
        className={cn(
          "block w-full cursor-pointer rounded-lg border bg-surface p-3 text-left transition-colors duration-150 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          selected ? "border-primary" : "border-border",
        )}
      >
        <MissionRowContent mission={mission} />
      </button>
    </li>
  );
}
