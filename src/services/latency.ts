/**
 * Latence simulée partagée par toute la couche service.
 * Rend isPending réel et permet de valider les états de chargement.
 * À supprimer quand les appels réseau seront réels.
 */
const MOCK_LATENCY_MS = 250;

export function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), MOCK_LATENCY_MS));
}
