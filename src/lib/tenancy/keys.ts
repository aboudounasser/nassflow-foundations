import type { Scope } from "./types";

/**
 * Préfixe de TOUTE clé de cache. Le scope est TOUJOURS en tête, jamais
 * en queue : cela permet de purger l'intégralité du cache d'une
 * organisation en une seule invalidation lors d'un changement.
 * Une clé sans organizationId exposerait les données de l'organisation
 * précédente après un changement — c'est une exigence de sécurité, pas
 * une optimisation.
 */
export function scopeKey(scope: Scope): readonly unknown[] {
  return ["org", scope.organizationId];
}

/** Racine de toutes les clés d'une organisation, pour purge ciblée. */
export function organizationRootKey(organizationId: string): readonly unknown[] {
  return ["org", organizationId];
}