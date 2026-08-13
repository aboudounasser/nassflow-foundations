import { MoreVertical, Trash2, UserCog } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { useSession } from "@/components/providers/session-provider";
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
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRemoveMember, useUpdateMemberRole } from "@/lib/organization/queries";
import {
  MEMBER_ROLE,
  MEMBER_ROLE_ORDER,
  PRIVILEGED_ROLES,
  canAdministerMember,
} from "@/lib/organization/meta";
import type { MemberRole, OrgMember } from "@/lib/organization/types";

/**
 * Actions d'administration d'un membre.
 *
 * Les conditions d'affichage reproduisent exactement `membership_update` et
 * `membership_delete` : une action visible est une action autorisée. Proposer
 * un bouton que la base refusera ensuite reviendrait à afficher une erreur
 * incompréhensible à quelqu'un qui n'a rien fait de mal.
 */
export function MemberActionsMenu({ member }: { member: OrgMember }) {
  const { session } = useSession();
  const updateRole = useUpdateMemberRole();
  const removeMember = useRemoveMember();

  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [role, setRole] = useState<MemberRole>(member.role);
  const [roleError, setRoleError] = useState<string | null>(null);

  const currentRole = session.role;
  const isOwner = currentRole === "owner";
  const isSelf = member.userId !== undefined && member.userId === session.userId;

  // Même règle que celle qui décide d'afficher ce menu depuis l'annuaire.
  if (!member.membershipId || !canAdministerMember(currentRole, member)) return null;

  const membershipId = member.membershipId;
  const assignableRoles = isOwner
    ? MEMBER_ROLE_ORDER
    : MEMBER_ROLE_ORDER.filter((r) => !PRIVILEGED_ROLES.includes(r));
  const busy = updateRole.isPending || removeMember.isPending;

  const openRoleDialog = () => {
    setRole(member.role);
    setRoleError(null);
    setRoleDialogOpen(true);
  };

  const submitRole = () => {
    if (updateRole.isPending) return;
    setRoleError(null);
    updateRole.mutate(
      { membershipId, userId: member.userId, role },
      {
        onSuccess: () => {
          setRoleDialogOpen(false);
          toast.success(`${member.name} est désormais ${MEMBER_ROLE[role].label}`);
        },
        // Message rédigé côté PostgreSQL pour l'utilisateur final : affiché tel quel.
        onError: (e) => setRoleError(e instanceof Error ? e.message : "Modification impossible."),
      },
    );
  };

  const confirmRemove = () => {
    removeMember.mutate(
      { membershipId, userId: member.userId },
      {
        onSuccess: () => toast.success(`${member.name} a été retiré`),
        // Message rédigé côté PostgreSQL pour l'utilisateur final : affiché tel quel.
        onError: (e) => toast.error(e instanceof Error ? e.message : "Retrait impossible."),
      },
    );
    setRemoveDialogOpen(false);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="size-9"
            disabled={busy}
            aria-label={`Actions — ${member.name}`}
          >
            <MoreVertical />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={openRoleDialog}>
            <UserCog aria-hidden="true" />
            Changer le rôle
          </DropdownMenuItem>
          {/* Quitter soi-même relève de /account, pas d'un retrait administratif. */}
          {isSelf ? null : (
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onSelect={() => setRemoveDialogOpen(true)}
            >
              <Trash2 aria-hidden="true" />
              Retirer de l&apos;organisation
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Changer le rôle de {member.name}</DialogTitle>
            <DialogDescription>
              Le rôle détermine ce que cette personne peut consulter et modifier dans
              l&apos;organisation.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-1.5">
            <Label htmlFor="member-role">Rôle</Label>
            <Select value={role} onValueChange={(v) => setRole(v as MemberRole)}>
              <SelectTrigger id="member-role" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {assignableRoles.map((r) => (
                  <SelectItem key={r} value={r}>
                    {MEMBER_ROLE[r].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {roleError ? (
            <p className="text-[13px] text-destructive" role="alert">
              {roleError}
            </p>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              disabled={updateRole.isPending}
              onClick={() => setRoleDialogOpen(false)}
            >
              Annuler
            </Button>
            <Button
              type="button"
              loading={updateRole.isPending}
              disabled={role === member.role}
              onClick={submitRole}
            >
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Retirer {member.name} de l&apos;organisation ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette personne perdra immédiatement l&apos;accès à l&apos;organisation et à ses
              données. Vous pourrez l&apos;inviter à nouveau plus tard.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removeMember.isPending}>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRemove}>Retirer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
