import { Check, Copy, Mail, MailPlus, Send } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import { useSession } from "@/components/providers/session-provider";
import { WidgetShell } from "@/components/dashboard/widget-shell";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useCreateInvitation,
  useInvitations,
  useRevokeInvitation,
} from "@/lib/invitations/queries";
import type { Invitation } from "@/lib/invitations/types";
import { MEMBER_ROLE, MEMBER_ROLE_ORDER, formatOrgDate } from "@/lib/organization/meta";
import type { MemberRole } from "@/lib/organization/types";
import type { MemberRoleDb } from "@/lib/supabase/database.types";

/** Seul un owner peut déléguer les rôles owner et admin. */
const PRIVILEGED_ROLES: MemberRole[] = ["owner", "admin"];

function InvitationsSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <Skeleton className="h-16 w-full rounded-lg" />
      <Skeleton className="h-16 w-full rounded-lg" />
      <Skeleton className="h-16 w-full rounded-lg" />
    </div>
  );
}

function InviteLinkCard({ link }: { link: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast.success("Lien d'invitation copié");
    } catch {
      toast.error("Copie impossible. Sélectionnez le lien pour le copier à la main.");
    }
  };

  return (
    <Card className="border-border bg-surface p-3">
      <p className="text-[14px] text-foreground">Invitation créée</p>
      <p className="mt-1 text-[12px] text-muted-foreground">
        L&apos;e-mail n&apos;est pas encore envoyé automatiquement : transmettez ce lien à la
        personne invitée.
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <code className="min-w-0 flex-1 truncate rounded-lg border border-border bg-card px-3 py-2 font-mono text-[12px] text-muted-foreground">
          {link}
        </code>
        <Button type="button" size="sm" variant="secondary" onClick={() => void copy()}>
          {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
          {copied ? "Copié" : "Copier"}
        </Button>
      </div>
    </Card>
  );
}

function InviteForm({ canGrantPrivileged }: { canGrantPrivileged: boolean }) {
  const createMutation = useCreateInvitation();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<MemberRoleDb>("member");
  const [error, setError] = useState<string | null>(null);
  const [link, setLink] = useState<string | null>(null);

  const roles = canGrantPrivileged
    ? MEMBER_ROLE_ORDER
    : MEMBER_ROLE_ORDER.filter((r) => !PRIVILEGED_ROLES.includes(r));

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (createMutation.isPending) return;
    setError(null);
    setLink(null);

    createMutation.mutate(
      { email: email.trim(), role },
      {
        onSuccess: (result) => {
          setEmail("");
          if (result.alreadyMember) {
            toast.success("Personne ajoutée à l'organisation");
            return;
          }
          if (result.token) {
            setLink(`${window.location.origin}/invite/${result.token}`);
          }
        },
        // Message rédigé côté PostgreSQL pour l'utilisateur final : affiché tel quel.
        onError: (e) => setError(e instanceof Error ? e.message : "Invitation impossible."),
      },
    );
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 @2xl:flex-row @2xl:items-end">
        <div className="min-w-0 flex-1 space-y-1.5">
          <Label htmlFor="invite-email">E-mail</Label>
          <Input
            id="invite-email"
            type="email"
            required
            autoComplete="off"
            placeholder="prenom.nom@entreprise.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="invite-role">Rôle</Label>
          <Select value={role} onValueChange={(v) => setRole(v as MemberRoleDb)}>
            <SelectTrigger id="invite-role" className="w-full @2xl:w-[190px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {roles.map((r) => (
                <SelectItem key={r} value={r}>
                  {MEMBER_ROLE[r].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button type="submit" loading={createMutation.isPending}>
          <Send aria-hidden="true" />
          Inviter
        </Button>
      </div>

      {error ? (
        <p className="text-[13px] text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      {link ? <InviteLinkCard link={link} /> : null}
    </form>
  );
}

function InvitationRow({ invitation, onRevoke }: { invitation: Invitation; onRevoke: () => void }) {
  const role = MEMBER_ROLE[invitation.role];

  return (
    <li className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-surface p-3">
      <div className="flex min-w-0 items-center gap-2">
        <Mail className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
        <div className="min-w-0">
          <p className="truncate text-[14px] text-foreground">{invitation.email}</p>
          <p className="text-[12px] text-muted-foreground">
            Expire le {formatOrgDate(invitation.expiresAt)}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Badge variant={role.variant}>{role.label}</Badge>
        <Button type="button" size="sm" variant="ghost" onClick={onRevoke}>
          Révoquer
        </Button>
      </div>
    </li>
  );
}

export function InvitationsSection() {
  const { session } = useSession();
  const invitationsQuery = useInvitations();
  const revokeMutation = useRevokeInvitation();
  const [target, setTarget] = useState<Invitation | null>(null);

  const invitations = invitationsQuery.data ?? [];

  const state = invitationsQuery.isError
    ? "error"
    : invitationsQuery.isPending
      ? "loading"
      : invitations.length === 0
        ? "empty"
        : "success";

  const revoke = (invitation: Invitation) => {
    revokeMutation.mutate(invitation.id, {
      onSuccess: () => toast.success(`Invitation de ${invitation.email} révoquée`),
      // Message rédigé côté PostgreSQL pour l'utilisateur final : affiché tel quel.
      onError: (e) => toast.error(e instanceof Error ? e.message : "Révocation impossible."),
    });
    setTarget(null);
  };

  return (
    <>
      <WidgetShell
        title="Invitations"
        description="Invitations en attente d'acceptation dans cette organisation."
        icon={MailPlus}
        state={state}
        showMenu={false}
        onRetry={() => void invitationsQuery.refetch()}
        emptyIcon={MailPlus}
        emptyTitle="Aucune invitation en attente"
        emptyDescription="Invitez un collaborateur avec le formulaire ci-dessous."
        skeleton={<InvitationsSkeleton />}
      >
        <ul className="flex flex-col gap-3">
          {invitations.map((invitation) => (
            <InvitationRow
              key={invitation.id}
              invitation={invitation}
              onRevoke={() => setTarget(invitation)}
            />
          ))}
        </ul>
      </WidgetShell>

      <Card className="@container mt-4 border-border bg-card p-4">
        <p className="text-[14px] font-medium text-foreground">Inviter un collaborateur</p>
        <div className="mt-3">
          <InviteForm canGrantPrivileged={session.role === "owner"} />
        </div>
      </Card>

      <AlertDialog open={target !== null} onOpenChange={(open) => !open && setTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Révoquer l&apos;invitation de {target?.email} ?</AlertDialogTitle>
            <AlertDialogDescription>
              Le lien déjà transmis cessera immédiatement de fonctionner. Vous pourrez envoyer une
              nouvelle invitation à cette adresse.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={() => target && revoke(target)}>Révoquer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
