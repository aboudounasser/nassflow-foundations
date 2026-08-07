import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { Compass, Home, RefreshCw, TriangleAlert } from "lucide-react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { AppShell } from "@/components/layout/app-shell";
import { SessionProvider } from "@/components/providers/session-provider";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="flex max-w-md flex-col items-center gap-2 text-center">
        <span className="flex size-12 items-center justify-center rounded-xl border border-border bg-card">
          <Compass className="size-5 text-muted-foreground" aria-hidden="true" />
        </span>
        <p className="mt-2 text-[40px] font-semibold leading-none text-foreground">404</p>
        <h1 className="mt-2 text-xl font-semibold text-foreground">Cette page n'existe pas</h1>
        <p className="mt-1 text-[14px] text-muted-foreground">
          Le lien est peut-être obsolète, ou la ressource a été archivée. Vérifiez l'adresse ou
          revenez au Mission Control.
        </p>
        <Button asChild className="mt-6">
          <Link to="/">
            <Home />
            Retour au Mission Control
          </Link>
        </Button>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  useEffect(() => {
    console.error(error);
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="flex max-w-md flex-col items-center gap-2 text-center">
        <span className="flex size-12 items-center justify-center rounded-xl border border-destructive/40 bg-card">
          <TriangleAlert className="size-5 text-destructive" aria-hidden="true" />
        </span>
        <h1 className="mt-2 text-xl font-semibold tracking-tight text-foreground">
          Cette page n'a pas pu se charger
        </h1>
        <p className="mt-1 text-[14px] text-muted-foreground">
          Une erreur inattendue s'est produite. Vous pouvez réessayer ou revenir au Mission Control.
          Si le problème persiste, contactez le Help Center.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Button
            onClick={() => {
              router.invalidate();
              reset();
            }}
          >
            <RefreshCw />
            Réessayer
          </Button>
          <Button asChild variant="secondary">
            <Link to="/">
              <Home />
              Retour au Mission Control
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "NASSFLOW OS" },
      {
        name: "description",
        content: "NASSFLOW OS — l'AI Operating System des entreprises.",
      },
      { property: "og:title", content: "NASSFLOW OS" },
      {
        property: "og:description",
        content: "NASSFLOW OS — l'AI Operating System des entreprises.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap",
      },
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <AppShell>
          {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
          <Outlet />
        </AppShell>
      </SessionProvider>
      <Toaster />
    </QueryClientProvider>
  );
}
