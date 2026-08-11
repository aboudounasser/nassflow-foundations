# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Langue

Réponds toujours en français dans cette conversation, y compris les explications, les résumés et les messages de commit. Le code, les noms de variables et de fichiers restent en anglais selon les conventions existantes du projet. Les chaînes visibles par l'utilisateur final restent en français, comme le reste de l'application.

## Project

NASSFLOW OS — an "AI Operating System" front-end (TanStack Start + React 19 + Tailwind v4 + shadcn/ui, Supabase for auth). The UI language is **French**: all user-facing strings, and most code comments, are written in French. Keep that convention.

`README.md` is the original design brief (design tokens, master layout, module list) — it describes the first generation and is now partly outdated (business modules do exist). The tokens, layout and 13-module list in it are still normative.

## Commands

Package manager is **bun** (`bun.lock`, `bunfig.toml`).

```sh
bun install          # bunfig sets minimumReleaseAge=86400 — new packages <24h old are blocked
bun run dev          # vite dev
bun run build        # vite build (nitro, cloudflare target by default)
bun run check        # typecheck + lint + format:check — what CI runs
bun run typecheck    # tsc --noEmit
bun run lint:fix
bun run format
```

There is **no test framework** in this project. Verification = `bun run check` plus running the app.

## Architecture

### Rendering / routing

TanStack Start with file-based routing in `src/routes/` (see `src/routes/README.md` for the naming table). `src/routeTree.gen.ts` is generated — never edit it.

