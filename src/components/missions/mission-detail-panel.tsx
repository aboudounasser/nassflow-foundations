import { useNavigate } from "@tanstack/react-router";
import { Maximize2 } from "lucide-react";

import { MissionActions } from "@/components/missions/mission-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { MISSION_STATUS, missionOutcome } from "@/lib/missions/meta";
import type { Mission } from "@/lib/missions/types";
import { formatScanDateTime } from "@/lib/scans/meta";

/** Résumé d'une mission réelle — Context Panel global. */
export function MissionDetailPanel({ mission }: { mission: Mission }) {
  const status = MISSION_STATUS[mission.status];
  const StatusIcon = status.icon;
  const result = missionOutcome(mission);
  const navigate = useNavigate();

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-5 p-6">
        <div className="space-y-2">
          <h3 className="text-[16px] font-medium text-foreground">{mission.title}</h3>
          <div className="flex flex-wrap gap-1">
            <Badge variant={status.variant}>
              <StatusIcon aria-hidden="true" />
              {status.label}
            </Badge>
          </div>
        </div>

        <p className="text-[14px] leading-6 text-muted-foreground">{mission.objective}</p>

        <Separator />

        <dl className="grid grid-cols-2 gap-3 text-[14px]">
          <div>
            <dt className="text-[12px] text-muted-foreground">Ouverte le</dt>
            <dd className="text-foreground">{formatScanDateTime(mission.createdAt)}</dd>
          </div>
          <div>
            <dt className="text-[12px] text-muted-foreground">Terminée le</dt>
            <dd className="text-foreground">{formatScanDateTime(mission.completedAt)}</dd>
          </div>
          {result ? (
            <div className="col-span-2 min-w-0">
              <dt className="text-[12px] text-muted-foreground">Résultat</dt>
              <dd
                className={result.tone === "destructive" ? "text-destructive" : "text-foreground"}
              >
                {result.text}
              </dd>
            </div>
          ) : null}
        </dl>
      </div>

      <div className="sticky bottom-0 flex flex-wrap gap-2 border-t border-border bg-surface p-4">
        <Button
          variant="secondary"
          size="sm"
          onClick={() =>
            navigate({ to: "/missions/$missionId", params: { missionId: mission.id } })
          }
        >
          <Maximize2 />
          Plein écran
        </Button>
        <MissionActions mission={mission} />
      </div>
    </div>
  );
}
