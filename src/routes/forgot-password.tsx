import { Link, createFileRoute } from "@tanstack/react-router";
import { useState, type KeyboardEvent } from "react";

import { AuthLayout } from "@/components/auth/auth-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import * as authService from "@/services/auth";

const DESCRIPTION = "Réinitialisez le mot de passe de votre compte NASSFLOW OS.";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Mot de passe oublié — NASSFLOW OS" },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: "Mot de passe oublié — NASSFLOW OS" },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const submit = async () => {
    if (pending) return;
    setPending(true);
    setError(null);
    try {
      await authService.resetPassword(email);
      setSent(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Envoi impossible.");
    } finally {
      setPending(false);
    }
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") void submit();
  };

  return (
    <AuthLayout
      title="Mot de passe oublié"
      description="Nous vous enverrons un lien de réinitialisation."
      footer={
        <Link to="/login" className="text-primary hover:underline">
          Retour à la connexion
        </Link>
      }
    >
      {sent ? (
        <p className="text-[13px] text-muted-foreground">
          Si un compte existe pour cette adresse, un lien vient d&apos;être envoyé.
        </p>
      ) : (
        <>
          <div className="space-y-1.5">
            <Label htmlFor="forgot-email">E-mail</Label>
            <Input
              id="forgot-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={onKeyDown}
            />
          </div>

          {error ? (
            <p className="text-[13px] text-destructive" role="alert">
              {error}
            </p>
          ) : null}

          <Button className="w-full" disabled={pending} onClick={() => void submit()}>
            {pending ? "Un instant…" : "Envoyer le lien"}
          </Button>
        </>
      )}
    </AuthLayout>
  );
}