- `src/routes/__root.tsx` — head tags, 404 + error components, and the auth split: paths in `PUBLIC_ROUTES` (`/login`, `/signup`, `/forgot-password`, `/reset-password`) render a bare `<Outlet />`; everything else is wrapped in `SessionProvider` → `AppShell`.
- `src/start.ts` — `createStart` with an SSR error middleware and an explicitly re-added CSRF middleware (defining this file opts out of the automatic one — don't drop it).
- `src/server.ts` — custom server entry (`vite.config.ts` points TanStack Start at it) that catches h3-swallowed 500s and renders `lib/error-page.ts`.
- `vite.config.ts` uses `@lovable.dev/vite-tanstack-config`, which already bundles the React/Tailwind/nitro/tsconfig-paths plugins. Do not add them manually.

### Master Layout

`src/components/layout/app-shell.tsx` implements the normative shell — Top Bar (72px) / Sidebar (280px, 80px collapsed) / Main Content / Context Panel (360px). Main content is a `max-w-[1440px]` **12-column grid**, so every page section must carry a `col-span-*` class (usually `col-span-12`). Don't restructure the shell without an explicit instruction.

The Context Panel is filled by the current page, not by the layout: call `useContextPanelContent(() => <SomePanel/>, [deps])` to inject content while mounted, and `useContextPanel().requestOpen()` to open the drawer on tablet/mobile.

`src/lib/navigation.ts` holds `NAV_ITEMS` — the 13 modules in normative order.

### Data flow — the module pattern

Every business module follows the same four-layer split. Copy an existing module (`missions` is the fullest example) when adding one.

```
src/lib/<module>/types.ts    domain types
src/lib/<module>/mocks.ts    fixture data
src/lib/<module>/meta.ts     status→label/icon/variant maps, filter & view descriptors, formatters
src/lib/<module>/queries.ts  useQuery hooks (the only thing routes import)
src/services/<module>.ts     "service layer": async fns, first param is always `_scope: Scope`
src/components/<module>/     presentational components
src/routes/<module>.index.tsx, <module>.$id.tsx
```

- **Services are still mocked.** They return `delay(mockData)` from `src/services/latency.ts` (250ms) so loading states are real. Only `src/services/auth.ts` talks to Supabase. When wiring a module to real data, replace the body of the service function — routes, queries and components should not change.
- **Every query key must start with the scope.** `queryKey: [...scopeKey(scope), "<module>", ...]` (`src/lib/tenancy/keys.ts`). This is a tenancy/security requirement: switching organizations purges `organizationRootKey(orgId)`, and a key without the org id would leak the previous org's data.
- Routes read `useSession()` indirectly through the module's `use*` hooks; they never import a service directly.
- Detail views fetch one aggregate per id (mission + related missions + agents) rather than several queries.

### Auth & Supabase

There are **two** Supabase client trees; this matters:

- `src/lib/supabase/` — hand-written, the one application code uses (`@/lib/supabase/client`, `@/lib/supabase/database.types`). Lazy `Proxy` client so SSR can import it safely. `database.types.ts` is the single source of truth for the DB schema; regenerate it after any migration.
- `src/integrations/supabase/` — Lovable-generated (`client.ts`, `client.server.ts`, `auth-middleware.ts`, `types.ts`). Marked "do not edit", and excluded from eslint and prettier. `client.server.ts` uses the service-role key and must only be imported from server handlers via dynamic `import()` or from other `*.server.ts` modules.

`SessionProvider` (`src/components/providers/session-provider.tsx`) is the auth+tenancy gate: it loads the user and memberships, gates on `loading | signedOut | noOrg | ready`, redirects to `/login` when signed out, shows `OnboardingScreen` when the user has no organization, and persists the active org in `localStorage` under `nassflow.activeOrganizationId`. Its `onAuthChange` callback must never call Supabase synchronously (it defers via `setTimeout`) — the Supabase auth lock will deadlock otherwise.

Account deletion goes through a Supabase edge function (`supabase.functions.invoke("delete-account")`) deployed outside this repo; only `supabase/config.toml` is checked in.

### UI conventions

- shadcn/ui (new-york) in `src/components/ui/` — regenerable, avoid hand-editing.
- Design tokens live in `src/styles.css` (`@theme inline` + `:root`). Dark mode is the only implemented theme; the `.light` scope is reserved and intentionally empty. Use semantic token classes (`bg-card`, `text-muted-foreground`, `border-border`, `text-success`) rather than raw colors, `h-11`/`rounded-lg` for controls, `rounded-xl` for cards, and 8px-grid spacing. Animations 150–200ms only.
- Icons: `lucide-react` only, ~20px.
- Async surfaces use `WidgetShell` (`src/components/dashboard/widget-shell.tsx`) with an explicit `state` of `loading | empty | error | success` and a skeleton; empty/error states use `EmptyState` (`src/components/common/empty-state.tsx`). List pages use `ModuleToolbar` driven by the `FilterDescriptor[]` / `ViewDescriptor[]` from the module's `meta.ts` rather than bespoke filter UI.
- Every route defines its own `head()` with title/description/OG tags.

### TypeScript

`strict` plus `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitReturns`, `noPropertyAccessFromIndexSignature`. Consequences you will hit: index access yields `T | undefined`, optional props must be typed `foo?: X | undefined`, and `import.meta.env` / `process.env` must be read with bracket syntax (`import.meta.env["VITE_SUPABASE_URL"]`).

## Base de données Supabase

Cette section est en français, comme le reste des conventions du projet. Elle prime sur tout réflexe « standard Supabase ».

**1. Le schéma est écrit à la main — ne pas migrer sans accord.** Les tables (`organizations`, `profiles`, `memberships`), les politiques RLS et les fonctions `SECURITY DEFINER` ont été rédigées et durcies manuellement. Ne jamais créer ni exécuter une migration SQL sans validation explicite de l'utilisateur.

**2. Six étapes obligatoires pour toute nouvelle table**, dans cet ordre :

```sql
create table ...
alter table ... enable row level security;
create policy ...            -- filtrée sur organization_id
grant ... to authenticated;
grant ... to service_role;   -- uniquement si une Edge Function y accède
revoke truncate, references, trigger on ... from authenticated, service_role;
```

Les six, jamais quatre : « Automatically expose new tables » est désactivé sur ce projet (aucun `grant` implicite n'est posé), et `service_role` contourne RLS mais **pas** les privilèges de table — sans `grant` explicite, l'Edge Function échoue en `permission denied`.

**3. La clé `service_role` ne doit jamais apparaître dans `src/`.** Toute opération privilégiée passe par une Edge Function Supabase (voir `delete-account`), jamais par un client à privilèges élevés monté dans l'application.

**4. Propager les messages d'erreur PostgreSQL tels quels.** Les `raise exception` des triggers et des fonctions sont rédigés pour l'utilisateur final : les afficher intacts, ne pas les remplacer par un texte générique.

**5. Extraire les erreurs d'Edge Function via `FunctionsHttpError`.** `supabase-js` masque le corps de la réponse dans `error.message` ; il faut tester `error instanceof FunctionsHttpError` puis lire `await error.context.json()`. Modèle de référence : `deleteAccount()` dans `src/services/auth.ts`.

## Lovable

This repo is connected to Lovable (`.lovable/project.json`, `AGENTS.md`). Do not rewrite published git history (no force-push, rebase, amend, or squash of pushed commits) — it corrupts the project history on Lovable's side. Commits pushed to `main` sync into the Lovable editor, so keep the branch working.
