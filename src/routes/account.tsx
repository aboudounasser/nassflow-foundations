import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { useSession } from "@/components/providers/session-provider";
import { SettingsCard } from "@/components/settings/settings-rows";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import * as authService from "@/services/auth";

const DESCRIPTION = "Gérez votre profil, votre mot de passe et vos organisations dans NASSFLOW OS.";

export const Route = createFileRoute("/account")({
  head: () => ({
    meta: [
      { title: "Compte — NASSFLOW OS" },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: "Compte — NASSFLOW OS" },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Page() {
  const { session, organizations, refresh, switchOrganization } = useSession();

  return (
    <>
      <section className="col-span-12 min-w-0">
        <h1 className="text-foreground">Compte</h1>
        <p className="mt-2 max-w-[640px] text-[16px] text-muted-foreground">{DESCRIPTION}</p>
      </section>

      <section className="col-span-12 flex min-w-0 flex-col gap-4">
        <ProfileSection
          name={session.name}
          jobTitle={session.jobTitle}
          email={session.email}
          onSaved={refresh}
        />
        <SecuritySection />
        <OrganizationsSection
          organizations={organizations}
          activeId={session.organization.id}
          activeRole={session.role}
          onChanged={refresh}
          onSwitch={switchOrganization}
        />
        <DangerSection />
      </section>
    </>
  );
}

function ProfileSection({
  name,
  jobTitle,
  email,
  onSaved,
}: {
  name: string;
  jobTitle: string;
  email: string;
  onSaved: () => Promise<void>;
}) {
  const [fullName, setFullName] = useState(name);
  const [job, setJob] = useState(jobTitle);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    if (pending) return;
    setPending(true);
    setError(null);
    try {
      await authService.updateProfile({ fullName, jobTitle: job });
      await onSaved();
      toast.success("Profil mis à jour.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Enregistrement impossible.");
    } finally {
      setPending(false);
    }
  };

  return (
    <SettingsCard title="Profil">
      <div className="flex flex-col gap-4 pt-3">
        <div className="space-y-1.5">
          <Label htmlFor="account-name">Nom complet</Label>
          <Input id="account-name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="account-job">Poste</Label>
          <Input id="account-job" value={job} onChange={(e) => setJob(e.target.value)} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="account-email">E-mail</Label>
          <Input id="account-email" value={email} readOnly disabled />
          <p className="text-[12px] text-muted-foreground">
            Contactez le support pour modifier votre adresse.
          </p>
        </div>

        {error ? (
          <p className="text-[13px] text-destructive" role="alert">
            {error}
          </p>
        ) : null}

        <div className="flex justify-end">
          <Button size="sm" disabled={pending} onClick={() => void save()}>
            {pending ? "Un instant…" : "Enregistrer"}
          </Button>
        </div>
      </div>
    </SettingsCard>
  );
}

function SecuritySection() {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    if (pending) return;
    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    if (password !== confirmation) {
      setError("Les deux mots de passe ne correspondent pas.");
      return;
    }
    setPending(true);
    setError(null);
    try {
      await authService.updatePassword(password);
      setPassword("");
      setConfirmation("");
      toast.success("Mot de passe mis à jour.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Mise à jour impossible.");
    } finally {
      setPending(false);
    }
  };

  return (
    <SettingsCard title="Sécurité">
      <div className="flex flex-col gap-4 pt-3">
        <div className="space-y-1.5">
          <Label htmlFor="account-password">Nouveau mot de passe</Label>
          <Input
            id="account-password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="account-confirmation">Confirmation</Label>
          <Input
            id="account-confirmation"
            type="password"
            autoComplete="new-password"
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
          />
          <p className="text-[12px] text-muted-foreground">Minimum 8 caractères.</p>
        </div>

        {error ? (
          <p className="text-[13px] text-destructive" role="alert">
            {error}
          </p>
        ) : null}

        <div className="flex justify-end">
          <Button size="sm" disabled={pending} onClick={() => void save()}>
            {pending ? "Un instant…" : "Mettre à jour le mot de passe"}
          </Button>
        </div>
      </div>
    </SettingsCard>
  );
}

function OrganizationsSection({
  organizations,
  activeId,
  activeRole,
  onChanged,
  onSwitch,
}: {
  organizations: { id: string; name: string }[];
  activeId: string;
  activeRole: string;
  onChanged: () => Promise<void>;
  onSwitch: (id: string) => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [roles, setRoles] = useState<Record<string, string>>({});
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [createPending, setCreatePending] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const loadRoles = useCallback(async () => {
    try {
      const entries = await authService.getMemberships();
      setRoles(Object.fromEntries(entries.map((e) => [e.organization.id, e.role as string])));
    } catch {
      setRoles({});
    }
  }, []);

  useEffect(() => {
    void loadRoles();
  }, [loadRoles, organizations]);

  const leave = async (id: string) => {
    setPendingId(id);
    setError(null);
    try {
      await authService.leaveOrganization(id);
      await onChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Départ impossible.");
    } finally {
      setPendingId(null);
    }
  };

  const remove = async (id: string) => {
    setDeletingId(id);
    setDeleteError(null);
    try {
      await authService.deleteOrganization(id);
      await onChanged();
      toast.success("Organisation supprimée.");
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : "Suppression impossible.");
    } finally {
      setDeletingId(null);
    }
  };

  const create = async () => {
    if (createPending) return;
    if (name.trim().length < 2) {
      setCreateError("Le nom doit contenir au moins 2 caractères.");
      return;
    }
    setCreatePending(true);
    setCreateError(null);
    try {
      await authService.createOrganization(name.trim());
      await onChanged();
      setName("");
      setCreating(false);
      toast.success("Organisation créée.");
    } catch (e) {
      setCreateError(e instanceof Error ? e.message : "Création impossible.");
    } finally {
      setCreatePending(false);
    }
  };

  return (
    <SettingsCard title="Organisations">
      <div className="flex flex-col gap-2 pt-3">
        {organizations.map((organization) => {
          const isActive = organization.id === activeId;
          const isOwner = (isActive ? activeRole : roles[organization.id]) === "owner";
          const deleteButton = isOwner ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" disabled={deletingId === organization.id}>
                  Supprimer
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Supprimer {organization.name} ?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Cette action est définitive. L&apos;organisation, ses appartenances et toutes
                    ses données seront supprimées. Cette action ne peut pas être annulée.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction onClick={() => void remove(organization.id)}>
                    Supprimer définitivement
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : null;
          return (
            <div
              key={organization.id}
              className="flex flex-wrap items-center justify-between gap-2 border-b border-border py-3 last:border-b-0"
            >
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <p className="text-[14px] text-foreground">{organization.name}</p>
                {isActive ? <Badge variant="primary">{activeRole}</Badge> : null}
              </div>
              {isActive ? (
                <div className="flex items-center gap-2">
                  <span className="text-[12px] text-muted-foreground">Organisation active</span>
                  {deleteButton}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => onSwitch(organization.id)}>
                    Basculer
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={pendingId === organization.id}
                      >
                        Quitter
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Quitter {organization.name} ?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Vous perdrez l&apos;accès aux données de cette organisation. Un membre
                          pourra vous réinviter plus tard.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction onClick={() => void leave(organization.id)}>
                          Quitter
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  {deleteButton}
                </div>
              )}
            </div>
          );
        })}

        {error ? (
          <p className="text-[13px] text-destructive" role="alert">
            {error}
          </p>
        ) : null}

        {deleteError ? (
          <p className="text-[13px] text-destructive" role="alert">
            {deleteError}
          </p>
        ) : null}

        <div className="mt-2 border-t border-border pt-4">
          {creating ? (
            <div className="flex flex-col gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="account-new-org">Nom de l&apos;organisation</Label>
                <Input
                  id="account-new-org"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              {createError ? (
                <p className="text-[13px] text-destructive" role="alert">
                  {createError}
                </p>
              ) : null}
              <div className="flex justify-end gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setCreating(false);
                    setCreateError(null);
                    setName("");
                  }}
                >
                  Annuler
                </Button>
                <Button size="sm" disabled={createPending} onClick={() => void create()}>
                  {createPending ? "Un instant…" : "Créer"}
                </Button>
              </div>
            </div>
          ) : (
            <Button variant="secondary" size="sm" onClick={() => setCreating(true)}>
              Créer une organisation
            </Button>
          )}
        </div>
      </div>
    </SettingsCard>
  );
}

function DangerSection() {
  return (
    <SettingsCard title="Supprimer mon compte">
      <div className="flex flex-col gap-3 pt-3">
        <p className="text-[13px] text-muted-foreground">
          La suppression de votre compte est définitive : profil, appartenances et préférences
          seront effacés sans possibilité de restauration.
        </p>
        <div className="flex justify-end">
          <Button variant="destructive" size="sm" disabled title="Bientôt disponible">
            Supprimer mon compte
          </Button>
        </div>
      </div>
    </SettingsCard>
  );
}
