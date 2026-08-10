import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type KeyboardEvent } from "react";

import { AuthLayout } from "@/components/auth/auth-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import * as authService from "@/services/auth";

const DESCRIPTION = "Connectez-vous à votre espace NASSFLOW OS.";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Connexion — NASSFLOW OS" },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: "Connexion — NASSFLOW OS" },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (pending) return;
    setPending(true);
    setError(null);
    try {
      await authService.signIn(email, password);
      await navigate({ to: "/" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Connexion impossible.");
    } finally {
      setPending(false);
    }
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") void submit();
  };

  return (
    <AuthLayout
      title="Connexion"
      description="Accédez à votre espace NASSFLOW OS."
      footer={
        <>
          Pas encore de compte ?{" "}
          <Link to="/signup" className="text-primary hover:underline">
            Créer un compte
          </Link>
        </>
      }
    >
      <div className="space-y-1.5">
        <Label htmlFor="login-email">E-mail</Label>
        <Input
          id="login-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={onKeyDown}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="login-password">Mot de passe</Label>
        <Input
          id="login-password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={onKeyDown}
        />
        <div className="flex justify-end">
          <Link to="/forgot-password" className="text-[12px] text-muted-foreground hover:underline">
            Mot de passe oublié ?
          </Link>
        </div>
      </div>

      {error ? (
        <p className="text-[13px] text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <Button className="w-full" disabled={pending} onClick={() => void submit()}>
        {pending ? "Un instant…" : "Se connecter"}
      </Button>
    </AuthLayout>
  );
}
