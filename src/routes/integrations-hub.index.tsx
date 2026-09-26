import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { toast } from "sonner";

import { ConnectedAccountsSection } from "@/components/integrations/connected-accounts-section";
import { ModulePage } from "@/components/layout/page-header";
import { gmailCallbackToast, hubspotCallbackToast } from "@/lib/integrations-oauth/meta";

const DESCRIPTION =
  "Les comptes externes raccordés à votre organisation : Gmail pour l'analyse des e-mails, HubSpot pour l'envoi des prospects au CRM.";

export const Route = createFileRoute("/integrations-hub/")({
  head: () => ({
    meta: [
      { title: "Integrations Hub — NASSFLOW OS" },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: "Integrations Hub — NASSFLOW OS" },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  /**
   * Les callbacks OAuth renvoient l'issue du parcours dans l'URL :
   * `gmail-oauth-callback` dans `?gmail=` (+ `&email=`),
   * `hubspot-oauth-callback` dans `?hubspot=` (+ `&portal=`).
   */
  validateSearch: (
    search: Record<string, unknown>,
  ): {
    gmail?: string | undefined;
    email?: string | undefined;
    hubspot?: string | undefined;
    portal?: string | undefined;
  } => ({
    gmail: typeof search["gmail"] === "string" ? search["gmail"] : undefined,
    email: typeof search["email"] === "string" ? search["email"] : undefined,
    hubspot: typeof search["hubspot"] === "string" ? search["hubspot"] : undefined,
    // Un hub_id est numérique : l'analyse de l'URL peut le livrer en nombre.
    portal:
      typeof search["portal"] === "string" || typeof search["portal"] === "number"
        ? String(search["portal"])
        : undefined,
  }),
  component: Page,
});

function Page() {
  const { gmail, email, hubspot, portal } = Route.useSearch();
  const navigate = useNavigate();
  const callbackHandled = useRef(false);

  /**
   * Retour de Google ou de HubSpot : un toast, puis nettoyage des paramètres.
   * Sans ce retrait, un simple rafraîchissement rejouerait le message. Le
   * garde-fou couvre le double montage des effets en développement.
   */
  useEffect(() => {
    if ((!gmail && !hubspot) || callbackHandled.current) return;
    callbackHandled.current = true;

    const { tone, message } = gmail
      ? gmailCallbackToast(gmail, email ?? null)
      : hubspotCallbackToast(hubspot ?? "", portal ?? null);
    if (tone === "success") toast.success(message);
    else toast.error(message);

    void navigate({ to: "/integrations-hub", search: {}, replace: true });
  }, [gmail, email, hubspot, portal, navigate]);

  return (
    <>
      <ModulePage title="Integrations Hub" description={DESCRIPTION} />

      <section className="col-span-12 min-w-0">
        <ConnectedAccountsSection />
      </section>
    </>
  );
}
