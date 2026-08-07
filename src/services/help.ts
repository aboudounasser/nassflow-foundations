import {
  helpArticleById,
  helpArticlesByIds,
  helpArticlesMock,
  helpCategoryCounts,
  helpFaqMock,
  supportTicketsMock,
} from "@/lib/help/mocks";
import type { HelpArticle, HelpFaq, SupportTicket } from "@/lib/help/types";
import type { Scope } from "@/lib/tenancy/types";
import { delay } from "@/services/latency";

export interface HelpCenterData {
  articles: HelpArticle[];
  faq: HelpFaq[];
  tickets: SupportTicket[];
  categoryCounts: ReturnType<typeof helpCategoryCounts>;
}

/** Agrégat de la vue détail : un seul aller-retour par identifiant (option B). */
export interface HelpArticleDetail {
  article: HelpArticle;
  related: HelpArticle[];
}

export async function getHelpCenter(_scope: Scope): Promise<HelpCenterData> {
  return delay({
    articles: helpArticlesMock,
    faq: helpFaqMock,
    tickets: supportTicketsMock,
    categoryCounts: helpCategoryCounts(),
  });
}

export async function getHelpArticle(
  _scope: Scope,
  articleId: string,
): Promise<HelpArticleDetail | null> {
  const article = helpArticleById(articleId);
  if (!article) return delay(null);
  return delay({ article, related: helpArticlesByIds(article.relatedArticleIds) });
}
