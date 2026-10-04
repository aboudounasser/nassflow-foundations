-- ═══════════════════════════════════════════════════════════════════════════
-- Sales Agent autonome — étape 3 : traçabilité des runs, verrou, nettoyeur.
--
-- À exécuter À LA MAIN dans le SQL Editor, après validation. Ne jamais lancer
-- `supabase db push` : le reste du schéma n'est pas versionné ici.
-- Retour arrière : supabase/rollbacks/20261004120000_sales_agent_step3.sql
--
-- Prérequis vérifiés à l'étape 0 (2026-10-04) :
--   - aucun run en 'running' (sinon l'index unique échoue) ;
--   - pg_cron 1.6.4 disponible, non installé ; pg_net NON activé ici (étape 6) ;
--   - schéma `private` inexistant : créé ici ;
--   - `authenticated` a SELECT au niveau table sur `runs` : les nouvelles
--     colonnes sont lisibles par owner/admin via la politique existante.
--
-- Compatible avec run-gmail-scan v11 (qui n'écrit pas encore ces colonnes) :
-- la migration précède le déploiement de la fonction qui les renseigne.
-- ═══════════════════════════════════════════════════════════════════════════

begin;

-- ─── 1. runs : origine, coût réel, messages en échec ─────────────────────
-- `ai_cost_millicents` et `emails_failed` restent NULL sur les runs existants :
-- ces valeurs n'ont jamais été mesurées, aucune n'est inventée.
alter table public.runs
  add column trigger_source text not null default 'manual'
    constraint runs_trigger_source_check check (trigger_source in ('manual', 'schedule')),
  add column ai_cost_millicents integer
    constraint runs_ai_cost_millicents_check check (ai_cost_millicents >= 0),
  add column emails_failed integer
    constraint runs_emails_failed_check check (emails_failed >= 0);

-- Un run planifié n'a pas d'auteur humain. À sens unique : un run manuel perd
-- son auteur si le compte est supprimé (triggered_by ON DELETE SET NULL).
alter table public.runs
  add constraint runs_schedule_has_no_user
    check (trigger_source = 'manual' or triggered_by is null);

-- ─── 2. Une seule analyse en cours par boîte ─────────────────────────────
-- Barrière commune aux analyses manuelles et planifiées : le second INSERT
-- échoue en 23505, que la fonction traduit en 409.
create unique index runs_one_running_per_integration
  on public.runs (integration_id)
  where status = 'running';

-- ─── 3. Schéma privé, jamais exposé par l'API ────────────────────────────
create schema private;
revoke all on schema private from public, anon, authenticated, service_role;

-- ─── 4. Nettoyeur des runs bloqués ───────────────────────────────────────
-- Indispensable avec l'index ci-dessus : un run tué en cours d'exécution
-- bloquerait la boîte à vie. 15 minutes, largement au-delà de la durée
-- maximale d'une fonction Edge.
-- SECURITY INVOKER : seul pg_cron l'appelle, en tant que postgres.
create function private.reap_stuck_runs()
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
    returning id
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
  )
  select count(*) into reaped from stuck;
  return reaped;
end;
$$;

revoke all on function private.reap_stuck_runs() from public, anon, authenticated, service_role;

-- ─── 5. pg_cron, méthode documentée par Supabase ─────────────────────────
-- https://supabase.com/docs/guides/cron/install
create extension pg_cron with schema pg_catalog;

grant usage on schema cron to postgres;
grant all privileges on all tables in schema cron to postgres;

-- ─── 6. Tâches planifiées ────────────────────────────────────────────────
select cron.schedule(
  'reap-stuck-runs',
  '*/10 * * * *',
  $$select private.reap_stuck_runs()$$
);

-- cron.job_run_details n'est jamais purgé automatiquement (documentation
-- Supabase) : 144 lignes par jour pour le seul nettoyeur.
select cron.schedule(
  'purge-cron-history',
  '30 3 * * *',
  $$delete from cron.job_run_details where end_time < now() - interval '7 days'$$
);

commit;

-- ─── Vérifications après exécution (lecture seule) ───────────────────────
-- select jobname, schedule, command, active from cron.job order by jobname;
-- select private.reap_stuck_runs();   -- doit renvoyer 0
-- select column_name, data_type, is_nullable, column_default
--   from information_schema.columns
--  where table_schema = 'public' and table_name = 'runs'
--    and column_name in ('trigger_source', 'ai_cost_millicents', 'emails_failed');
-- select indexname from pg_indexes where indexname = 'runs_one_running_per_integration';
