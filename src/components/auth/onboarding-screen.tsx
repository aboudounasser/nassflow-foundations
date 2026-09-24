import { useState, type FormEvent } from "react";

import { AuthLayout } from "@/components/auth/auth-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import * as authService from "@/services/auth";

const DESCRIPTION =
  "C'est l'espace de travail de votre entreprise dans NASSFLOW OS. Vous pourrez le modifier plus tard.";

export function OnboardingScreen({
  onCreated,
  onSignOut,
}: {
  onCreated: () => void;
  onSignOut: () => void;
}) {
  const [name, setName] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending) return;
    if (name.trim().length < 2) {
      setError("Le nom doit contenir au moins 2 caractères.");
      return;
    }
    setPending(true);
    setError(null);
    void (async () => {
      try {
        await authService.createOrganization(name.trim());
        onCreated();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Création impossible.");
      } finally {
        setPending(false);
      }
    })();
  };

  return (
    <AuthLayout
      title="Créer votre organisation"
      description={DESCRIPTION}
      footer={
        <Button type="button" variant="ghost" className="w-full" onClick={onSignOut}>
          Se déconnecter
        </Button>
      }
    >
      <form className="flex flex-col gap-4" onSubmit={onSubmit}>
        <div className="space-y-1.5">
          <Label htmlFor="org-name">Nom de l&apos;organisation</Label>
          <Input
            id="org-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="organization"
          />
        </div>

        {error ? (
          <p className="text-[13px] text-destructive" role="alert">
            {error}
          </p>
        ) : null}

        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Un instant…" : "Créer l'organisation"}
        </Button>
      </form>
    </AuthLayout>
  );
}
