-- ═══════════════════════════════════════════════════════════════════════════
-- Sales Agent autonome — étape 6 : déclenchement planifié des analyses.
--
-- À exécuter À LA MAIN dans le SQL Editor, après validation. Ne jamais lancer
-- `supabase db push` : le reste du schéma n'est pas versionné ici.
-- Retour arrière : supabase/rollbacks/20261004160000_sales_agent_step6.sql
-- Tests (transaction annulée) : supabase/manual-tests/20261004160000_sales_agent_step6.sql
--
-- La tâche cron est créée INACTIVE : rien ne part tant qu'elle n'est pas
-- activée (étape 7). Le dispatcher peut être lancé à la main pour les tests.
--
-- Authentification sans secret partagé : à chaque déclenchement, le
-- dispatcher tire un jeton aléatoire à usage unique (10 minutes), n'en garde
-- que l'empreinte SHA-256, et l'envoie à la fonction Edge, qui l'échange
-- contre la boîte à analyser via claim_scan_dispatch (service_role
-- seulement). Aucun secret durable : rien dans le code, rien dans les
-- secrets Edge, rien à copier.
--
-- Prérequis : schéma `private` (étape 3), pg_cron (étape 3), scan_schedules
-- et compute_next_scan_at (étape 4), pgcrypto dans le schéma `extensions`
-- (installé par défaut sur Supabase ; vérifié par la requête 0 des tests).
-- ═══════════════════════════════════════════════════════════════════════════

begin;

-- ─── 1. pg_net, méthode documentée par Supabase ──────────────────────────
-- https://supabase.com/docs/guides/database/extensions/pg_net
-- Crée son propre schéma `net`. Les requêtes ne partent qu'après le COMMIT
-- de la transaction qui les émet.
create extension if not exists pg_net with schema extensions;

