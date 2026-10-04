-- ═══════════════════════════════════════════════════════════════════════════
-- Retour arrière de 20261004160000_sales_agent_step6.sql.
--
-- ORDRE : désactiver d'abord la tâche cron si elle a été activée (elle est
-- supprimée ci-dessous de toute façon), puis supprimer la fonction Edge
-- scheduled-gmail-scan si elle a été déployée :
--   supabase functions delete scheduled-gmail-scan --project-ref pgxaqwzikqgovvucvwsk
-- (sans elle, les jetons déjà émis ne peuvent plus servir à rien).
--
-- Effets : le journal des déclenchements est perdu ; le nettoyeur revient à
-- sa version de l'étape 3 ; pg_net est retiré (aucun autre usage à ce jour —
-- vérifier avant : select count(*) from net.http_request_queue;).
-- ═══════════════════════════════════════════════════════════════════════════

begin;

-- ─── 8. Tâche cron ───────────────────────────────────────────────────────
select cron.unschedule(jobid) from cron.job where jobname = 'dispatch-gmail-scans';

-- ─── 7. Trigger de pause à la déconnexion ────────────────────────────────
drop trigger if exists integrations_pause_schedule_on_revoke on public.integrations;
drop function if exists private.pause_schedule_on_revoke();

-- ─── 6. Nettoyeur : version de l'étape 3 ─────────────────────────────────
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

-- ─── 5, 4, 3, 2. Dispatcher, échange du jeton, journal, réglages ─────────
drop function if exists private.dispatch_due_gmail_scans();
drop function if exists public.attach_scan_dispatch_run(uuid, uuid);
drop function if exists public.claim_scan_dispatch(text);
drop table if exists private.scan_dispatches;
drop table if exists private.app_settings;

-- ─── 1. pg_net ───────────────────────────────────────────────────────────
drop extension if exists pg_net;

commit;
