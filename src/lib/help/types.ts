/** Modèle du Help Center : documentation du produit NASSFLOW OS lui-même. */

export type ArticleCategory =
  | "Démarrage"
  | "Missions"
  | "AI Workforce"
  | "Enterprise Brain"
  | "CRM"
  | "Workflow Engine"
  | "Intégrations"
  | "Sécurité"
  | "Facturation"
  | "Compte & organisation";

export interface HelpArticle {
  id: string;
  title: string;
  summary: string;
  /** Corps de l'article, texte simple. */
  content: string;
  category: ArticleCategory;
  tags: string[];
  readingTimeMin: number;
  updatedAt: string;
  /** Lien vers le module concerné dans l'app, pour un bouton « Ouvrir le module ». */
  moduleLink?: string;
  relatedArticleIds: string[];
}

export interface HelpFaq {
  id: string;
  question: string;
  answer: string;
  category: ArticleCategory;
}

export type SupportTicketStatus = "open" | "pending" | "resolved" | "closed";
export type SupportTicketPriority = "low" | "medium" | "high";

export interface SupportTicket {
  id: string;
  reference: string;
  subject: string;
  status: SupportTicketStatus;
  priority: SupportTicketPriority;
  createdAt: string;
  updatedAt: string;
  lastMessage: string;
}

export type HelpSection = "articles" | "faq" | "support";
export type HelpSort = "relevance" | "recent" | "reading";
export type HelpView = "grid" | "list";
