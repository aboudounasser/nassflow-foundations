/**
 * Service Layer du module Missions.
 *
 * Les missions elles-mêmes viennent de la table `missions` (une ligne par
 * analyse Gmail, ouverte par l'Edge Function `run-gmail-scan` — voir
 * `database.types.ts`). `missionAgents` et `missionBlueprints` restent
 * mockés : ce ne sont pas des entités persistées, et le Mission Builder qui
 * les consomme ne persiste rien lui-même pour l'instant.
 */
import { missionAgents, missionBlueprints } from "@/lib/missions/mocks";
import type {
  MissionAgent,
  MissionBlueprint,
  MissionDetail,
  MissionStatus,
} from "@/lib/missions/types";
import { supabase } from "@/lib/supabase/client";
import type { Tables } from "@/lib/supabase/database.types";
import type { Scope } from "@/lib/tenancy/types";

const MISSION_COLUMNS =
  "id, organization_id, run_id, title, objective, status, progress, created_at, updated_at, completed_at";

/**
 * `status` est contraint côté base à ces six valeurs (voir
 * `database.types.ts`, contrainte `missions_status_check`) — un statut
 * inconnu est traité comme `failed` plutôt que comme un succès silencieux,
 * même règle que `toRunStatus` dans `scans.ts`.
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

/**
 * Complète une ligne réelle de `missions` (pilotage Gmail : id, titre,
 * objectif, statut, progression, dates) vers le modèle riche `MissionDetail`
 * attendu par les vues. Tout ce que la table ne porte pas reçoit une valeur
 * par défaut sûre — jamais `undefined` — pour ne pas faire planter les
 * lookups `MISSION_STATUS`/`PRIORITY_BADGE` ni les `.map()` des vues.
 *
 * `dueDate` reçoit `""` plutôt que `null` : `MissionDetail.dueDate` hérite
 * de `Mission.dueDate`, un `string` non nullable. `MissionCalendarView` et
 * `formatDueDate` traitent déjà une date invalide comme une absence de date
 * (`Number.isNaN` sur `new Date("")`), donc une chaîne vide dégrade
 * exactement comme une vraie absence — sans élargir un type partagé avec
 * des composants qu'on ne touche pas dans ce chantier.
 */
function toMissionDetail(row: Tables<"missions">): MissionDetail {
  return {
    id: row.id,
    title: row.title,
    objective: row.objective,
    status: toMissionStatus(row.status),
    progress: row.progress,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    priority: "medium",
    dueDate: "",
    owner: "Agent Gmail",
    tags: [],
    agents: [],
    steps: [],
    dependencies: [],
    estimatedDuration: "—",
    actualDuration: null,
    confidenceScore: 0,
    cost: { aiCalls: 0, estimatedCost: "—" },
    history: [],
  };
}

export interface MissionsListData {
  missions: MissionDetail[];
  agents: MissionAgent[];
  /** Modèles proposés par le Mission Builder. */
  blueprints: MissionBlueprint[];
}

export async function getMissions(scope: Scope): Promise<MissionsListData> {
  const { data, error } = await supabase
    .from("missions")
    .select(MISSION_COLUMNS)
    .eq("organization_id", scope.organizationId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  return {
    missions: (data ?? []).map(toMissionDetail),
    agents: missionAgents,
    blueprints: missionBlueprints,
  };
}

/** Agrégat de la vue détail : inclut toutes les missions (dépendances croisées). */
export interface MissionDetailData {
  mission: MissionDetail;
  allMissions: MissionDetail[];
  agents: MissionAgent[];
}

export async function getMission(
  scope: Scope,
  missionId: string,
): Promise<MissionDetailData | null> {
  const { data, error } = await supabase
    .from("missions")
    .select(MISSION_COLUMNS)
    .eq("organization_id", scope.organizationId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  const allMissions = (data ?? []).map(toMissionDetail);
  const mission = allMissions.find((m) => m.id === missionId) ?? null;
  if (!mission) return null;

  return { mission, allMissions, agents: missionAgents };
}

/** Annule une mission en cours : passe `missions.status` à `cancelled`. */
export async function cancelMission(scope: Scope, missionId: string): Promise<void> {
  const { error } = await supabase
    .from("missions")
    .update({ status: "cancelled" })
    .eq("id", missionId)
    .eq("organization_id", scope.organizationId);

  if (error) throw new Error(error.message);
}
