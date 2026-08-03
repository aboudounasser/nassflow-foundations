# NASSFLOW Foundations

Je construis NASSFLOW OS, un AI Operating System pour entreprises (pas un CRM, pas un chatbot, pas un simple outil SaaS). 

Cette première génération ne doit contenir AUCUNE logique métier, AUCUNE donnée, AUCUN écran fonctionnel. 

Objectif unique : poser le Design System officiel et le Master Layout qui serviront de fondation à toute la plateforme.

===========================================

1. DESIGN SYSTEM — FOUNDATIONS

===========================================

STYLE GÉNÉRAL

Interface sombre par défaut (dark mode prioritaire), inspirée de Linear, OpenAI Platform, Apple et Notion. 

Minimaliste, élégante, rapide, lisible, jamais spectaculaire. Le design ne doit jamais attirer l'attention sur lui-même.

PALETTE DE COULEURS OFFICIELLE (à définir en tokens CSS/Tailwind)

- Background principal : #09090B

- Surface : #111113

- Cards : #18181B

- Bordures : #27272A

- Texte principal : #FAFAFA

- Texte secondaire : #A1A1AA

- Couleur primaire (actions, liens) : #6366F1

- Hover primaire : #4F46E5

- Succès : #22C55E

- Attention : #F59E0B

- Erreur : #EF4444

- Information : #0EA5E9

TYPOGRAPHIE

Police officielle : Inter (import Google Fonts ou variable font)

- H1 : 32px / Bold

- H2 : 28px / SemiBold

- H3 : 22px / SemiBold

- H4 : 18px / Medium

- Texte courant : 16px / Regular

- Petit texte / métadonnées : 14px / Regular

ICÔNES

Bibliothèque officielle : Lucide Icons (lucide-react). Taille standard 20px. Style homogène, jamais mélangé avec d'autres jeux d'icônes.

ESPACEMENTS

Grille de 8px. Tous les paddings/margins/gaps doivent être des multiples de 8 (8, 16, 24, 32, 48, 64, 96).

RADIUS

- Cartes : 16px

- Boutons : 12px

- Champs de saisie : 12px

COMPOSANTS (hauteur standard)

- Boutons : hauteur 44px, radius 12px. Variantes : Primary, Secondary, Ghost, Outline, Destructive, Icon Button.

- Champs de saisie : hauteur 44px, radius 12px. Types : Text, Password, Search, Number, Date, Select, Multi-Select, Textarea.

- Chaque composant doit prévoir ces états : Default, Hover, Active, Focus, Loading, Disabled, Empty, Success, Error.

ANIMATIONS

Durée 150–200ms uniquement. Types autorisés : Fade, Slide, Scale, Collapse, Expand. 

Aucune animation décorative — uniquement pour confirmer une action, guider l'utilisateur, ou fluidifier une transition.

OMBRES

