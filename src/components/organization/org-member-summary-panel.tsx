import { useNavigate } from "@tanstack/react-router";
import { Maximize2 } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  MEMBER_ROLE,
  MEMBER_STATUS,
  formatOrgDate,
  formatSeniority,
} from "@/lib/organization/meta";
import type { OrgMember } from "@/lib/organization/types";

/** Résumé compact d'un membre — Context Panel global. */
export function OrgMemberSummaryPanel({
  member,
  manager,
  reportCount,
  agentCount,
}: {
  member: OrgMember;
  manager: OrgMember | null;
  reportCount: number;
  agentCount: number;
}) {
  const role = MEMBER_ROLE[member.role];
  const status = MEMBER_STATUS[member.status];
  const navigate = useNavigate();

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-5 p-6">
        <div className="flex items-start gap-3">
          <Avatar className="size-12 shrink-0">
            <AvatarFallback className="text-[13px]">{member.avatar}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <h3 className="text-[16px] font-medium text-foreground">{member.name}</h3>
            <p className="truncate text-[14px] text-muted-foreground">{member.jobTitle}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-1">
          <Badge variant="info">{member.department}</Badge>
          <Badge variant={role.variant}>{role.label}</Badge>
          <Badge variant={status.variant}>{status.label}</Badge>
        </div>

        <Separator />

        <dl className="grid grid-cols-2 gap-3 text-[14px]">
          <div className="col-span-2 min-w-0">
            <dt className="text-[12px] text-muted-foreground">E-mail</dt>
            <dd className="truncate text-foreground">{member.email}</dd>
          </div>
          <div>
            <dt className="text-[12px] text-muted-foreground">Arrivée</dt>
            <dd className="text-foreground">{formatOrgDate(member.joinedAt)}</dd>
          </div>
          <div>
            <dt className="text-[12px] text-muted-foreground">Ancienneté</dt>
            <dd className="text-foreground">{formatSeniority(member.joinedAt)}</dd>
          </div>
          <div className="col-span-2 min-w-0">
            <dt className="text-[12px] text-muted-foreground">Manager</dt>
            <dd className="truncate text-foreground">{manager ? manager.name : "—"}</dd>
          </div>
          <div>
            <dt className="text-[12px] text-muted-foreground">Membres rattachés</dt>
            <dd className="text-foreground tabular-nums">{reportCount}</dd>
          </div>
          <div>
            <dt className="text-[12px] text-muted-foreground">Agents IA du département</dt>
            <dd className="text-foreground tabular-nums">{agentCount}</dd>
          </div>
        </dl>
      </div>

      <div className="sticky bottom-0 flex flex-wrap gap-2 border-t border-border bg-surface p-4">
        <Button
          variant="secondary"
          size="sm"
          onClick={() =>
            navigate({ to: "/organization/$memberId", params: { memberId: member.id } })
          }
        >
          <Maximize2 />
          Voir la fiche
        </Button>
      </div>
    </div>
  );
}
