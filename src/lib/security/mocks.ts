import type { SecurityPolicy } from "./types";

/** Politiques de sécurité mockées — lecture seule (aucune édition dans cette itération). */
export const securityPoliciesMock: SecurityPolicy[] = [
  {
    id: "p-2fa",
    label: "Authentification à deux facteurs",
    value: "Obligatoire",
    description: "Requise pour tous les rôles Propriétaire, Administrateur et Manager.",
  },
  {
    id: "p-password",
    label: "Politique de mot de passe",
    value: "12 caractères minimum",
    description:
      "Complexité requise : majuscule, minuscule, chiffre et caractère spécial. Rotation tous les 180 jours.",
  },
  {
    id: "p-session",
    label: "Durée de session",
    value: "8 heures",
    description: "Déconnexion automatique après 30 minutes d'inactivité.",
  },
  {
    id: "p-ip",
    label: "Adresses IP autorisées",
    value: "3 plages",
    description: "Accès administrateur restreint aux plages ci-dessous.",
    items: ["81.240.12.0/24 — Siège Paris", "185.44.7.19 — VPN équipe", "51.15.203.0/28 — Ops"],
  },
  {
    id: "p-retention",
    label: "Rétention des journaux d'audit",
    value: "24 mois",
    description: "Archivage chiffré, purge automatique au-delà de la durée de rétention.",
  },
];