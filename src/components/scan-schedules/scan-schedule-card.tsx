import { CalendarClock, TriangleAlert } from "lucide-react";
import { toast } from "sonner";

import { WidgetShell } from "@/components/dashboard/widget-shell";
import { useSession } from "@/components/providers/session-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import type { WidgetState } from "@/lib/dashboard/types";
import type { Connection } from "@/lib/integrations-oauth/types";
import { PRIVILEGED_ROLES } from "@/lib/organization/meta";
import {
  RUN_HOURS,
  SCAN_FREQUENCIES,
  SCAN_FREQUENCY,
  describeSchedule,
  describeTimezone,
  formatNextRun,
  formatRunHour,
  scheduleAlert,
} from "@/lib/scan-schedules/meta";
import { useScanSchedule, useUpdateScanSchedule } from "@/lib/scan-schedules/queries";
import type { ScanFrequency, ScanScheduleSettings } from "@/lib/scan-schedules/types";
import { formatRelativeScanDate } from "@/lib/scans/meta";
import { useRuns } from "@/lib/scans/queries";
import type { Run } from "@/lib/scans/types";
import { cn } from "@/lib/utils";

const UPDATE_FALLBACK_ERROR = "Les réglages n'ont pas pu être enregistrés. Réessayez.";

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[12px] text-muted-foreground">{label}</p>
      <p className="truncate text-[14px] text-foreground">{value}</p>
    </div>
  );
}

function ScheduleSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <Skeleton className="h-11 w-full rounded-lg" />
      <Skeleton className="h-11 w-full rounded-lg" />
    </div>
  );
}

/** Dernier run de cette boîte pour une origine donnée — la liste est triée du plus récent au plus ancien. */
function latestRun(runs: Run[], integrationId: string, source: Run["triggerSource"]): Run | null {
  return (
    runs.find((run) => run.integrationId === integrationId && run.triggerSource === source) ?? null
  );
}

/**
 * Réglages d'analyse automatique d'une boîte Gmail : activation, fréquence,
 * heure, prochaine échéance et état.
 *
 * NON MONTÉE À CE JOUR. Règle produit : un réglage qui ne fait rien n'est pas
 * affiché. Cette carte n'entre dans l'interface (hub d'intégrations, sous la
 * ligne Gmail) qu'une fois le dispatcher de l'étape 6 actif — jamais avec une
 * mention « Bientôt ».
 *
 * Réservée aux owner et admin, comme la RLS de `scan_schedules`. L'échéance
 * affichée est celle que la base a recalculée, jamais une estimation locale.
 */
