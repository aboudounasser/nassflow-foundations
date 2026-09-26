import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * Ancienne adresse de System Settings, fusionné dans Paramètres (chantier 6).
 * Conservée pour les favoris jusqu'au chantier 12.
 */
export const Route = createFileRoute("/system-settings")({
  beforeLoad: () => {
    throw redirect({ to: "/settings", replace: true });
  },
});
