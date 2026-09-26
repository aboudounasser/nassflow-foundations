import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MEMBER_ROLE, formatOrgDate, memberInitials } from "@/lib/organization/meta";
import type { OrgMember } from "@/lib/organization/types";
import { cn } from "@/lib/utils";

/**
 * Carte d'un membre : la zone principale mène à sa fiche. Le menu d'actions
 * est rendu à côté du lien, jamais dedans — un élément interactif ne peut pas
 * être imbriqué dans un `<a>`, et l'ouvrir ne doit pas naviguer.
 */
export function OrgMemberCard({
  member,
  compact = false,
  actions,
}: {
  member: OrgMember;
  compact?: boolean;
  actions?: ReactNode;
}) {
  const role = MEMBER_ROLE[member.role];

  return (
    <div className="relative">
      <Link
        to="/settings/members/$memberId"
        params={{ memberId: member.id }}
        className={cn(
          "flex w-full flex-col gap-3 rounded-lg border border-border bg-surface p-4 text-left transition-colors duration-150 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          compact && "gap-2 p-3",
        )}
      >
        <div className={cn("flex items-start gap-3", actions && "pr-9")}>
          <Avatar className="size-10 shrink-0">
            <AvatarFallback className="text-[12px]">{memberInitials(member)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[14px] font-medium text-foreground">{member.name}</p>
            <p className="truncate text-[12px] text-muted-foreground">{member.jobTitle}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1">
          <Badge variant={role.variant}>{role.label}</Badge>
        </div>

        {compact ? null : (
          <p className="truncate text-[12px] text-muted-foreground">{member.email}</p>
        )}
        <p className="text-[12px] text-muted-foreground">
          Arrivé·e le {formatOrgDate(member.joinedAt)}
        </p>
      </Link>
      {actions ? <div className="absolute right-1 top-1">{actions}</div> : null}
    </div>
  );
}

export function OrgMemberCardSkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 @2xl:grid-cols-2 @5xl:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="h-[168px] animate-pulse rounded-lg border border-border bg-card" />
      ))}
    </div>
  );
}
