/** Modèle documentaire du module Enterprise Brain. */

export type KnowledgeType = "document" | "procedure" | "wiki" | "faq";

export type KnowledgeStatus = "published" | "draft" | "archived";

export interface KnowledgeItem {
  id: string;
  type: KnowledgeType;
  title: string;
  /** 1-2 phrases. */
  summary: string;
  /** Corps du document, texte simple. */
  content: string;
  category: string;
  tags: string[];
  /** Responsable humain de ce contenu. */
  owner: string;
  status: KnowledgeStatus;
  version: string;
  createdAt: string;
  updatedAt: string;
}

export type KnowledgeView = "grid" | "list";
