/**
 * Référence temporelle partagée des agrégations cross-module.
 * Les calculs Insights vivent dans src/services/insights.ts ;
 * seule referenceDate() reste ici (utilisée aussi par le service Billing).
 */
import { missionsDetailMock } from "@/lib/missions/mocks";
import { workflowsMock } from "@/lib/workflows/mocks";

/** Date de référence dérivée des mocks (dernier événement connu). */
export function referenceDate(): Date {
  const stamps = [
    ...missionsDetailMock.map((m) => m.updatedAt),
    ...workflowsMock.flatMap((w) => w.runs.map((r) => r.startedAt)),
  ]
    .map((iso) => new Date(iso).getTime())
    .filter((t) => !Number.isNaN(t));
  return new Date(stamps.length ? Math.max(...stamps) : Date.now());
}
