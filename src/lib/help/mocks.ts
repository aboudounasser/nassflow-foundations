import type { HelpArticle, HelpFaq, SupportTicket } from "./types";

/**
 * Documentation du produit NASSFLOW OS. Ce contenu décrit uniquement les
 * modules réellement construits dans l'application.
 */
export const helpArticlesMock: HelpArticle[] = [
  {
    id: "h-premiers-pas",
    title: "Premiers pas dans NASSFLOW OS",
    summary:
      "Découvrez l'organisation de l'interface : Top Bar, sidebar des 13 modules, zone principale et Context Panel.",
    content: `NASSFLOW OS est un AI Operating System : la plateforme fait travailler ensemble vos équipes humaines et vos agents IA.

L'interface repose sur un Master Layout unique, identique dans tous les modules. En haut, la Top Bar. À gauche, la sidebar qui donne accès aux 13 modules : Dashboard, Missions, AI Workforce, Enterprise Brain, CRM, Workflow Engine, Integrations Hub, Insights, Organization, Security Center, Billing, System Settings et Help Center. Au centre, la zone de contenu du module courant. À droite, le Context Panel : il s'ouvre lorsque vous sélectionnez un élément (une mission, un AI Agent, un contact, un article d'aide) et affiche son résumé sans quitter la page.

La plupart des modules suivent le même schéma : une page index avec un bandeau de synthèse, une barre d'outils (recherche, filtres, tri, bascule grille/liste) et une page de détail accessible en cliquant sur un élément.

Cette première version fonctionne avec des données de démonstration : aucune donnée réelle n'est enregistrée.`,
    category: "Démarrage",
    tags: ["démarrage", "navigation", "layout", "context panel"],
    readingTimeMin: 4,
    updatedAt: "2026-07-28T09:00:00.000Z",
    relatedArticleIds: ["h-dashboard", "h-vocabulaire"],
  },
  {
    id: "h-dashboard",
    title: "Comprendre le Dashboard CEO",
    summary:
      "Le cockpit exécutif : Enterprise Pulse, KPI, AI Workforce, décisions, missions, prévisions et flux d'activité.",
    content: `Le Dashboard CEO est la page d'accueil de NASSFLOW OS, à la route « / ». Il rassemble une vue condensée de toute la plateforme.

On y trouve notamment le bandeau Enterprise Pulse, des cartes KPI, un widget AI Workforce qui résume vos collaborateurs IA (total, actifs, en mission, en attente), un centre de décisions à valider, un aperçu des missions en cours, une prévision affichée sous forme de graphique, ainsi que des flux d'activité, de sécurité et de notifications.

Chaque widget partage le même conteneur, qui gère quatre états : chargement, vide, erreur et succès. Les widgets sont des points d'entrée : cliquez sur un élément pour rejoindre le module correspondant.`,
    category: "Démarrage",
    tags: ["dashboard", "kpi", "cockpit"],
    readingTimeMin: 3,
    updatedAt: "2026-07-26T09:00:00.000Z",
    moduleLink: "/",
    relatedArticleIds: ["h-premiers-pas", "h-insights"],
  },
  {
    id: "h-vocabulaire",
    title: "Vocabulaire NASSFLOW OS",
    summary:
      "Mission, AI Workforce, AI Agent, Workflow, Enterprise Brain : le lexique officiel de la plateforme.",
    content: `Mission : un objectif métier confié à un ou plusieurs agents IA, découpé en étapes avec dépendances, coût IA et historique.

AI Workforce : le module qui regroupe l'ensemble de vos collaborateurs IA. C'est le nom officiel du module et de l'équipe.

AI Agent : un collaborateur IA individuel, toujours nommé par son rôle — CEO Agent, Sales Agent, Finance Agent, Ops Agent, Support Agent…

Workflow : le processus technique qui exécute concrètement une mission, avec ses étapes, ses branches conditionnelles et son historique d'exécutions.

Enterprise Brain : la connaissance de votre entreprise (documents, procédures, wiki, FAQ métier). À ne pas confondre avec le Help Center, qui documente le produit NASSFLOW OS lui-même.

Context Panel : le panneau latéral droit qui affiche le résumé de l'élément sélectionné.`,
    category: "Démarrage",
    tags: ["lexique", "vocabulaire", "concepts"],
    readingTimeMin: 3,
    updatedAt: "2026-07-20T09:00:00.000Z",
    relatedArticleIds: ["h-premiers-pas", "h-missions", "h-workforce"],
  },
  {
    id: "h-missions",
    title: "Piloter vos missions",
    summary:
      "Le module Missions et ses trois vues : Liste, Kanban et Calendrier, avec recherche, filtres et tri.",
    content: `Le module Missions se trouve à la route « /missions ». La barre d'outils propose une recherche, des filtres, un tri et un sélecteur de vue.

Trois vues sont disponibles :
— Liste : chaque mission apparaît sous forme de carte résumé (statut, agents, avancement, coût IA).
— Kanban : les missions sont réparties en colonnes selon leur statut.
— Calendrier : une grille mensuelle qui positionne les missions dans le temps.

Cliquer sur une mission ouvre son détail complet dans le Context Panel : objectif, étapes, dépendances, agents impliqués, coût IA et historique. Depuis ce panneau, le bouton « Plein écran » ouvre la vue d'orchestration détaillée.

Le bouton « Créer une Mission » ouvre le Mission Builder, un assistant en plusieurs étapes.`,
    category: "Missions",
    tags: ["missions", "kanban", "calendrier", "vues"],
    readingTimeMin: 4,
    updatedAt: "2026-07-30T09:00:00.000Z",
    moduleLink: "/missions",
    relatedArticleIds: ["h-mission-builder", "h-orchestration", "h-workflow"],
  },
  {
    id: "h-mission-builder",
    title: "Créer une mission avec le Mission Builder",
    summary:
      "L'assistant en cinq étapes : point de départ, objectif, agents & outils, étapes & validation, révision.",
    content: `Le Mission Builder s'ouvre depuis le bouton « Créer une Mission » du module Missions.

Il vous guide en cinq étapes :
1. Point de départ — choisissez la manière de démarrer la mission.
2. Objectif — décrivez précisément le résultat attendu.
3. Agents & Outils — sélectionnez les agents IA mobilisés et les outils qu'ils pourront utiliser.
4. Étapes & Validation — définissez les étapes et les points de validation humaine.
5. Révision — relisez la configuration avant de confirmer.

Chaque étape est validée avant de pouvoir passer à la suivante, et l'assistant vous avertit si vous tentez de fermer la fenêtre alors que des informations ont été saisies.`,
    category: "Missions",
    tags: ["mission builder", "création", "assistant"],
    readingTimeMin: 3,
    updatedAt: "2026-07-29T09:00:00.000Z",
    moduleLink: "/missions",
    relatedArticleIds: ["h-missions", "h-orchestration"],
  },
  {
    id: "h-orchestration",
    title: "Orchestration et Replay d'une mission",
    summary:
      "La vue plein écran d'une mission : diagramme de flux, timeline enrichie et lecture pas à pas.",
    content: `Depuis le détail d'une mission, le bouton « Plein écran » ouvre la vue d'orchestration à la route « /missions/{id} ».

L'Orchestration Engine affiche les étapes sous forme de diagramme : chaque étape est une carte compacte avec les avatars des agents IA concernés. Les connecteurs relient les étapes selon leurs dépendances, ce qui rend visibles les séquences comme les branches exécutées en parallèle. L'étape en cours d'exécution est mise en évidence par un halo.

La barre de Replay (lecture, pause, étape suivante) rejoue l'exécution pas à pas. Le diagramme, la timeline et le résumé de raisonnement restent synchronisés à chaque avancement.`,
    category: "Missions",
    tags: ["orchestration", "replay", "timeline", "dépendances"],
    readingTimeMin: 4,
    updatedAt: "2026-07-27T09:00:00.000Z",
    moduleLink: "/missions",
    relatedArticleIds: ["h-missions", "h-workflow"],
  },
  {
    id: "h-workforce",
    title: "Gérer votre AI Workforce",
    summary:
      "Le module AI Workforce : synthèse, recherche, filtres par domaine et statut, vue grille ou liste.",
    content: `Le module AI Workforce, à la route « /agents », regroupe tous vos collaborateurs IA.

La page index affiche un bandeau de synthèse (effectif total, agents actifs, en mission, en attente), une barre d'outils avec recherche, filtres par domaine et par statut, un tri, et une bascule entre vue grille et vue liste.

Chaque carte présente un AI Agent : avatar, nom, rôle, domaine et statut. Un clic ouvre son résumé dans le Context Panel ; « Ouvrir la fiche » mène au détail complet.

Attention au vocabulaire : « AI Workforce » désigne le module et l'équipe, tandis qu'un collaborateur individuel se nomme par son rôle, par exemple Sales Agent ou Finance Agent.`,
    category: "AI Workforce",
    tags: ["ai workforce", "agents", "équipe ia"],
    readingTimeMin: 3,
    updatedAt: "2026-07-31T09:00:00.000Z",
    moduleLink: "/agents",
    relatedArticleIds: ["h-agent-detail", "h-missions"],
  },
  {
    id: "h-agent-detail",
    title: "La fiche d'un AI Agent",
    summary:
      "Les huit onglets de la fiche : Vue générale, Capacités, Outils, Permissions, Missions, Mémoire, Logs et Configuration.",
    content: `La fiche d'un AI Agent s'ouvre à la route « /agents/{id} ». Elle est organisée en huit onglets :

— Vue générale : identité, description et rôle de l'agent.
— Capacités : ce que l'agent sait faire.
— Outils : les intégrations qu'il mobilise.
— Permissions : ce qu'il est autorisé à faire, et sous quelles conditions.
— Missions : les missions auxquelles il participe, avec accès direct à chacune.
— Mémoire : les entrées de mémoire classées par niveau (mémoire de travail, long terme, partagée, Enterprise Brain). Une entrée de niveau Enterprise Brain renvoie directement vers la connaissance correspondante.
— Logs : la chronologie de son activité (appels d'outils, décisions…), avec un lien vers la mission concernée.
— Configuration : réglages généraux, autonomie, validation, outils actifs et limites.

Les onglets Mémoire, Logs et Configuration sont en lecture seule dans cette version.`,
    category: "AI Workforce",
    tags: ["agent", "onglets", "mémoire", "logs", "configuration"],
    readingTimeMin: 4,
    updatedAt: "2026-07-31T09:00:00.000Z",
    moduleLink: "/agents",
    relatedArticleIds: ["h-workforce", "h-brain", "h-securite"],
  },
  {
    id: "h-brain",
    title: "Alimenter l'Enterprise Brain",
    summary:
      "Le socle documentaire de l'entreprise : documents, procédures, wiki et FAQ métier, et leur lien avec les agents IA.",
    content: `L'Enterprise Brain, à la route « /enterprise-brain », contient la connaissance de votre entreprise. Quatre types de contenus coexistent : Document, Procédure, Wiki et FAQ.

La page index propose un bandeau de synthèse, une barre d'outils (recherche, filtres par type et statut, bascule grille/liste) et des chips de collections pour filtrer par catégorie. Chaque contenu porte un responsable, un statut (publié, brouillon, archivé) et une version.

La page de détail affiche le corps du document, ses tags, et surtout la section « Agents utilisant cette connaissance » : elle croise les mémoires des agents IA pour montrer qui s'appuie sur ce contenu. Le lien est bidirectionnel depuis l'onglet Mémoire d'un agent.

À ne pas confondre avec le Help Center, qui documente le produit NASSFLOW OS.`,
    category: "Enterprise Brain",
    tags: ["enterprise brain", "connaissance", "documents", "procédures"],
    readingTimeMin: 4,
    updatedAt: "2026-07-25T09:00:00.000Z",
    moduleLink: "/enterprise-brain",
    relatedArticleIds: ["h-agent-detail", "h-vocabulaire"],
  },
  {
    id: "h-crm",
    title: "Contacts et pipeline dans le CRM",
    summary:
      "Le module CRM et sa double vue : annuaire de contacts et pipeline commercial en Kanban.",
    content: `Le module CRM, à la route « /crm », propose deux vues commutables.

Contacts : un bandeau de KPI, une barre d'outils et l'ensemble des contacts en grille ou en liste. La fiche d'un contact, à la route « /crm/{id} », rassemble ses informations, les deals associés, un journal d'activités, la mission liée et l'AI Agent assigné — le plus souvent le Sales Agent.

Pipeline : les deals sont répartis en colonnes par étape commerciale. Chaque colonne affiche le total brut et le total pondéré par la probabilité, ce qui donne une lecture immédiate de la valeur du pipeline.`,
    category: "CRM",
    tags: ["crm", "contacts", "pipeline", "deals"],
    readingTimeMin: 3,
    updatedAt: "2026-07-24T09:00:00.000Z",
    moduleLink: "/crm",
    relatedArticleIds: ["h-workforce", "h-insights"],
  },
  {
    id: "h-workflow",
    title: "Comprendre le Workflow Engine",
    summary:
      "Le processus technique qui exécute une mission : séquence d'étapes, variables et historique d'exécutions.",
    content: `Le Workflow Engine, à la route « /workflow-engine », décrit comment une mission est exécutée techniquement.

La page index affiche un bandeau (taux de réussite, exécutions des dernières 24 h), une barre d'outils et les workflows en grille ou en liste.

La page de détail présente la séquence du workflow sous forme de liste verticale indentée, où les branches conditionnelles apparaissent en retrait. On y trouve également les variables utilisées, l'historique filtrable des exécutions avec leurs erreurs éventuelles, les missions liées et l'AI Agent responsable — généralement l'Ops Agent.

Retenez la distinction : une mission porte l'intention métier, un workflow porte son exécution technique.`,
    category: "Workflow Engine",
    tags: ["workflow", "exécution", "runs", "branches"],
    readingTimeMin: 4,
    updatedAt: "2026-07-23T09:00:00.000Z",
    moduleLink: "/workflow-engine",
    relatedArticleIds: ["h-missions", "h-orchestration"],
  },
  {
    id: "h-integrations",
    title: "Connecter vos outils dans l'Integrations Hub",
    summary:
      "Installer, reconnecter ou tester une intégration, et voir quels agents IA s'appuient dessus.",
    content: `L'Integrations Hub, à la route « /integrations-hub », recense les outils utilisés par vos agents IA ainsi que ceux qui restent à installer.

La page index affiche un bandeau de synthèse, une barre d'outils et des cartes portant chacune un badge de statut. Une intégration non installée propose un bouton « Connecter ».

La page de détail adapte ses actions au statut : reconnecter, déconnecter ou tester la connexion. Elle détaille aussi l'état de synchronisation, les permissions accordées et la liste des agents IA qui utilisent cet outil.`,
    category: "Intégrations",
    tags: ["intégrations", "connecteurs", "outils"],
    readingTimeMin: 3,
    updatedAt: "2026-07-22T09:00:00.000Z",
    moduleLink: "/integrations-hub",
    relatedArticleIds: ["h-agent-detail", "h-securite"],
  },
  {
    id: "h-insights",
    title: "Lire vos Insights",
    summary:
      "Six graphiques calculés à partir des missions, agents, deals, workflows et intégrations, avec filtre de période.",
    content: `Le module Insights, à la route « /insights », agrège les données des autres modules : missions, agents IA, deals du CRM, workflows et intégrations.

La page s'ouvre sur un bandeau de métriques transverses, complété par un filtre de période (7, 30 ou 90 jours) qui s'applique à l'ensemble de la page.

Six graphiques suivent : histogrammes, aires, courbes et camemberts. Aucune donnée n'est inventée : chaque valeur est dérivée du contenu réel des autres modules, ce qui garantit la cohérence entre ce que vous voyez ici et ailleurs dans la plateforme.`,
    category: "Démarrage",
    tags: ["insights", "analytics", "graphiques", "période"],
    readingTimeMin: 3,
    updatedAt: "2026-07-21T09:00:00.000Z",
    moduleLink: "/insights",
    relatedArticleIds: ["h-dashboard", "h-billing"],
  },
  {
    id: "h-organization",
    title: "Organisation hybride humains et IA",
    summary:
      "L'annuaire et les départements : comment humains et agents IA cohabitent dans la même structure.",
    content: `Le module Organization, à la route « /organization », décrit votre entreprise telle qu'elle fonctionne réellement : des personnes et des agents IA dans les mêmes départements.

La page index bascule entre deux vues : Annuaire, qui liste les membres, et Départements, qui présente chaque département avec son effectif hybride.

La fiche d'un membre, à la route « /organization/{id} », affiche ses informations, son ancienneté, son manager, les membres qui lui sont rattachés et les agents IA de son département.`,
    category: "Compte & organisation",
    tags: ["organisation", "départements", "annuaire", "équipe"],
    readingTimeMin: 3,
    updatedAt: "2026-07-19T09:00:00.000Z",
    moduleLink: "/organization",
    relatedArticleIds: ["h-settings", "h-securite"],
  },
  {
    id: "h-securite",
    title: "Surveiller la sécurité de la plateforme",
    summary:
      "Le Security Center : score de posture, accès et permissions, journal d'audit et politiques.",
    content: `Le Security Center, à la route « /security-center », consolide la sécurité de toute la plateforme.

Un bandeau affiche le score de posture de sécurité. Quatre sections sont ensuite accessibles :
— Vue d'ensemble : les événements de sécurité récents.
— Accès & Permissions : les accès des membres, les permissions des agents IA et celles des intégrations.
— Journal d'audit : un flux filtrable d'événements agrégés depuis les autres modules.
— Politiques : les règles de sécurité appliquées.

Le journal n'est pas une invention : il agrège des événements provenant réellement des missions, des agents et des intégrations.`,
    category: "Sécurité",
    tags: ["sécurité", "audit", "permissions", "posture"],
    readingTimeMin: 4,
    updatedAt: "2026-07-18T09:00:00.000Z",
    moduleLink: "/security-center",
    relatedArticleIds: ["h-agent-detail", "h-integrations", "h-settings"],
  },
  {
    id: "h-billing",
    title: "Suivre votre consommation et votre facturation",
    summary:
      "Le module Billing : consommation IA calculée depuis les missions et les logs d'agents, factures, plans et moyens de paiement.",
    content: `Le module Billing, à la route « /billing », ouvre sur un bandeau de synthèse avec la progression de votre quota. Quatre sections sont ensuite accessibles.

Consommation : un graphique filtrable par période (7, 30 ou 90 jours) et des tableaux par agent et par mission. Les montants sont calculés à partir du coût des missions et des coûts estimés dans les logs des agents IA, avec des liens directs vers l'agent ou la mission concernée.

Factures : la liste des factures avec badge de statut et téléchargement.

Plans : le comparatif des offres. Un changement de palier demande une confirmation explicite.

Moyens de paiement : la gestion des cartes enregistrées, la suppression étant elle aussi confirmée.`,
    category: "Facturation",
    tags: ["facturation", "consommation", "factures", "plans"],
    readingTimeMin: 4,
    updatedAt: "2026-07-17T09:00:00.000Z",
    moduleLink: "/billing",
    relatedArticleIds: ["h-insights", "h-settings"],
  },
  {
    id: "h-settings",
    title: "Configurer System Settings",
    summary:
      "Les réglages de la plateforme, en lecture seule, et leurs renvois vers Organization et Security Center.",
    content: `System Settings, à la route « /system-settings », rassemble les réglages de la plateforme dans une page unique à sections commutables.

Deux notions ne sont volontairement pas redéfinies ici : le profil de l'entreprise, qui vit dans Organization, et les accès et permissions, qui vivent dans le Security Center. Les sections concernées renvoient vers ces modules plutôt que de dupliquer l'information.

L'apparence propose trois thèmes, mais seul le thème sombre est actif dans cette version. Les clés API sont systématiquement masquées et leur révocation demande une confirmation, tout comme les actions destructrices telles que la suppression de l'ensemble des données.

Les réglages sont en lecture seule dans cette version.`,
    category: "Compte & organisation",
    tags: ["réglages", "paramètres", "api", "thème"],
    readingTimeMin: 3,
    updatedAt: "2026-07-16T09:00:00.000Z",
    moduleLink: "/system-settings",
    relatedArticleIds: ["h-organization", "h-securite"],
  },
  {
    id: "h-support",
    title: "Obtenir de l'aide et contacter le support",
    summary:
      "Utiliser la recherche du Help Center, ouvrir un ticket ou solliciter le Support Agent de votre AI Workforce.",
    content: `Le Help Center, à la route « /help-center », documente le produit NASSFLOW OS. Le bandeau de recherche filtre en temps réel les articles et les questions fréquentes.

Trois sections sont disponibles : Articles, avec des chips de catégories et un tri par pertinence, date ou temps de lecture ; FAQ, sous forme de questions dépliables ; et Support.

Depuis Support, vous pouvez ouvrir un ticket ou discuter avec le Support Agent, membre de votre AI Workforce. La liste de vos tickets affiche référence, sujet, statut, priorité et dernier message, avec un filtre par statut.

Dans cette version, l'ouverture de ticket et la discussion avec le Support Agent sont simulées.`,
    category: "Démarrage",
    tags: ["support", "aide", "tickets", "recherche"],
    readingTimeMin: 2,
    updatedAt: "2026-08-01T09:00:00.000Z",
    moduleLink: "/agents",
    relatedArticleIds: ["h-premiers-pas", "h-workforce"],
  },
];

