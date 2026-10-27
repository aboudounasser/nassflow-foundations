-- ═══════════════════════════════════════════════════════════════════════════
-- Agent Email V1 : messages triés et brouillons de réponse.
--
-- À exécuter À LA MAIN dans le SQL Editor, après validation. Ne jamais lancer
-- `supabase db push` : le reste du schéma n'est pas versionné ici.
-- Retour arrière : supabase/rollbacks/20261028120000_email_agent_v1.sql
-- Tests (transaction annulée) : supabase/manual-tests/20261028120000_email_agent_v1.sql
--
-- À exécuter AVANT de déployer run-gmail-scan v14 et scheduled-gmail-scan v2 :
-- elles écrivent dans inbox_messages et lisent email_reply_drafts pour le
-- budget du jour. Sans ces tables, toute analyse échouerait.
--
-- Données personnelles : objet, expéditeur et résumé d'une phrase. Le corps des
-- e-mails n'est JAMAIS stocké. Conservation : 90 jours pour le tri, 30 jours
-- pour les brouillons (purge quotidienne, § 3).
--
-- Prérequis : schéma `private` (20261004120000), pg_cron.
-- ═══════════════════════════════════════════════════════════════════════════

begin;

-- ─── 1. Messages triés ───────────────────────────────────────────────────
-- Une ligne par message traité par l'analyse (manuelle ou planifiée), écrite
-- par l'Edge Function en même temps que seen_messages : jamais par le
-- navigateur, qui ne modifie que le statut.
create table public.inbox_messages (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null
    references public.organizations (id) on delete cascade,
  integration_id uuid not null
    references public.integrations (id) on delete cascade,
  run_id uuid references public.runs (id) on delete set null,

  -- Identifiants Gmail : le lien « Ouvrir dans Gmail » porte sur le fil.
  message_id text not null,
  thread_id text,

  from_header text,
  subject text,
  received_at timestamptz,

  -- 'automated' : écarté sur sa forme (newsletter, no-reply), sans appel IA.
  category text not null
    constraint inbox_messages_category_check
    check (category in ('prospect', 'client', 'supplier', 'finance_admin', 'meeting', 'other', 'automated')),
  priority text not null default 'normal'
    constraint inbox_messages_priority_check
    check (priority in ('high', 'normal', 'low')),
  summary text
    constraint inbox_messages_summary_check
    check (char_length(summary) <= 300),

  -- Seule colonne modifiable depuis le navigateur (grant de colonne, § 1bis).
  status text not null default 'to_handle'
    constraint inbox_messages_status_check
    check (status in ('to_handle', 'handled', 'ignored')),
  status_changed_at timestamptz,
  status_changed_by uuid references auth.users (id) on delete set null,

  created_at timestamptz not null default now(),

  -- Comme seen_messages : un identifiant Gmail n'a de sens que dans sa boîte.
  constraint inbox_messages_message_unique unique (integration_id, message_id)
);

-- Liste de la fiche Email Agent : une organisation, un statut, les plus récents.
create index inbox_messages_list_idx
  on public.inbox_messages (organization_id, status, received_at desc);
-- Purge quotidienne (§ 3).
create index inbox_messages_purge_idx
  on public.inbox_messages (created_at);

-- ─── 1bis. RLS et privilèges (les six étapes) ────────────────────────────
alter table public.inbox_messages enable row level security;

create policy inbox_messages_select on public.inbox_messages
  for select to authenticated
  using (public.current_user_role(organization_id) in ('owner', 'admin'));

create policy inbox_messages_update on public.inbox_messages
  for update to authenticated
  using (public.current_user_role(organization_id) in ('owner', 'admin'))
  with check (public.current_user_role(organization_id) in ('owner', 'admin'));

-- Point de départ explicite : aucun privilège implicite.
revoke all on public.inbox_messages from anon, authenticated, service_role;

grant select on public.inbox_messages to authenticated;
-- Le statut seul : ni la catégorie, ni la priorité, ni le résumé.
grant update (status) on public.inbox_messages to authenticated;

