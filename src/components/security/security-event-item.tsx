import { useNavigate } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EVENT_SEVERITY, EVENT_SOURCE, formatSecurityDate } from "@/lib/security/meta";
import type { SecurityEvent } from "@/lib/security/types";

/** Entrée du journal d'audit — liens vers l'entité d'origine si disponibles. */
export function SecurityEventItem({
  event,
  compact = false,
}: {
  event: SecurityEvent;
  compact?: boolean;
}) {
  const navigate = useNavigate();
  const severity = EVENT_SEVERITY[event.severity];
  const SeverityIcon = severity.icon;
  const source = EVENT_SOURCE[event.source];
  const SourceIcon = source.icon;
  const link = event.linkTo;

  const links: { label: string; onClick: () => void }[] = [];
  if (link?.agentId) {
    links.push({
      label: "Voir l'agent",
      onClick: () => navigate({ to: "/agents/$agentId", params: { agentId: link.agentId as string } }),
    });
  }
  if (link?.missionId) {
    links.push({
      label: "Voir la mission",
      onClick: () =>
        navigate({ to: "/missions/$missionId", params: { missionId: link.missionId as string } }),
    });
  }
  if (link?.workflowId) {
    links.push({
      label: "Voir le workflow",
      onClick: () =>
        navigate({
          to: "/workflow-engine/$workflowId",
          params: { workflowId: link.workflowId as string },
        }),
    });
  }
  if (link?.memberId) {
    links.push({
      label: "Voir le membre",
      onClick: () =>
        navigate({ to: "/organization/$memberId", params: { memberId: link.memberId as string } }),
    });
  }

  return (
    <li className="flex items-start gap-3 rounded-lg border border-border bg-surface p-3">
      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg border border-border bg-card">
        <SeverityIcon className={`size-4 ${severity.tone}`} aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[14px] text-foreground">{event.title}</span>
          <Badge variant={severity.variant}>{severity.label}</Badge>
          <Badge>
            <SourceIcon aria-hidden="true" />
            {source.label}
          </Badge>
        </div>
        <p className="text-[12px] leading-4 text-muted-foreground">{event.description}</p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-muted-foreground">
          <span>{formatSecurityDate(event.timestamp)}</span>
          <span>Acteur : {event.actor}</span>
        </div>
        {!compact && links.length > 0 ? (
          <div className="flex flex-wrap gap-2 pt-1">
            {links.map((l) => (
              <Button key={l.label} type="button" size="sm" variant="ghost" onClick={l.onClick}>
                {l.label}
                <ArrowUpRight aria-hidden="true" />
              </Button>
            ))}
          </div>
        ) : null}
      </div>
    </li>
  );
}