/**
 * Modèle du Enterprise Pulse (table `pulses`).
 *
 * Une ligne par jour et par organisation, écrite exclusivement par l'Edge
 * Function `generate-pulse` : le navigateur ne fait que lire. Contrairement à
 * `runs`/`run_results`, la lecture est ouverte à tous les membres — seule la
 * génération est réservée aux owner et admin, parce qu'elle a un coût.
 */

/**
 * Compteurs et indicateurs calculés par `generate-pulse`. Le contenu de
 * `metrics` (jsonb) est arbitré ici plutôt que laissé anonyme : l'affichage
 * n'a jamais à sonder du `Json`.
 *
 * `canDescribe`/`canCompare` distinguent ce que le résumé a pu affirmer :
 * décrire l'état courant ne demande qu'un minimum de données, comparer une
 * tendance demande un historique plus long. `hasEnoughData` ici est celui
 * retenu par le modèle pour rédiger ; `Pulse.hasEnoughData` (colonne dédiée)
 * fait foi pour l'affichage.
 */
export interface PulseMetrics {
  runs7d: number;
  runsPrev7d: number;
  runsTotal: number;
  runsFailed7d: number;
  prospects7d: number;
  prospectsPrev7d: number;
  pushed7d: number;
  pendingReviewTotal: number;
  pendingReview7d: number;
  daysActive: number;
  prospectsVariationPct: number | null;
  integrationsActive: number;
  integrationsError: number;
  canDescribe: boolean;
  canCompare: boolean;
  hasEnoughData: boolean;
}

/**
 * Le pulse d'un jour donné.
 *
 * `hasEnoughData` à `false` n'est pas une erreur : c'est le signal que le
 * résumé décrit l'entreprise sans pouvoir la comparer à son historique, faute
 * de recul suffisant. Il doit être montré, jamais masqué.
 */
export interface Pulse {
  id: string;
  pulseDate: string;
  metrics: PulseMetrics;
  hasEnoughData: boolean;
  summary: string;
  attention: string | null;
  recommendation: string | null;
  aiCostMillicents: number;
  generatedAt: string;
  generatedBy: string;
}

/**
 * Réponse de `generate-pulse` : un sous-ensemble du pulse, sans `metrics` ni
 * `generatedAt`. La lecture complète revient via `getTodayPulse()`, invoquée
 * après invalidation de la clé du jour.
 */
export interface GeneratePulseResult {
  id: string;
  pulseDate: string;
  summary: string;
  attention: string | null;
  recommendation: string | null;
  hasEnoughData: boolean;
}
