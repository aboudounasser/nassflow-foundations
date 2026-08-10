import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import * as authService from "@/services/auth";

/** Écran temporaire — remplacé par le parcours d'onboarding en B3.2. */

function useAsyncAction() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async (fn: () => Promise<void>) => {
    setPending(true);
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Une erreur est survenue.");
    } finally {
      setPending(false);
    }
  };

  return { pending, error, run };
}

export function CreateOrganizationScreen({
  onCreated,
  onSignOut,
}: {
  onCreated: () => void;
  onSignOut: () => void;
}) {
  const [name, setName] = useState("");
  const { pending, error, run } = useAsyncAction();

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void run(async () => {
      await authService.createOrganization(name);
      onCreated();
    });
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <Card className="w-full max-w-sm space-y-4 p-6">
        <h1 className="text-[18px] font-semibold text-foreground">Créer votre organisation</h1>

        <form className="space-y-3" onSubmit={onSubmit}>
          <div className="space-y-1.5">
            <Label htmlFor="org-name">Nom de l&apos;organisation</Label>
            <Input id="org-name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <Button type="submit" className="w-full" disabled={pending}>
            Créer
          </Button>
        </form>

        {error ? <p className="text-[13px] text-destructive">{error}</p> : null}

        <Button type="button" variant="ghost" className="w-full" onClick={onSignOut}>
          Se déconnecter
        </Button>
      </Card>
    </main>
  );
}
