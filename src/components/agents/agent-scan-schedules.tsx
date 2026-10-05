import { ScanScheduleCard } from "@/components/scan-schedules/scan-schedule-card";
import { useSession } from "@/components/providers/session-provider";
import { useConnections } from "@/lib/integrations-oauth/queries";
import { PRIVILEGED_ROLES } from "@/lib/organization/meta";

/**
 * Analyse automatique de la fiche Sales Agent : une carte par boîte Gmail
 * encore raccordée (active, ou expirée — la carte invite alors à la
 * reconnecter). Une boîte déconnectée n'a plus rien à régler : sa
 * planification a été mise en pause par la base.
 *
 * Réservée aux owner et admin : rien n'est rendu, ni lu, pour un autre rôle.
 * Les états de chargement et d'erreur des connexions sont déjà portés par la
 * section « Connexions » juste au-dessus.
 */
export function AgentScanSchedules() {
  const { session } = useSession();
  const canEdit = PRIVILEGED_ROLES.includes(session.role);
  if (!canEdit) return null;
  return <GmailScanSchedules />;
}

function GmailScanSchedules() {
  const connectionsQuery = useConnections();
  const gmailConnections = (connectionsQuery.data ?? []).filter(
    (connection) => connection.provider === "gmail" && connection.status !== "revoked",
  );

  return (
    <>
      {gmailConnections.map((connection) => (
        <section key={connection.id} className="col-span-12 min-w-0">
          <ScanScheduleCard connection={connection} />
        </section>
      ))}
    </>
  );
}