export const helpFaqMock: HelpFaq[] = [
  {
    id: "f-1",
    question: "Quelle est la différence entre une mission et un workflow ?",
    answer:
      "Une mission porte l'intention métier : un objectif, des agents, des étapes et un coût. Un workflow porte l'exécution technique de cette intention, avec sa séquence d'étapes, ses branches conditionnelles et son historique d'exécutions.",
    category: "Missions",
  },
  {
    id: "f-2",
    question: "Quelle différence entre l'Enterprise Brain et le Help Center ?",
    answer:
      "L'Enterprise Brain contient la connaissance de votre entreprise : procédures internes, documents, wiki et FAQ métier. Le Help Center contient la documentation du produit NASSFLOW OS : comment utiliser la plateforme et ses modules.",
    category: "Enterprise Brain",
  },
  {
    id: "f-3",
    question: "Comment créer une mission ?",
    answer:
      "Ouvrez le module Missions et cliquez sur « Créer une Mission ». Le Mission Builder vous guide en cinq étapes : point de départ, objectif, agents & outils, étapes & validation, puis révision.",
    category: "Missions",
  },
  {
    id: "f-4",
    question: "Comment savoir sur quels documents s'appuie un AI Agent ?",
    answer:
      "Ouvrez la fiche de l'agent puis l'onglet Mémoire. Les entrées de niveau Enterprise Brain renvoient directement vers la connaissance correspondante. Inversement, la page d'un contenu de l'Enterprise Brain liste les agents qui l'utilisent.",
    category: "AI Workforce",
  },
  {
    id: "f-5",
    question: "Puis-je modifier la configuration d'un AI Agent ?",
    answer:
      "Les onglets Mémoire, Logs et Configuration sont consultables mais en lecture seule dans cette version. Vous y voyez l'autonomie, les règles de validation, les outils actifs et les limites appliquées.",
    category: "AI Workforce",
  },
  {
    id: "f-6",
    question: "Comment est calculée ma consommation IA ?",
    answer:
      "Elle est dérivée du coût des missions et des coûts estimés enregistrés dans les logs des agents IA. Le module Billing les agrège par agent, par mission et par jour, avec un filtre de période.",
    category: "Facturation",
  },
  {
    id: "f-7",
    question: "Comment connecter un nouvel outil ?",
    answer:
      "Rendez-vous dans l'Integrations Hub, repérez l'intégration souhaitée et utilisez le bouton « Connecter ». Sa page de détail permet ensuite de tester, reconnecter ou déconnecter l'outil.",
    category: "Intégrations",
  },
  {
    id: "f-8",
    question: "Où voir qui a accès à quoi ?",
    answer:
      "Dans le Security Center, section « Accès & Permissions ». Vous y trouvez les accès des membres, les permissions des agents IA et celles des intégrations. System Settings renvoie vers ce module au lieu de dupliquer l'information.",
    category: "Sécurité",
  },
  {
    id: "f-9",
    question: "Pourquoi ne puis-je pas passer en thème clair ?",
    answer:
      "Le design system de NASSFLOW OS est actuellement bâti sur le thème sombre. Les thèmes clair et système sont affichés dans System Settings mais restent désactivés dans cette version.",
    category: "Compte & organisation",
  },
  {
    id: "f-10",
    question: "Les données affichées sont-elles réelles ?",
    answer:
      "Non. Cette version fonctionne intégralement avec des données de démonstration cohérentes entre les modules. Aucune action n'est enregistrée et aucun service externe n'est appelé.",
    category: "Démarrage",
  },
];

