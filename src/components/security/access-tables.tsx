import { useNavigate } from "@tanstack/react-router";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MEMBER_ROLE, MEMBER_STATUS } from "@/lib/organization/meta";
import type {
  accessMatrix,
  agentPermissionsSummary,
  integrationPermissionsSummary,
} from "@/lib/security/aggregations";

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="min-w-0 border-border bg-card p-4">
      <p className="text-[14px] font-medium text-foreground">{title}</p>
      <p className="mt-1 text-[12px] text-muted-foreground">{description}</p>
      <div className="mt-4 min-w-0 overflow-x-auto">{children}</div>
    </Card>
  );
}

export function MembersAccessTable({ rows }: { rows: ReturnType<typeof accessMatrix> }) {
  const navigate = useNavigate();
  return (
    <Section
      title="Accès des membres"
      description="Rôles et statuts issus de l'annuaire Organization."
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Membre</TableHead>
            <TableHead>Rôle</TableHead>
            <TableHead>Département</TableHead>
            <TableHead>Statut</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => {
            const role = MEMBER_ROLE[row.role];
            const status = MEMBER_STATUS[row.status];
            const StatusIcon = status.icon;
            return (
              <TableRow
                key={row.memberId}
                className="cursor-pointer"
                onClick={() =>
                  navigate({ to: "/organization/$memberId", params: { memberId: row.memberId } })
                }
              >
                <TableCell className="text-foreground">{row.memberName}</TableCell>
                <TableCell>
                  <Badge variant={role.variant}>{role.label}</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">{row.department}</TableCell>
                <TableCell>
                  <Badge variant={status.variant}>
                    <StatusIcon aria-hidden="true" />
                    {status.label}
                  </Badge>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Section>
  );
}

export function AgentPermissionsTable({
  rows,
}: {
  rows: ReturnType<typeof agentPermissionsSummary>;
}) {
  const navigate = useNavigate();
  return (
    <Section
      title="Permissions par agent"
      description="Permissions sensibles = écriture, exécution ou validation."
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Agent</TableHead>
            <TableHead className="text-right">Permissions</TableHead>
            <TableHead className="text-right">Sensibles</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow
              key={row.agentId}
              className="cursor-pointer"
              onClick={() => navigate({ to: "/agents/$agentId", params: { agentId: row.agentId } })}
            >
              <TableCell className="text-foreground">{row.agentName}</TableCell>
              <TableCell className="text-right tabular-nums text-muted-foreground">
                {row.totalPermissions}
              </TableCell>
              <TableCell className="text-right">
                <Badge variant={row.writeOrHigher > 0 ? "warning" : "neutral"}>
                  {row.writeOrHigher}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Section>
  );
}

export function IntegrationPermissionsTable({
  rows,
}: {
  rows: ReturnType<typeof integrationPermissionsSummary>;
}) {
  const navigate = useNavigate();
  return (
    <Section
      title="Permissions par intégration"
      description="Portées accordées sur le total demandé par chaque intégration."
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Intégration</TableHead>
            <TableHead className="text-right">Accordées / total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow
              key={row.integrationId}
              className="cursor-pointer"
              onClick={() =>
                navigate({
                  to: "/integrations-hub/$integrationId",
                  params: { integrationId: row.integrationId },
                })
              }
            >
              <TableCell className="text-foreground">{row.integrationName}</TableCell>
              <TableCell className="text-right tabular-nums text-muted-foreground">
                {row.grantedCount} / {row.totalCount}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Section>
  );
}