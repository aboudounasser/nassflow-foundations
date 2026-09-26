import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * Ancienne adresse de l'annuaire, fusionné dans Paramètres (chantier 6).
 * Conservée pour les favoris jusqu'au chantier 12.
 */
export const Route = createFileRoute("/organization/")({
  beforeLoad: () => {
    throw redirect({ to: "/settings", search: { tab: "members" }, replace: true });
  },
});