Discrètes, jamais spectaculaires. Utilisées uniquement pour améliorer la lisibilité (ex : légère élévation au survol d'une carte).

ACCESSIBILITÉ (WCAG AA)

- Contraste élevé partout

- Navigation clavier complète

- Focus visible sur tous les éléments interactifs

- Zones cliquables minimum 44×44px

- Structure HTML sémantique

===========================================

2. COMPOSANTS DE BASE À CRÉER (bibliothèque réutilisable)

===========================================

Crée une bibliothèque de composants réutilisables, chacun respectant les tokens ci-dessus, chacun avec tous ses états (Loading, Empty, Error, Success, Disabled) :

- Button (Primary, Secondary, Ghost, Outline, Destructive, Icon Button)

- Input (Text, Search, Select)

- Card (conteneur générique)

- Badge

- Toast / notification discrète

- Modal / Dialog

- Skeleton Loader

- Avatar

Ne crée AUCUN composant métier (pas de "Mission Card", pas de "Agent Card", pas de "KPI Card" à ce stade — ils viendront dans une prochaine itération).

===========================================

3. MASTER LAYOUT (structure universelle de toute la plateforme)

===========================================

Structure obligatoire, identique sur toutes les futures pages :

┌─────────────────────────────────────────────┐

│                  TOP BAR                     │

├───────────┬───────────────────┬─────────────┤

│           │                   │             │

│  SIDEBAR  │   MAIN CONTENT    │ CONTEXT     │

│           │                   │ PANEL       │

│           │                   │             │

└───────────┴───────────────────┴─────────────┘

TOP BAR (hauteur ~72px, toujours visible, ne change jamais selon la page)

Contient, de gauche à droite :

- Logo "NASSFLOW OS" (texte stylisé, pas besoin de vrai logo pour l'instant — cliquable, retour à l'accueil)

- Workspace Switcher (placeholder : bouton avec nom d'organisation fictif + chevron)

- Barre de recherche universelle centrée (placeholder "Rechercher... (⌘K)")

- Icône "AI Status" (point vert = état des services IA, juste visuel pour l'instant)

- Icône Notifications (avec badge de compteur)

- Avatar utilisateur (menu déroulant placeholder : Profil, Préférences, Déconnexion)

SIDEBAR (largeur 280px, réductible en mode icônes à 80px, toujours visible sur desktop)

Liste de navigation verticale, dans cet ordre exact (utiliser des icônes Lucide cohérentes) :

1. Mission Control

2. Missions

3. AI Agents

4. CRM

5. Enterprise Brain

6. Workflow Engine

7. Integrations Hub

8. Insights

9. Organization

10. Security Center

11. Billing

12. System Settings

13. Help Center

Chaque item : icône + label, état actif visuellement distinct (fond légèrement contrasté + texte en couleur primaire), état hover discret. 

Bouton de réduction/expansion en bas de la sidebar.

Pour l'instant, chaque lien peut pointer vers une page vide de type "Coming soon" avec le titre du module — pas besoin de contenu réel.

MAIN CONTENT (largeur max 1440px, grille 12 colonnes)

Zone centrale. Pour cette première génération, affiche uniquement une page d'accueil placeholder simple : titre "Mission Control" + texte "Fondations posées. Prochaine étape : construction du Dashboard CEO." — rien d'autre.

CONTEXT PANEL (largeur 360px, à droite)

Panneau contextuel vide pour l'instant, avec juste un état "Empty" : icône + texte "Aucun contexte sélectionné."

===========================================

4. RESPONSIVE

===========================================

- Desktop (>1280px) : Top Bar + Sidebar + Main Content + Context Panel tous visibles.

- Tablette (768–1279px) : Sidebar réduite en mode icônes, Context Panel devient un panneau coulissant (Drawer) fermé par défaut.

- Mobile (<768px) : Sidebar transformée en menu latéral (Drawer) déclenché par une icône hamburger dans la Top Bar. Context Panel accessible en plein écran uniquement si activé.

===========================================

5. DARK MODE

===========================================

Le thème sombre (palette ci-dessus) est le thème PAR DÉFAUT. Prévoir la structure de tokens pour permettre plus tard un light mode, mais ne pas le développer maintenant — seul le dark mode doit être fonctionnel.

===========================================

CE QUE TU NE DOIS PAS FAIRE

===========================================

- Ne crée aucune fonctionnalité métier (pas de Missions réelles, pas d'Agents réels, pas de données).

- Ne crée aucun composant IA (Mission Card, Agent Card, Enterprise Pulse, etc.) — ce sera l'étape suivante.

- N'invente pas de nouveau style graphique en dehors de cette spécification.

- Ne modifie jamais cette structure de Master Layout dans les prochaines itérations sans instruction explicite.

===========================================

DÉFINITION DE "TERMINÉ" POUR CETTE ÉTAPE

===========================================

Cette génération est considérée comme terminée quand :

✓ Le Design System (couleurs, typo, spacing, radius, composants de base) est en place et documenté dans le code (tokens réutilisables)

✓ Le Master Layout (Top Bar, Sidebar, Main Content, Context Panel) est fonctionnel et responsive

✓ La navigation de la Sidebar liste les 13 modules officiels dans le bon ordre

✓ Aucune logique métier n'a été ajoutée

✓ Tout est en dark mode et respecte l'accessibilité de base

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/8bdcdcbf-dcaf-40a7-be7b-24af2049c1d3).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