export const supportTicketsMock: SupportTicket[] = [
  {
    id: "t-1",
    reference: "SUP-2026-014",
    subject: "Le Replay d'une mission se fige à l'étape parallèle",
    status: "open",
    priority: "high",
    createdAt: "2026-08-03T08:12:00.000Z",
    updatedAt: "2026-08-05T16:40:00.000Z",
    lastMessage:
      "Merci pour la capture. Nous reproduisons le comportement sur les missions comportant deux branches simultanées.",
  },
  {
    id: "t-2",
    reference: "SUP-2026-013",
    subject: "Ajouter un filtre par département dans l'annuaire",
    status: "pending",
    priority: "low",
    createdAt: "2026-07-29T10:05:00.000Z",
    updatedAt: "2026-08-02T09:20:00.000Z",
    lastMessage:
      "Demande transmise à l'équipe produit. Nous revenons vers vous dès l'arbitrage de la prochaine itération.",
  },
  {
    id: "t-3",
    reference: "SUP-2026-011",
    subject: "Écart entre le coût affiché dans Billing et dans une mission",
    status: "resolved",
    priority: "medium",
    createdAt: "2026-07-21T14:30:00.000Z",
    updatedAt: "2026-07-26T11:15:00.000Z",
    lastMessage:
      "L'écart venait d'un arrondi d'affichage. Les agrégats de consommation sont désormais alignés sur les coûts des missions.",
  },
  {
    id: "t-4",
    reference: "SUP-2026-008",
    subject: "Impossible de reconnecter une intégration déconnectée",
    status: "closed",
    priority: "medium",
    createdAt: "2026-07-08T09:45:00.000Z",
    updatedAt: "2026-07-15T17:00:00.000Z",
    lastMessage:
      "Ticket clôturé après confirmation de votre côté : la reconnexion fonctionne depuis la page de détail de l'intégration.",
  },
  {
    id: "t-5",
    reference: "SUP-2026-006",
    subject: "Demande d'accès en écriture aux réglages système",
    status: "closed",
    priority: "low",
    createdAt: "2026-06-30T13:00:00.000Z",
    updatedAt: "2026-07-04T08:30:00.000Z",
    lastMessage:
      "System Settings reste en lecture seule dans cette version. Le sujet est suivi dans la feuille de route produit.",
  },
];

export function helpArticleById(id: string): HelpArticle | undefined {
  return helpArticlesMock.find((a) => a.id === id);
}

export function helpArticlesByIds(ids: string[]): HelpArticle[] {
  return ids.map((id) => helpArticleById(id)).filter((a): a is HelpArticle => Boolean(a));
}

export function helpCategoryCounts(): { category: HelpArticle["category"]; count: number }[] {
  const map = new Map<HelpArticle["category"], number>();
  for (const article of helpArticlesMock) {
    map.set(article.category, (map.get(article.category) ?? 0) + 1);
  }
  return [...map.entries()].map(([category, count]) => ({ category, count }));
}
