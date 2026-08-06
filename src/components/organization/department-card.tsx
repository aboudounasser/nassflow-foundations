import { useNavigate } from "@tanstack/react-router";
import { Bot, Users } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { AgentDetail } from "@/lib/agents/types";
import type { Department, OrgMember } from "@/lib/organization/types";

export function DepartmentCard({
  department,
  lead,
  members,
  agents,
  onSelect,
}: {
  department: Department;
  lead: OrgMember | null;
  members: OrgMember[];
  agents: AgentDetail[];
  onSelect: (department: Department) => void;
}) {
  const navigate = useNavigate();

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(department)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(department);
        }
      }}
      className="flex cursor-pointer flex-col gap-3 rounded-lg border border-border bg-surface p-4 text-left transition-colors duration-150 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="min-w-0 space-y-1">
        <p className="truncate text-[14px] font-medium text-foreground">{department.name}</p>
        <p className="text-[12px] leading-5 text-muted-foreground">{department.description}</p>
      </div>

      <div className="flex flex-wrap items-center gap-1">
        <Badge variant="neutral">
          <Users aria-hidden="true" />
          {members.length} humain{members.length > 1 ? "s" : ""}
        </Badge>
        <Badge variant="primary">
          <Bot aria-hidden="true" />
          {agents.length} agent{agents.length > 1 ? "s" : ""} IA
        </Badge>
      </div>

      <p className="truncate text-[12px] text-muted-foreground">
        Responsable · {lead ? `${lead.name} — ${lead.jobTitle}` : "Non défini"}
      </p>

      {agents.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          {agents.map((agent) => (
            <button
              key={agent.id}
              type="button"
              title={`${agent.name} — ${agent.role}`}
              aria-label={`Ouvrir la fiche de ${agent.name}`}
              onClick={(e) => {
                e.stopPropagation();
                navigate({ to: "/agents/$agentId", params: { agentId: agent.id } });
              }}
              className="cursor-pointer rounded-full transition-opacity duration-150 hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Avatar className="size-8">
                <AvatarFallback className="text-[10px]">{agent.avatar}</AvatarFallback>
              </Avatar>
            </button>
          ))}
        </div>
      ) : (
        <p className="text-[12px] text-muted-foreground/70">
          Aucun agent IA rattaché à ce département.
        </p>
      )}
    </div>
  );
}

export function DepartmentSkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 @2xl:grid-cols-2 @5xl:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-[190px] rounded-lg" />
      ))}
    </div>
  );
}