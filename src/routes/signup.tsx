import { Link, createFileRoute } from "@tanstack/react-router";
import { MailCheck } from "lucide-react";
import { useState, type KeyboardEvent } from "react";

import { AuthLayout } from "@/components/auth/auth-layout";
import { useRedirectIfAuthenticated } from "@/components/auth/use-redirect-if-authenticated";
import { Button } from "@/components/ui/button";
import { Input, PasswordInput } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import * as authService from "@/services/auth";

const DESCRIPTION = "Créez votre compte NASSFLOW OS en quelques secondes.";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Créer un compte — NASSFLOW OS" },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: "Créer un compte — NASSFLOW OS" },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  /** `invite` : jeton d'invitation propagé jusqu'au retour vers la connexion. */
  validateSearch: (search: Record<string, unknown>): { invite?: string | undefined } => ({
    invite: typeof search["invite"] === "string" && search["invite"] ? search["invite"] : undefined,
  }),
  component: SignupPage,
});

function SignupPage() {
  const { invite } = Route.useSearch();
  const checking = useRedirectIfAuthenticated();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const submit = async () => {
    if (pending) return;
    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    setPending(true);
    setError(null);
    try {
      await authService.signUp(email, password, fullName);
      setSent(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Création du compte impossible.");
    } finally {
      setPending(false);
    }
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") void submit();
  };

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <Skeleton className="h-24 w-full max-w-sm" />
      </div>
    );
  }

  if (sent) {
    return (
      <AuthLayout title="Vérifiez votre boîte mail" description="Votre compte est presque prêt.">
        <span className="flex size-12 items-center justify-center rounded-xl border border-border">
          <MailCheck className="size-5 text-primary" aria-hidden="true" />
        </span>
        <p className="text-[13px] text-muted-foreground">
          Nous avons envoyé un lien de confirmation à {email}. Cliquez dessus pour activer votre
          compte, puis connectez-vous.
        </p>
        <Link to="/login" search={{ invite }} className="text-[13px] text-primary hover:underline">
          Retour à la connexion
        </Link>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Créer un compte"
      description="Quelques secondes suffisent pour démarrer."
      footer={
        <>
          Déjà un compte ?{" "}
          <Link to="/login" search={{ invite }} className="text-primary hover:underline">
            Se connecter
          </Link>
        </>
      }
    >
      <div className="space-y-1.5">
        <Label htmlFor="signup-name">Nom complet</Label>
        <Input
          id="signup-name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          onKeyDown={onKeyDown}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="signup-email">E-mail</Label>
        <Input
          id="signup-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={onKeyDown}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="signup-password">Mot de passe</Label>
        <PasswordInput
          id="signup-password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={onKeyDown}
        />
        <p className="text-[12px] text-muted-foreground">Minimum 8 caractères.</p>
      </div>

      {error ? (
        <p className="text-[13px] text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <Button className="w-full" disabled={pending} onClick={() => void submit()}>
        {pending ? "Un instant…" : "Créer un compte"}
      </Button>
    </AuthLayout>
  );
}
