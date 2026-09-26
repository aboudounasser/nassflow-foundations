import { Link } from "@tanstack/react-router";

import { Badge } from "@/components/ui/badge";
import { MISSION_STATUS } from "@/lib/missions/meta";
import { formatRelativeScanDate, pluralize } from "@/lib/scans/meta";
import type { RecentMission } from "@/services/missions";

/**
 * Résultat lisible de l'analyse liée. `null` quand il n'y a rien à dire :
 * résultat réservé aux owner et admin, ou analyse sans compteur exploitable.
 */
function outcome(mission: RecentMission): { text: string; tone: "muted" | "destructive" } | null {
  if (mission.status === "running") return { text: "Analyse en cours", tone: "muted" };
  if (mission.errorMessage) return { text: mission.errorMessage, tone: "destructive" };
  if (mission.prospectsFound === null) return null;
  return {
    text:
      mission.prospectsFound > 0
        ? pluralize(mission.prospectsFound, "prospect trouvé", "prospects trouvés")
        : "Aucune demande commerciale",
    tone: "muted",
  };
}

/** Une mission récente de l'accueil : lien vers sa fiche, statut et résultat. */
export function RecentMissionRow({ mission }: { mission: RecentMission }) {
  const status = MISSION_STATUS[mission.status];
  const StatusIcon = status.icon;
  const result = outcome(mission);

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