export function ScanScheduleCard({ connection }: { connection: Connection }) {
  const { session } = useSession();
  const scheduleQuery = useScanSchedule(connection.id);
  const runsQuery = useRuns();
  const updateMutation = useUpdateScanSchedule(connection.id);

  const canEdit = PRIVILEGED_ROLES.includes(session.role);
  const schedule = scheduleQuery.data ?? null;
  const runs = runsQuery.data ?? [];
  const busy = updateMutation.isPending;

  const state: WidgetState = scheduleQuery.isError
    ? "error"
    : scheduleQuery.isPending
      ? "loading"
      : schedule
        ? "success"
        : "empty";

  const save = (patch: Partial<ScanScheduleSettings>, success: string) => {
    updateMutation.mutate(patch, {
      onSuccess: () => toast.success(success),
      // Le refus d'activation est rédigé par la base pour l'utilisateur : affiché tel quel.
      onError: (e) => toast.error(e instanceof Error ? e.message : UPDATE_FALLBACK_ERROR),
    });
  };

  const alert = schedule ? scheduleAlert(schedule, connection.status) : null;
  const lastAuto = latestRun(runs, connection.id, "schedule");
  const lastManual = latestRun(runs, connection.id, "manual");
  const canEnable = connection.status === "active";

  return (
    <WidgetShell
      title="Analyse automatique"
      description={
        connection.accountEmail
          ? `Boîte ${connection.accountEmail}`
          : "Analyse planifiée de la boîte Gmail connectée."
      }
      icon={CalendarClock}
      state={state}
      onRetry={() => void scheduleQuery.refetch()}
      headerAction={
        schedule ? (
          <Badge variant={schedule.enabled ? "success" : "neutral"}>
            {schedule.enabled ? "Active" : "En pause"}
          </Badge>
        ) : null
      }
      emptyIcon={CalendarClock}
      emptyTitle="Réglages indisponibles pour cette boîte"
      skeleton={<ScheduleSkeleton />}
    >
      {schedule ? (
        <div className="space-y-3">
          {alert ? (
            <div
              className={cn(
                "flex items-start gap-2 rounded-lg border p-3",
                alert.tone === "destructive"
                  ? "border-destructive/30 bg-destructive/10"
                  : "border-warning/30 bg-warning/10",
              )}
              role="status"
            >
              <TriangleAlert
                className={cn(
                  "size-5 shrink-0",
                  alert.tone === "destructive" ? "text-destructive" : "text-warning",
                )}
                aria-hidden="true"
              />
              <p className="text-[14px] text-foreground">{alert.message}</p>
            </div>
          ) : null}

          <div className="grid gap-3 @2xl:grid-cols-3">
            <Fact
              label="Prochaine analyse"
              value={
                schedule.enabled && schedule.nextRunAt
                  ? formatNextRun(schedule.nextRunAt, schedule.timezone)
                  : "En pause"
              }
            />
            <Fact
              label="Dernière analyse automatique"
              value={
                lastAuto ? formatRelativeScanDate(lastAuto.startedAt) : "Aucune pour l'instant"
              }
            />
            <Fact
              label="Dernière analyse manuelle"
              value={lastManual ? formatRelativeScanDate(lastManual.startedAt) : "Aucune"}
            />
          </div>

          <div className="flex flex-col gap-3 @2xl:flex-row @2xl:items-end">
            <div className="min-w-0 flex-1 space-y-1.5">
              <Label htmlFor={`scan-frequency-${connection.id}`}>Fréquence</Label>
              <Select
                value={schedule.frequency}
                disabled={!canEdit || busy}
                onValueChange={(value) =>
                  save({ frequency: value as ScanFrequency }, "Fréquence enregistrée")
                }
              >
                <SelectTrigger id={`scan-frequency-${connection.id}`} className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SCAN_FREQUENCIES.map((frequency) => (
                    <SelectItem key={frequency} value={frequency}>
                      {SCAN_FREQUENCY[frequency].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor={`scan-hour-${connection.id}`}>Heure</Label>
              <Select
                value={String(schedule.runHour)}
                disabled={!canEdit || busy}
                onValueChange={(value) => save({ runHour: Number(value) }, "Heure enregistrée")}
              >
                <SelectTrigger id={`scan-hour-${connection.id}`} className="w-full @2xl:w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RUN_HOURS.map((hour) => (
                    <SelectItem key={hour} value={String(hour)}>
                      {formatRunHour(hour)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {canEdit ? (
              schedule.enabled ? (
                <Button
                  type="button"
                  variant="secondary"
                  loading={busy}
                  disabled={busy}
                  onClick={() => save({ enabled: false }, "Analyse automatique mise en pause")}
                >
                  Mettre en pause
                </Button>
              ) : (
                <Button
                  type="button"
                  loading={busy}
                  disabled={busy || !canEnable}
                  onClick={() => save({ enabled: true }, "Analyse automatique activée")}
                >
                  Activer
                </Button>
              )
            ) : null}
          </div>

          <p className="text-[12px] text-muted-foreground">
            {describeSchedule(schedule.frequency, schedule.runHour)},{" "}
            {describeTimezone(schedule.timezone)}. Jusqu'à 50 messages par analyse. Les prospects
            détectés attendent votre validation : rien n'est envoyé au CRM sans vous.
          </p>
        </div>
      ) : null}
    </WidgetShell>
  );
}
