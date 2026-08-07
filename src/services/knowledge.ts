import type { AgentDetail } from "@/lib/agents/types";
import { agentsUsingKnowledge, knowledgeById, knowledgeCategories, knowledgeMock } from "@/lib/knowledge/mocks";
import type { KnowledgeItem } from "@/lib/knowledge/types";
import type { Scope } from "@/lib/tenancy/types";
import { delay } from "@/services/latency";

export interface KnowledgeListData {
  items: KnowledgeItem[];
  categories: { category: string; count: number }[];
  /** Croisement précalculé : la vue ne fait plus d'agrégation au rendu. */
  agentsByItem: Record<string, AgentDetail[]>;
}

export async function getKnowledge(_scope: Scope): Promise<KnowledgeListData> {
  return delay({
    items: knowledgeMock,
    categories: knowledgeCategories(),
    agentsByItem: Object.fromEntries(
      knowledgeMock.map((item) => [item.id, agentsUsingKnowledge(item.id)]),
    ),
  });
}

/** Agrégat de la vue détail : un seul aller-retour par identifiant (option B). */
export interface KnowledgeDetailData {
  item: KnowledgeItem;
  agents: AgentDetail[];
}

export async function getKnowledgeItem(
  _scope: Scope,
  itemId: string,
): Promise<KnowledgeDetailData | null> {
  const item = knowledgeById(itemId);
  if (!item) return delay(null);
  return delay({ item, agents: agentsUsingKnowledge(itemId) });
}
