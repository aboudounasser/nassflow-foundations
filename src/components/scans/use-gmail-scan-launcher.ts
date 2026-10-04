import { toast } from "sonner";

import { useSession } from "@/components/providers/session-provider";
import { useConnections } from "@/lib/integrations-oauth/queries";
import { pluralize } from "@/lib/scans/meta";
import { useStartGmailScan } from "@/lib/scans/queries";

/** Rôles autorisés par la RLS à lire les exécutions et par l'Edge Function à en lancer une. */
const SCAN_ROLES = ["owner", "admin"];

/**
 * Lancement d'une analyse Gmail : droits, boîte active et verdict en toast.
 *
 * L'action n'est proposée qu'aux rôles que l'Edge Function accepte : masquer le
 * bouton ailleurs évite un 403 promis d'avance, la vérification faisant
 * autorité restant côté serveur.
 *
 * L'état de la mutation vit dans le composant appelant : quitter la page pendant
 * l'analyse fait disparaître le bandeau d'attente, pas l'analyse, qui se
 * poursuit côté serveur et dont le résultat arrive par invalidation.
 */
export function useGmailScanLauncher() {
  const { session } = useSession();
  const connectionsQuery = useConnections();
  const startMutation = useStartGmailScan();

  const canScan = SCAN_ROLES.includes(session.role);
  const gmailConnection =
    (connectionsQuery.data ?? []).find(
      (connection) => connection.provider === "gmail" && connection.status === "active",
    ) ?? null;

  const launch = () => {
    if (!gmailConnection) return;
    startMutation.mutate(gmailConnection.id, {
      onSuccess: (summary) => {
        const found =
          summary.prospectsFound > 0
            ? pluralize(summary.prospectsFound, "prospect trouvé", "prospects trouvés")
            : "aucune demande commerciale détectée";
        const pending = pluralize(
          summary.backlogRemaining,
          "message reste à analyser",
          "messages restent à analyser",
        );
        if (summary.stopReason === "budget") {
          // Pas une erreur : l'analyse s'est arrêtée proprement, il n'y a rien à
          // relancer aujourd'hui.
          toast.warning(
            `Budget IA du jour atteint pour cette boîte : ${found}. ${
              summary.backlogRemaining > 0
                ? `${pluralize(summary.backlogRemaining, "message sera analysé", "messages seront analysés")} à partir de demain.`
                : ""
            }`.trim(),
          );
        } else if (summary.backlogRemaining > 0) {
          toast.success(`Analyse terminée : ${found}. ${pending} : relancez l'analyse.`);
        } else {
          toast.success(`Analyse terminée : ${found}.`);
        }
      },
      // Les corps 403 / 404 / 409 portent un message rédigé pour l'utilisateur :
      // il est affiché tel quel.
      onError: (e) =>
        toast.error(e instanceof Error ? e.message : "L'analyse n'a pas pu être lancée."),
    });
  };

  return {
    canScan,
    connectionsQuery,
    gmailConnection,
    launch,
    isLaunching: startMutation.isPending,
  };
}
