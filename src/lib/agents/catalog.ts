/**
 * Les cinq agents du produit NASSFLOW — définition du produit, comme
 * `NAV_ITEMS`, et non donnée mesurée : il n'existe aucune table « agents ».
 *
 * `available` vaut `true` seulement quand le pipeline de l'agent existe et
 * tourne : l'agent est alors listé et possède une fiche. Les autres restent
 * invisibles (chantier 7, option 1) — pas de « Bientôt », pas de date.
 *
 * Les données vivantes ne sont jamais ici : elles viennent des tables réelles
 * (`pulses` pour le CEO Agent ; `runs`, `run_results`, `missions` et
 * `integrations` pour le Sales Agent), lues par les sections de la fiche.
 */

export type ProductAgentId = "a-ceo" | "a-sales" | "a-email" | "a-marketing" | "a-support";

export interface ProductAgent {
  id: ProductAgentId;
  name: string;
  /** Initiales affichées dans l'avatar. */
  avatar: string;
  role: string;
  /** Ce que l'agent fait réellement aujourd'hui — `null` tant qu'il n'est pas disponible. */
  description: string | null;
  available: boolean;
}

export const PRODUCT_AGENTS: ProductAgent[] = [
  {
    id: "a-ceo",
    name: "CEO Agent",
    avatar: "CE",
    role: "Synthèse quotidienne",
    description:
      "Rédige chaque jour une synthèse de l'activité à partir des analyses de la boîte e-mail, des prospects détectés et des envois au CRM.",
    available: true,
  },
  {
    id: "a-sales",
    name: "Sales Agent",
    avatar: "SA",
    role: "Développement commercial",
    description:
      "Lit les 50 derniers messages de la boîte Gmail connectée, en extrait les demandes commerciales et les envoie dans HubSpot après votre validation.",
    available: true,
  },
  {
    id: "a-email",
    name: "Email Agent",
    avatar: "EM",
    role: "E-mail",
    description: null,
    available: false,
  },
  {
    id: "a-marketing",
    name: "Marketing Agent",
    avatar: "MA",
    role: "Marketing",
    description: null,
    available: false,
  },
  {
    id: "a-support",
    name: "Support Agent",
    avatar: "SU",
    role: "Support",
    description: null,
    available: false,
  },
];

/** Agents listés et dotés d'une fiche. */
export const AVAILABLE_AGENTS: ProductAgent[] = PRODUCT_AGENTS.filter((agent) => agent.available);

/** Un agent disponible, ou `null` — un agent masqué ou inconnu vaut « introuvable ». */
export function findAvailableAgent(agentId: string): ProductAgent | null {
  return AVAILABLE_AGENTS.find((agent) => agent.id === agentId) ?? null;
}
