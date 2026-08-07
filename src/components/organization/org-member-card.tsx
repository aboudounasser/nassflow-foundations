import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MEMBER_ROLE, MEMBER_STATUS, formatOrgDate } from "@/lib/organization/meta";
import type { OrgMember } from "@/lib/organization/types";
import { cn } from "@/lib/utils";

export function OrgMemberCard({
  member,
  selected = false,
  compact = false,
  onSelect,
}: {
  member: OrgMember;
  selected?: boolean;
  compact?: boolean;
  onSelect?: (member: OrgMember) => void;
}) {
  const role = MEMBER_ROLE[member.role];
  const status = MEMBER_STATUS[member.status];
  const StatusIcon = status.icon;

  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={() => onSelect?.(member)}
      className={cn(
        "flex w-full cursor-pointer flex-col gap-3 rounded-lg border bg-surface p-4 text-left transition-colors duration-150 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        selected ? "border-primary" : "border-border",
        compact && "gap-2 p-3",
      )}
    >
      <div className="flex items-start gap-3">
        <Avatar className="size-10 shrink-0">
          <AvatarFallback className="text-[12px]">{member.avatar}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-medium text-foreground">{member.name}</p>
          <p className="truncate text-[12px] text-muted-foreground">{member.jobTitle}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1">
        <Badge variant="info">{member.department}</Badge>
        <Badge variant={role.variant}>{role.label}</Badge>
        <Badge variant={status.variant}>
          <StatusIcon aria-hidden="true" />
          {status.label}
        </Badge>
      </div>

      {compact ? null : (
        <p className="truncate text-[12px] text-muted-foreground">{member.email}</p>
      )}
      <p className="text-[12px] text-muted-foreground">
        Arrivé·e le {formatOrgDate(member.joinedAt)}
      </p>
    </button>
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
