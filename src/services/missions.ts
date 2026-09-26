/**
 * Service Layer du module Missions.
 *
 * Une mission est ouverte par l'Edge Function `run-gmail-scan` pour chaque
 * analyse Gmail, puis fermée à la fin de celle-ci. Rien d'autre n'en crée.
 *
 * La RLS de `missions` réserve la lecture et la modification aux owner et
 * admin ; celle de `runs`, jointe ici, aussi. Pour les autres rôles, les
 * requêtes aboutissent sur des listes vides : c'est à l'interface de le dire.
 */
import type { Mission, MissionRun, MissionStatus } from "@/lib/missions/types";
import type { RunStatus } from "@/lib/scans/types";
import { supabase } from "@/lib/supabase/client";
import type { Scope } from "@/lib/tenancy/types";

/**
 * Colonnes d'une mission et du run qui l'a ouverte. Deux clés étrangères
 * relient `missions` à `runs` : sans indice, PostgREST refuse l'embed comme
 * ambigu (PGRST201). La clé composite garantit en plus que le run appartient à
 * la même organisation que la mission.
 */
const MISSION_SELECT =
  "id, run_id, title, objective, status, archived_from_status, created_at, completed_at, runs!missions_run_org_fkey(status, started_at, finished_at, emails_scanned, emails_analyzed, prospects_found, ai_cost_cents, error_message)";

/** Nombre de missions affichées dans le bloc « Dernière activité » de l'accueil. */
const RECENT_MISSIONS_LIMIT = 5;

/**
 * `status` est contraint côté base à ces six valeurs (contrainte
 * `missions_status_check`) — un statut inconnu est traité comme `failed`
 * plutôt que comme un succès silencieux, même règle que `toRunStatus` dans
 * `scans.ts`.
 */
const KNOWN_STATUSES: MissionStatus[] = [
  "draft",
  "running",
  "completed",
  "failed",
  "cancelled",
  "archived",
];

function toMissionStatus(value: string): MissionStatus {
  return KNOWN_STATUSES.includes(value as MissionStatus) ? (value as MissionStatus) : "failed";
}

const KNOWN_RUN_STATUSES: RunStatus[] = ["running", "succeeded", "failed"];

function toCount(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function toText(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

/**
 * Jointure `runs` rétrécie comme le reste : PostgREST la renvoie en objet pour
 * une clé étrangère portée par `missions`, mais une forme inattendue — ou une
 * jointure vide — vaut « pas de run connu » plutôt qu'une erreur.
 */
function toMissionRun(value: unknown): MissionRun | null {
  const run = (Array.isArray(value) ? value[0] : value) as
    Record<string, unknown> | null | undefined;
  if (typeof run !== "object" || run === null) return null;
  const status = run["status"];
  return {
    status: KNOWN_RUN_STATUSES.includes(status as RunStatus) ? (status as RunStatus) : "failed",
    startedAt: toText(run["started_at"]),
    finishedAt: toText(run["finished_at"]),
    emailsScanned: toCount(run["emails_scanned"]),
    emailsAnalyzed: toCount(run["emails_analyzed"]),
    prospectsFound: toCount(run["prospects_found"]),
    aiCostCents: toCount(run["ai_cost_cents"]),
    errorMessage: toText(run["error_message"]),
  };
}

interface MissionRow {
  id: string;
  run_id: string;
  title: string;
  objective: string;
  status: string;
  archived_from_status: string | null;
  created_at: string;
  completed_at: string | null;
  runs: unknown;
}

/** Une ligne réelle de `missions` et son run — aucune valeur inventée. */
function toMission(row: MissionRow): Mission {
  return {
    id: row.id,
    runId: row.run_id,
    title: row.title,
    objective: row.objective,
    status: toMissionStatus(row.status),
    archivedFromStatus: row.archived_from_status ? toMissionStatus(row.archived_from_status) : null,
    createdAt: row.created_at,
    completedAt: row.completed_at,
    run: toMissionRun(row.runs),
  };
}

/** Toutes les missions de l'organisation, les plus récemment ouvertes d'abord. */
export async function getMissions(scope: Scope): Promise<Mission[]> {
  const { data, error } = await supabase
    .from("missions")
    .select(MISSION_SELECT)
    .eq("organization_id", scope.organizationId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map(toMission);
}

/**
 * Les dernières missions non archivées, les plus récemment ouvertes d'abord.
 * Tri sur `created_at` et non `updated_at` : archiver puis restaurer une
 * vieille mission ne doit pas la faire remonter en tête de l'activité.
 */
export async function listRecentMissions(scope: Scope): Promise<Mission[]> {
  const { data, error } = await supabase
    .from("missions")
    .select(MISSION_SELECT)
    .eq("organization_id", scope.organizationId)
    .neq("status", "archived")
    .order("created_at", { ascending: false })
    .limit(RECENT_MISSIONS_LIMIT);

  if (error) throw new Error(error.message);
  return (data ?? []).map(toMission);
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Une mission par identifiant. Un identifiant qui n'est pas un UUID ne peut
 * désigner aucune ligne : il vaut « introuvable » sans interroger la base, qui
 * répondrait sinon par une erreur de syntaxe (22P02).
 */
export async function getMission(scope: Scope, missionId: string): Promise<Mission | null> {
  if (!UUID_PATTERN.test(missionId)) return null;

  const { data, error } = await supabase
    .from("missions")
    .select(MISSION_SELECT)
    .eq("organization_id", scope.organizationId)
    .eq("id", missionId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? toMission(data) : null;
}

/**
 * Archive une mission terminée : elle sort de la liste par défaut mais reste
 * consultable via le filtre "Statuts". `fromStatus` est celui déjà détenu par
 * l'appelant (chargé avec la mission) plutôt que relu en base — les deux
 * colonnes s'écrivent dans un seul UPDATE atomique, et la garde
 * `.eq("status", fromStatus)` détecte un changement concurrent (0 ligne
 * affectée) au lieu d'écraser un statut qu'on n'a plus sous les yeux.
 */
export async function archiveMission(
  scope: Scope,
  missionId: string,
  fromStatus: MissionStatus,
): Promise<void> {
  const { data, error } = await supabase
    .from("missions")
    .update({ status: "archived", archived_from_status: fromStatus })
    .eq("id", missionId)
    .eq("organization_id", scope.organizationId)
    .eq("status", fromStatus)
    .select("id");

  if (error) throw new Error(error.message);
  if ((data ?? []).length === 0) {
    throw new Error("Le statut de la mission a changé entre-temps, réessayez.");
  }
}

/** Restaure une mission archivée vers son statut précédent — symétrique de `archiveMission`. */
export async function restoreMission(
  scope: Scope,
  missionId: string,
  toStatus: MissionStatus,
): Promise<void> {
  const { data, error } = await supabase
    .from("missions")
    .update({ status: toStatus, archived_from_status: null })
    .eq("id", missionId)
    .eq("organization_id", scope.organizationId)
    .eq("status", "archived")
    .select("id");

  if (error) throw new Error(error.message);
  if ((data ?? []).length === 0) {
    throw new Error("Le statut de la mission a changé entre-temps, réessayez.");
  }
}
