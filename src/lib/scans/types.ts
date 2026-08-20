/**
 * Modèle des analyses de boîte e-mail (tables `runs` et `run_results`).
 *
 * Les lignes viennent de la base et sont écrites exclusivement par l'Edge
 * Function `run-gmail-scan` : le navigateur ne fait que lire, en RLS, et seuls
 * les owner et admin y ont accès.
 */

export type RunStatus = "running" | "succeeded" | "failed";

/**
 * Une exécution d'analyse. Les compteurs sont nuls tant que l'Edge Function
 * n'a pas terminé : un run `running` n'a encore rien à afficher.
 */
export interface Run {
  id: string;
  integrationId: string;
  status: RunStatus;
  startedAt: string;
  finishedAt: string | null;
  emailsScanned: number;
  emailsAnalyzed: number;
  prospectsFound: number;
  aiCostCents: number;
  errorMessage: string | null;
  triggeredBy: string | null;
}

/**
 * Contenu de la colonne `extracted` (jsonb). Chaque champ peut manquer : le
 * modèle ne trouve pas toujours les cinq. La forme est arbitrée ici plutôt que
 * laissée anonyme, pour que l'affichage n'ait jamais à sonder du `Json`.
 */
export interface ExtractedProspect {
  name: string | null;
  company: string | null;
  email: string | null;
  phone: string | null;
  request: string | null;
}

/**
 * Sort d'un prospect envoyé dans HubSpot : le contact y a été créé, ou bien il
 * existait déjà et sa fiche a été complétée. La distinction est conservée
 * jusqu'à l'affichage — l'utilisateur doit savoir si son CRM connaissait déjà
 * cette personne.
 */
export type CrmAction = "created" | "updated";

/**
 * Verdict de `push-to-hubspot`.
 *
 * `warning` est renseigné quand le contact a bien été créé chez HubSpot mais
 * que la trace n'a pas pu être écrite dans `run_results` : l'envoi est un
 * succès, la carte ne repassera simplement pas en « Dans le CRM ».
 */
export interface CrmPushOutcome {
  contactId: string;
  action: CrmAction | null;
  warning: string | null;
}

/**
 * Un prospect extrait, accompagné de sa trace.
 *
 * Les champs `source*` décrivent le message d'origine tel qu'il est arrivé dans
 * la boîte : ils ne se confondent pas avec `extracted`, qui est ce que l'agent
 * a compris en lisant le corps et la signature. L'écart entre les deux est la
 * démonstration du produit, pas un artefact — d'où leur conservation intégrale.
 */
export interface RunResult {
  id: string;
  runId: string;
  sourceMessageId: string | null;
  sourceSubject: string | null;
  sourceFrom: string | null;
  sourceDate: string | null;
  extracted: ExtractedProspect;
  confidence: number | null;
  reasoning: string | null;
  createdAt: string;
  /**
   * Trace de l'envoi vers le CRM, écrite par l'Edge Function `push-to-hubspot`.
   * `pushedToCrmAt` fait foi : tant qu'il est nul, le prospect n'est pas parti
   * et l'action reste proposée.
   */
  pushedToCrmAt: string | null;
  crmContactId: string | null;
  crmAction: CrmAction | null;
}

/** Résumé renvoyé par `run-gmail-scan` à la fin de l'analyse. */
export interface ScanSummary {
  runId: string;
  emailsScanned: number;
  emailsAnalyzed: number;
  prospectsFound: number;
  costCents: number;
}
