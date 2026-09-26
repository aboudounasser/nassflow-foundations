import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * Ancienne adresse de la fiche membre, déplacée sous Paramètres (chantier 6).
 * Conservée pour les favoris jusqu'au chantier 12.
 */
export const Route = createFileRoute("/organization/$memberId")({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: "/settings/members/$memberId",
      params: { memberId: params.memberId },
      replace: true,
    });
  },
});
