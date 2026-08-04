import { useNavigate } from "@tanstack/react-router";
import { ChevronRight, ScrollText } from "lucide-react";
import { useMemo, useState } from "react";

import { EmptyState } from "@/components/common/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LOG_RESULT, LOG_TYPE, LOG_TYPE_ORDER, formatAgentActivity, formatDuration } from "@/lib/agents/meta";
import type { AgentLogEntry, AgentLogType } from "@/lib/agents/types";

/** Onglet « Logs » — timeline filtrable des actions de l'agent. */
export function AgentLogsTab({ logs }: { logs: AgentLogEntry[] }) {
  const [types, setTypes] = useState<AgentLogType[]>([]);
  const navigate = useNavigate();

  const entries = useMemo(() => {
    const filtered = types.length === 0 ? logs : logs.filter((l) => types.includes(l.type));
    return [...filtered].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
  }, [logs, types]);

  const toggle = (type: AgentLogType) =>
    setTypes((prev) => (prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {LOG_TYPE_ORDER.map((type) => {
          const meta = LOG_TYPE[type];
          const Icon = meta.icon;
          const active = types.includes(type);
          return (
            <Button
              key={type}
              type="button"
              size="sm"
              variant={active ? "secondary" : "ghost"}
              onClick={() => toggle(type)}
              aria-pressed={active}
            >
              <Icon aria-hidden="true" />
              {meta.label}
            </Button>
          );
        })}
        {types.length > 0 ? (
          <Button type="button" size="sm" variant="ghost" onClick={() => setTypes([])}>
            Réinitialiser
          </Button>
        ) : null}
      </div>

      {entries.length === 0 ? (
        <EmptyState
          icon={ScrollText}
          title="Aucun log pour ce filtre"
          description="Modifiez ou réinitialisez les filtres pour voir l'activité de l'agent."
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {entries.map((log) => {
            const meta = LOG_TYPE[log.type];
            const Icon = meta.icon;
            const result = LOG_RESULT[log.result];
            const clickable = Boolean(log.missionId);
            const content = (
              <>
                <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg border border-border bg-card">
                  <Icon className="size-4 text-muted-foreground" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1 space-y-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="text-[14px] text-foreground">{log.action}</span>
                    <Badge variant={result.variant}>{result.label}</Badge>
                  </span>
                  <span className="flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-muted-foreground">
                    <span>{formatAgentActivity(log.timestamp)}</span>
                    <span>{meta.label}</span>
                    {log.tool ? <span>Outil : {log.tool}</span> : null}
                    <span>Durée : {formatDuration(log.durationMs)}</span>
                    <span>Coût : {log.costEstimate ?? "—"}</span>
                    {log.missionId ? <span>Mission {log.missionId}</span> : null}
                  </span>
                </span>
                {clickable ? (
                  <ChevronRight
                    className="mt-2 size-4 shrink-0 text-muted-foreground"
                    aria-hidden="true"
                  />
                ) : null}
              </>
            );

            return (
              <li key={log.id}>
                {clickable ? (
                  <button
                    type="button"
                    onClick={() =>
                      navigate({
                        to: "/missions/$missionId",
                        params: { missionId: log.missionId as string },
                      })
                    }
                    className="flex w-full cursor-pointer items-start gap-3 rounded-lg border border-border bg-surface p-3 text-left transition-colors duration-150 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {content}
                  </button>
                ) : (
                  <div className="flex items-start gap-3 rounded-lg border border-border bg-surface p-3">
                    {content}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
