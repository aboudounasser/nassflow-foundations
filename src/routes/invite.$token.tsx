import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Building2, MailX, TriangleAlert } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AuthLayout } from "@/components/auth/auth-layout";
import { ACTIVE_ORG_KEY } from "@/components/providers/session-provider";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useInvitationPreview } from "@/lib/invitations/queries";
import * as authService from "@/services/auth";
import * as invitationsService from "@/services/invitations";

const DESCRIPTION = "Rejoignez une organisation NASSFLOW OS sur invitation.";

export const Route = createFileRoute("/invite/$token")({
  head: () => ({
    meta: [
      { title: "Invitation — NASSFLOW OS" },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: "Invitation — NASSFLOW OS" },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: InvitePage,
});

/** Écran d'erreur commun aux invitations introuvables, expirées ou déjà acceptées. */
function InvitationNotice({ title, description }: { title: string; description: string }) {
  return (
    <AuthLayout title={title} description={description}>
      <span className="flex size-12 items-center justify-center rounded-xl border border-border">
        <MailX className="size-5 text-muted-foreground" aria-hidden="true" />
      </span>
      <Button asChild className="w-full">
        <Link to="/login">Aller à la connexion</Link>
      </Button>
    </AuthLayout>
  );
}

function InvitePage() {
  const { token } = Route.useParams();
  const navigate = useNavigate();
  const previewQuery = useInvitationPreview(token);

  // Page publique : hors SessionProvider, la session se lit directement.
  const userQuery = useQuery({
    queryKey: ["auth", "current-user"],
    queryFn: () => authService.getCurrentUser(),
    retry: false,
  });

  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const preview = previewQuery.data ?? null;

  const join = async () => {
    if (joining) return;
    setJoining(true);
    setError(null);
    try {
      const organization = await invitationsService.acceptInvitation(token);
      // Désigne l'organisation rejointe avant que SessionProvider ne monte :
      // sans cela il retomberait sur la première appartenance par ordre alphabétique.
      window.localStorage.setItem(ACTIVE_ORG_KEY, organization.id);
      toast.success(`Vous avez rejoint ${organization.name}`);
      await navigate({ to: "/" });
    } catch (e) {
      // Message rédigé côté PostgreSQL pour l'utilisateur final : affiché tel quel.
      setError(e instanceof Error ? e.message : "Cette invitation n'a pas pu être acceptée.");
    } finally {
      setJoining(false);
    }
  };

  if (previewQuery.isPending || userQuery.isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <Skeleton className="h-24 w-full max-w-sm" />
      </div>
    );
  }

  if (previewQuery.isError || !preview) {
    return (
      <InvitationNotice
        title="Invitation introuvable"
        description="Ce lien d'invitation n'est pas valide. Demandez à l'organisation de vous en envoyer un nouveau."
      />
    );
  }

  if (preview.accepted) {
    return (
      <InvitationNotice
        title="Invitation déjà acceptée"
        description={`Cette invitation à rejoindre ${preview.organizationName} a déjà été utilisée. Connectez-vous pour accéder à l'organisation.`}
      />
    );
  }

  if (preview.expired) {
    return (
      <InvitationNotice
        title="Invitation expirée"
        description={`Ce lien pour rejoindre ${preview.organizationName} n'est plus valide. Demandez une nouvelle invitation.`}
      />
    );
  }

  const isAuthenticated = userQuery.data !== null;

  return (
    <AuthLayout
      title={`Vous êtes invité à rejoindre ${preview.organizationName}`}
      description={`L'invitation a été émise pour ${preview.email}.`}
      footer={
        isAuthenticated ? null : (
          <>
            Vous serez ramené ici après authentification pour finaliser votre arrivée dans{" "}
            {preview.organizationName}.
          </>
        )
      }
    >
      <span className="flex size-12 items-center justify-center rounded-xl border border-border">
        <Building2 className="size-5 text-primary" aria-hidden="true" />
      </span>

      {isAuthenticated ? (
        <Button className="w-full" loading={joining} onClick={() => void join()}>
          Rejoindre {preview.organizationName}
        </Button>
      ) : (
        <div className="flex flex-col gap-2">
          <Button asChild className="w-full">
            <Link to="/login" search={{ invite: token }}>
              Se connecter
            </Link>
          </Button>
          <Button asChild variant="secondary" className="w-full">
            <Link to="/signup" search={{ invite: token }}>
              Créer un compte
            </Link>
          </Button>
        </div>
      )}

      {error ? (
        <p className="flex items-start gap-2 text-[13px] text-destructive" role="alert">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {error}
        </p>
      ) : null}
    </AuthLayout>
  );
}
