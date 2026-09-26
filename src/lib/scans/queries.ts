import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useSession } from "@/components/providers/session-provider";
import { missionsKey } from "@/lib/missions/queries";
import { scopeKey } from "@/lib/tenancy/keys";
import type { Scope } from "@/lib/tenancy/types";
import * as scansService from "@/services/scans";

function runsKey(scope: Scope): readonly unknown[] {
  return [...scopeKey(scope), "scans", "runs"];
}

/** Préfixe commun aux résultats de toutes les exécutions. */
function runResultsRootKey(scope: Scope): readonly unknown[] {
  return [...scopeKey(scope), "scans", "results"];
}

function runResultsKey(scope: Scope, runId: string): readonly unknown[] {
  return [...runResultsRootKey(scope), runId];
}

/** Même préfixe : un envoi au CRM retire le prospect du bloc « À valider ». */
function pendingProspectsKey(scope: Scope): readonly unknown[] {
  return [...runResultsRootKey(scope), "pending"];
}

export function useRuns() {
  const { scope } = useSession();
  return useQuery({
    queryKey: runsKey(scope),
    queryFn: () => scansService.listRuns(scope),
  });
}

/** Prospects pas encore envoyés au CRM — le bloc « À valider » de l'accueil. */
export function usePendingProspects() {
  const { scope } = useSession();
  return useQuery({
    queryKey: pendingProspectsKey(scope),
    queryFn: () => scansService.listPendingProspects(scope),
  });
}

/**
 * Résultats d'une exécution. `runId` vaut `null` tant qu'aucune analyse n'a été
 * menée : la requête reste alors désactivée plutôt que d'interroger la base
 * avec un identifiant vide.
 */
export function useRunResults(runId: string | null) {
  const { scope } = useSession();
  return useQuery({
    queryKey: runResultsKey(scope, runId ?? "none"),
    queryFn: () => scansService.getRunResults(scope, runId as string),
    enabled: runId !== null,
  });
}

/**
 * Lance l'analyse et attend son verdict — l'appel dure jusqu'à une minute.
 * La liste des exécutions est invalidée au succès : le nouveau run y apparaît
 * avec ses compteurs. Les résultats le sont aussi, sans quoi les prospects que
 * l'analyse vient de trouver n'apparaîtraient qu'au prochain chargement. Les
 * missions enfin : chaque analyse en ouvre une, que la liste et l'accueil
 * doivent afficher sans attendre.
 */
export function useStartGmailScan() {
  const { scope } = useSession();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (integrationId: string) => scansService.startGmailScan(scope, integrationId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: runsKey(scope) });
      void queryClient.invalidateQueries({ queryKey: runResultsRootKey(scope) });
      void queryClient.invalidateQueries({ queryKey: missionsKey(scope) });
    },
  });
}

/**
 * Envoie un prospect dans le CRM.
 *
 * Les résultats sont invalidés au succès : la ligne revient avec sa date
 * d'envoi, ce qui remplace le bouton par le badge « Dans le CRM ».
 * L'invalidation porte sur le préfixe et non sur une exécution précise — la
 * carte appelante n'a pas à connaître le run auquel elle appartient.
 */
export function usePushToCrm() {
  const { scope } = useSession();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (resultId: string) => scansService.pushResultToCrm(scope, resultId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: runResultsRootKey(scope) }),
  });
}
