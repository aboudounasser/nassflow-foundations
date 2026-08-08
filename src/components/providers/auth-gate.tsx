import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import * as authService from "@/services/auth";

/** Écrans temporaires de test — remplacés par le vrai parcours UX en B3. */

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

export function SignInScreen() {
  const [mode, setMode] = useState<"signIn" | "signUp">("signIn");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmSent, setConfirmSent] = useState(false);
  const { pending, error, run } = useAsyncAction();

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void run(async () => {
      if (mode === "signIn") {
        await authService.signIn(email, password);
      } else {
        await authService.signUp(email, password, fullName);
        setConfirmSent(true);
      }
    });
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <Card className="w-full max-w-sm space-y-4 p-6">
        <h1 className="text-[18px] font-semibold text-foreground">
          NASSFLOW<span className="text-primary"> OS</span>
        </h1>

        <div className="flex gap-2">
          <Button
            type="button"
            variant={mode === "signIn" ? "primary" : "secondary"}
            size="sm"
            onClick={() => setMode("signIn")}
          >
            Connexion
          </Button>
          <Button
            type="button"
            variant={mode === "signUp" ? "primary" : "secondary"}
            size="sm"
            onClick={() => setMode("signUp")}
          >
            Inscription
          </Button>
        </div>

        <form className="space-y-3" onSubmit={onSubmit}>
          {mode === "signUp" ? (
            <div className="space-y-1.5">
              <Label htmlFor="auth-name">Nom complet</Label>
              <Input
                id="auth-name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
          ) : null}

          <div className="space-y-1.5">
            <Label htmlFor="auth-email">E-mail</Label>
            <Input
              id="auth-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="auth-password">Mot de passe</Label>
            <Input
              id="auth-password"
              type="password"
              autoComplete={mode === "signIn" ? "current-password" : "new-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={pending}>
            {mode === "signIn" ? "Se connecter" : "Créer un compte"}
          </Button>
        </form>

        {confirmSent ? (
          <p className="text-[13px] text-muted-foreground">
            Vérifiez votre boîte mail pour confirmer votre adresse, puis connectez-vous.
          </p>
        ) : null}

        {error ? <p className="text-[13px] text-destructive">{error}</p> : null}
      </Card>
    </main>
  );
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
