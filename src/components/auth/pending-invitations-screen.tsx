import { Building2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AuthLayout } from "@/components/auth/auth-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { MyPendingInvitation } from "@/lib/invitations/types";
import { MEMBER_ROLE } from "@/lib/organization/meta";
import * as invitationsService from "@/services/invitations";

const DESCRIPTION =
  "Une organisation vous attend. Rejoignez-la, ou créez la vôtre si vous préférez démarrer seul.";

export function PendingInvitationsScreen({
  invitations,
  onJoined,
  onCreateOrganization,
  onSignOut,
}: {
  invitations: MyPendingInvitation[];
  /** L'appelant persiste l'organisation active puis recharge la session. */
  onJoined: (organizationId: string) => void;
  onCreateOrganization: () => void;
  onSignOut: () => void;
}) {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const join = (invitation: MyPendingInvitation) => {
    if (pendingId) return;
    setPendingId(invitation.invitationId);
    setError(null);
    void (async () => {
      try {
        const organization = await invitationsService.acceptInvitationById(invitation.invitationId);
        toast.success(`Vous avez rejoint ${organization.name}`);
        onJoined(organization.id);
      } catch (e) {
        // Message rédigé côté PostgreSQL pour l'utilisateur final : affiché tel quel.
        setError(e instanceof Error ? e.message : "Cette invitation n'a pas pu être acceptée.");
        setPendingId(null);
      }
    })();
  };

  return (
    <AuthLayout
      title="Vous avez une invitation"
      description={DESCRIPTION}
      footer={
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={onCreateOrganization}
            className="text-[13px] text-muted-foreground underline-offset-4 transition-colors duration-150 hover:text-foreground hover:underline"
          >
            Créer plutôt ma propre organisation
          </button>
          <Button type="button" variant="ghost" className="w-full" onClick={onSignOut}>
            Se déconnecter
          </Button>
        </div>
      }
    >
      <ul className="flex flex-col gap-2">
        {invitations.map((invitation) => {
          const role = MEMBER_ROLE[invitation.role];
          return (
            <li
              key={invitation.invitationId}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-surface p-3"
            >
              <div className="flex min-w-0 items-center gap-2">
                <Building2 className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
                <div className="min-w-0">
                  <p className="truncate text-[14px] text-foreground">
                    {invitation.organizationName}
                  </p>
                  <Badge variant={role.variant} className="mt-1">
                    {role.label}
                  </Badge>
                </div>
              </div>
              <Button
                type="button"
                size="sm"
                loading={pendingId === invitation.invitationId}
                disabled={pendingId !== null && pendingId !== invitation.invitationId}
                onClick={() => join(invitation)}
              >
                Rejoindre
              </Button>
            </li>
          );
        })}
      </ul>

      {error ? (
        <p className="text-[13px] text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </AuthLayout>
  );
}
