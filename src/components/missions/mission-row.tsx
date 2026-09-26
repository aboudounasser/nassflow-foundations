import { Link } from "@tanstack/react-router";

import { Badge } from "@/components/ui/badge";
import { MISSION_STATUS, missionOutcome } from "@/lib/missions/meta";
import type { Mission } from "@/lib/missions/types";
import { formatRelativeScanDate } from "@/lib/scans/meta";

/**
 * Une mission : titre, statut, ouverture et résultat, en lien vers sa fiche.
 * Même ligne partout — liste `/missions`, accueil et fiche Sales Agent.
 */
export function MissionRow({ mission }: { mission: Mission }) {
  const status = MISSION_STATUS[mission.status];
  const StatusIcon = status.icon;
  const result = missionOutcome(mission);

  return (
    <li>
      <Link
        to="/missions/$missionId"
        params={{ missionId: mission.id }}
        className="block rounded-lg border border-border bg-surface p-3 transition-colors duration-150 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <div className="flex flex-wrap items-start justify-between gap-2">
          <p className="min-w-0 truncate text-[14px] font-medium text-foreground">
            {mission.title}
          </p>
          <Badge variant={status.variant}>
            <StatusIcon aria-hidden="true" />
            {status.label}
          </Badge>
        </div>
        <p className="mt-1 text-[12px] text-muted-foreground">
          Ouverte {formatRelativeScanDate(mission.createdAt)}
          {result ? (
            <>
              {" · "}
              <span className={result.tone === "destructive" ? "text-destructive" : undefined}>
                {result.text}
              </span>
            </>
          ) : null}
        </p>
      </Link>
    </li>
  );
}