-- ─── 2. Réglages de la plateforme (rien de secret) ───────────────────────
-- L'URL de base des fonctions n'est pas un secret, mais elle n'a rien à faire
-- dans le corps d'une fonction SQL : une table se modifie sans redéfinir le
-- dispatcher, et se relit d'un coup d'œil.
create table private.app_settings (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

alter table private.app_settings enable row level security;
-- Aucune politique, aucun grant : seuls postgres et les fonctions SECURITY
-- DEFINER la lisent.
revoke all on private.app_settings from public, anon, authenticated, service_role;

insert into private.app_settings (key, value)
values ('functions_base_url', 'https://pgxaqwzikqgovvucvwsk.supabase.co/functions/v1');

-- ─── 3. Journal des déclenchements ───────────────────────────────────────
-- Une ligne par analyse planifiée envoyée : traçabilité complète (quand,
-- quelle boîte, quelle requête pg_net, quel run), et support du jeton à usage
-- unique. Seule l'EMPREINTE du jeton est conservée.
create table private.scan_dispatches (
  id uuid primary key default gen_random_uuid(),
  integration_id uuid not null references public.integrations (id) on delete cascade,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  token_hash bytea not null unique,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  claimed_at timestamptz,
  -- Identifiant de la requête dans net._http_response (conservée 6 h).
  net_request_id bigint,
  run_id uuid references public.runs (id) on delete set null
);

create index scan_dispatches_created_at_idx on private.scan_dispatches (created_at);

-- Journal technique, jamais lu depuis le navigateur ni par une Edge Function
-- directement (comme seen_messages) : RLS sans politique, aucun grant.
alter table private.scan_dispatches enable row level security;
revoke all on private.scan_dispatches from public, anon, authenticated, service_role;
revoke truncate, references, trigger on private.scan_dispatches from authenticated, service_role;

-- ─── 4. Échange du jeton (Edge Function → base) ──────────────────────────
-- Usage unique et durée de vie de 10 minutes, garantis par un seul UPDATE.
-- Comparaison des EMPREINTES : la durée de la recherche ne renseigne pas sur
-- le jeton (un attaquant ne contrôle pas l'empreinte de ce qu'il envoie).
-- Rend la boîte à analyser : l'appelant ne choisit ni l'organisation ni
-- l'intégration.
create function public.claim_scan_dispatch(p_token text)
returns table (dispatch_id uuid, dispatch_organization_id uuid, dispatch_integration_id uuid)
language plpgsql
security definer
set search_path = ''
as $$
begin
  return query
  update private.scan_dispatches d
     set claimed_at = now()
   where d.token_hash = extensions.digest(p_token, 'sha256')
     and d.claimed_at is null
     and d.expires_at > now()
  returning d.id, d.organization_id, d.integration_id;
end;
$$;

revoke all on function public.claim_scan_dispatch(text) from public, anon, authenticated;
grant execute on function public.claim_scan_dispatch(text) to service_role;

-- Rattache le run au déclenchement, une fois l'analyse terminée.
create function public.attach_scan_dispatch_run(p_dispatch_id uuid, p_run_id uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  update private.scan_dispatches
     set run_id = p_run_id
   where id = p_dispatch_id and claimed_at is not null and run_id is null;
$$;

revoke all on function public.attach_scan_dispatch_run(uuid, uuid) from public, anon, authenticated;
grant execute on function public.attach_scan_dispatch_run(uuid, uuid) to service_role;

-- ─── 5. Dispatcher ───────────────────────────────────────────────────────
-- Réservation atomique : l'UPDATE verrouille chaque ligne due et avance son
-- échéance AVANT l'envoi. Deux exécutions simultanées ne réservent jamais la
-- même boîte (la seconde relit la ligne, qui n'est plus due).
-- L'échéance suivante part de now() : après une panne, une seule analyse de
-- rattrapage, jamais une rafale.
-- Ignore : boîte en pause, intégration non active, suspension après 3
-- échecs consécutifs (MAX_CONSECUTIVE_FAILURES côté interface).
-- SECURITY INVOKER, comme le nettoyeur : seul pg_cron l'appelle, en tant que
-- postgres (ou Nasser depuis le SQL Editor, pour les tests).
create function private.dispatch_due_gmail_scans()
returns integer
language plpgsql
set search_path = ''
as $$
declare
  base_url text;
  due record;
  token text;
  new_dispatch_id uuid;
  request_id bigint;
  dispatched integer := 0;
begin
  select value into base_url
    from private.app_settings
   where key = 'functions_base_url';
  if base_url is null then
    -- Échec visible dans cron.job_run_details plutôt qu'un silence.
    raise exception 'private.app_settings : functions_base_url manquant';
  end if;

  -- Purge du journal : 30 jours d'historique suffisent à l'audit.
  delete from private.scan_dispatches where created_at < now() - interval '30 days';

  for due in
    update public.scan_schedules s
       set next_run_at = public.compute_next_scan_at(s.frequency, s.run_hour, s.timezone, now())
      from public.integrations i
     where i.id = s.integration_id
       and s.enabled
       and i.status = 'active'
       and s.next_run_at <= now()
       and s.consecutive_failures < 3
    returning s.integration_id, s.organization_id
  loop
    token := encode(extensions.gen_random_bytes(32), 'hex');

    insert into private.scan_dispatches (integration_id, organization_id, token_hash, expires_at)
    values (due.integration_id, due.organization_id,
            extensions.digest(token, 'sha256'), now() + interval '10 minutes')
    returning id into new_dispatch_id;

    -- 10 s : le délai par défaut (2 s) ne couvre pas un démarrage à froid.
    -- La fonction répond 202 dès le jeton vérifié, l'analyse continue après.
    request_id := net.http_post(
      url := base_url || '/scheduled-gmail-scan',
      body := jsonb_build_object('token', token),
      headers := jsonb_build_object('Content-Type', 'application/json'),
      timeout_milliseconds := 10000
    );

    update private.scan_dispatches set net_request_id = request_id where id = new_dispatch_id;
    dispatched := dispatched + 1;
  end loop;

  return dispatched;
end;
$$;

revoke all on function private.dispatch_due_gmail_scans()
  from public, anon, authenticated, service_role;

-- ─── 6. Nettoyeur : compter aussi l'échec d'une analyse planifiée ────────
-- Remplace la version de l'étape 3. Une analyse planifiée tuée par la limite
-- de durée n'a pas pu mettre à jour scan_schedules elle-même : sans ce
-- complément, une boîte qui dépasse à chaque fois ne serait jamais suspendue.
create or replace function private.reap_stuck_runs()
returns integer
language plpgsql
set search_path = ''
as $$
declare
  reaped integer;
begin
  with stuck as (
    update public.runs
       set status = 'failed',
           finished_at = now(),
           error_message = 'Analyse interrompue : elle a dépassé la durée maximale autorisée. Relancez-la.'
     where status = 'running'
       and started_at < now() - interval '15 minutes'
    returning id, integration_id, trigger_source
  ), closed as (
    update public.missions m
       set status = 'failed',
           progress = 100,
           completed_at = now(),
           updated_at = now()
      from stuck
     where m.run_id = stuck.id
       and m.status = 'running'
    returning m.id
  ), counted as (
    update public.scan_schedules s
       set consecutive_failures = s.consecutive_failures + 1,
           last_error = 'Analyse interrompue : elle a dépassé la durée maximale autorisée.',
           last_error_at = now(),
           last_scheduled_run_id = stuck.id
      from stuck
     where stuck.trigger_source = 'schedule'
       and s.integration_id = stuck.integration_id
    returning s.integration_id
  )
  select count(*) into reaped from stuck;
  return reaped;
end;
$$;

revoke all on function private.reap_stuck_runs() from public, anon, authenticated, service_role;

-- ─── 7. Déconnexion volontaire = pause ───────────────────────────────────
-- 'revoked' (bouton « Déconnecter ») met l'analyse automatique en pause : une
-- reconnexion ne la relance pas d'elle-même. PAS pour 'error' (jeton expiré) :
-- le dispatcher ignore déjà la boîte, et l'analyse reprend à la reconnexion.
create function private.pause_schedule_on_revoke()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.scan_schedules
     set enabled = false
   where integration_id = new.id
     and enabled;
  return null;
end;
$$;

revoke all on function private.pause_schedule_on_revoke()
  from public, anon, authenticated, service_role;

create trigger integrations_pause_schedule_on_revoke
  after update of status on public.integrations
  for each row
  when (new.status = 'revoked' and old.status is distinct from 'revoked')
  execute function private.pause_schedule_on_revoke();

-- ─── 8. Tâche cron, créée INACTIVE ───────────────────────────────────────
-- Toutes les 15 minutes : une échéance à 7 h part à 7 h 00. Activation à
-- l'étape 7 :
--   select cron.alter_job(job_id := (select jobid from cron.job
--                         where jobname = 'dispatch-gmail-scans'), active := true);
select cron.schedule(
  'dispatch-gmail-scans',
  '*/15 * * * *',
  $$select private.dispatch_due_gmail_scans()$$
);

select cron.alter_job(
  job_id := (select jobid from cron.job where jobname = 'dispatch-gmail-scans'),
  active := false
);

commit;

-- ─── Vérifications après exécution (lecture seule) ───────────────────────
-- select jobname, schedule, active from cron.job order by jobname;
--   → dispatch-gmail-scans active = false ; purge-cron-history et
--     reap-stuck-runs actives.
-- select extname, extnamespace::regnamespace from pg_extension
--  where extname in ('pg_net', 'pgcrypto', 'pg_cron');
-- select key, value from private.app_settings;