-- Edge Functions : l'analyse insère (ON CONFLICT DO NOTHING), le brouillon lit.
grant select, insert on public.inbox_messages to service_role;

revoke truncate, references, trigger on public.inbox_messages from authenticated, service_role;

-- Traçabilité du statut. Un trigger BEFORE peut écrire des colonnes sans grant
-- (comme scan_schedules.updated_by à l'étape 4). auth.uid() vaut NULL depuis
-- le SQL Editor ou une Edge Function.
create function private.inbox_messages_before_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status is distinct from old.status then
    new.status_changed_at := now();
    new.status_changed_by := auth.uid();
  end if;
  return new;
end;
$$;

revoke all on function private.inbox_messages_before_update()
  from public, anon, authenticated, service_role;

create trigger inbox_messages_before_update
  before update on public.inbox_messages
  for each row
  execute function private.inbox_messages_before_update();

-- ─── 2. Brouillons de réponse ────────────────────────────────────────────
-- Une ligne par génération (régénération autorisée) : chaque appel payé reste
-- tracé, et le budget du jour de la boîte se calcule depuis minuit local sur
-- runs + email_reply_drafts.
create table public.email_reply_drafts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null
    references public.organizations (id) on delete cascade,
  integration_id uuid not null
    references public.integrations (id) on delete cascade,
  inbox_message_id uuid not null
    references public.inbox_messages (id) on delete cascade,

  -- NULL : appel payé, réponse du modèle illisible. Le coût reste compté.
  body text
    constraint email_reply_drafts_body_check
    check (char_length(body) <= 5000),
  -- Informations à compléter avant envoi, listées par le modèle.
  missing_info jsonb not null default '[]'::jsonb
    constraint email_reply_drafts_missing_info_check
    check (jsonb_typeof(missing_info) = 'array'),
  model text not null,
  cost_millicents integer not null
    constraint email_reply_drafts_cost_check
    check (cost_millicents >= 0),

  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

-- Dernier brouillon d'un message.
create index email_reply_drafts_message_idx
  on public.email_reply_drafts (inbox_message_id, created_at desc);
-- Dépense du jour d'une boîte ; sert aussi à la purge.
create index email_reply_drafts_budget_idx
  on public.email_reply_drafts (integration_id, created_at);

alter table public.email_reply_drafts enable row level security;

create policy email_reply_drafts_select on public.email_reply_drafts
  for select to authenticated
  using (public.current_user_role(organization_id) in ('owner', 'admin'));

revoke all on public.email_reply_drafts from anon, authenticated, service_role;

-- Lecture seule depuis le navigateur : seule l'Edge Function écrit.
grant select on public.email_reply_drafts to authenticated;
grant select, insert on public.email_reply_drafts to service_role;

revoke truncate, references, trigger on public.email_reply_drafts from authenticated, service_role;

-- ─── 3. Conservation (RGPD) ──────────────────────────────────────────────
-- 30 jours pour les brouillons, 90 jours pour le tri, comptés depuis l'analyse.
-- La suppression d'un message emporte ses brouillons (cascade).
create function private.purge_email_agent_data()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.email_reply_drafts where created_at < now() - interval '30 days';
  delete from public.inbox_messages where created_at < now() - interval '90 days';
end;
$$;

revoke all on function private.purge_email_agent_data()
  from public, anon, authenticated, service_role;

select cron.schedule(
  'purge-email-agent-data',
  '45 3 * * *',
  $$select private.purge_email_agent_data()$$
);

commit;

-- ─── Vérifications après exécution (lecture seule) ───────────────────────
-- select jobname, schedule, active from cron.job order by jobname;
--   → purge-email-agent-data '45 3 * * *' active = true ; dispatch-gmail-scans
--     toujours active = true.
-- select tablename, rowsecurity from pg_tables
--  where tablename in ('inbox_messages', 'email_reply_drafts');
