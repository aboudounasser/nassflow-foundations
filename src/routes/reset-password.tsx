import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type KeyboardEvent } from "react";
import { toast } from "sonner";

import { AuthLayout } from "@/components/auth/auth-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import * as authService from "@/services/auth";

const DESCRIPTION = "Définissez un nouveau mot de passe pour votre compte NASSFLOW OS.";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Nouveau mot de passe — NASSFLOW OS" },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: "Nouveau mot de passe — NASSFLOW OS" },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
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
      toast.success("Mot de passe mis à jour. Connectez-vous.");
      await navigate({ to: "/login" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Mise à jour impossible.");
    } finally {
      setPending(false);
    }
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") void submit();
  };

  return (
    <AuthLayout
      title="Nouveau mot de passe"
      description="Choisissez un mot de passe pour votre compte."
    >
      <div className="space-y-1.5">
        <Label htmlFor="reset-password">Nouveau mot de passe</Label>
        <Input
          id="reset-password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={onKeyDown}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="reset-confirmation">Confirmation</Label>
        <Input
          id="reset-confirmation"
          type="password"
          autoComplete="new-password"
          value={confirmation}
          onChange={(e) => setConfirmation(e.target.value)}
          onKeyDown={onKeyDown}
        />
      </div>

      {error ? (
        <p className="text-[13px] text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <Button className="w-full" disabled={pending} onClick={() => void submit()}>
        {pending ? "Un instant…" : "Mettre à jour"}
      </Button>
    </AuthLayout>
  );
}