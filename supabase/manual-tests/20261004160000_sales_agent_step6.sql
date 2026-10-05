-- ═══════════════════════════════════════════════════════════════════════════
-- Tests de la migration 20261004160000_sales_agent_step6.sql.
--
-- À lancer dans le SQL Editor APRÈS la migration. Tout se passe dans une
-- transaction ANNULÉE : aucune donnée n'est conservée, « nassflow » n'est
-- jamais touchée (organisation et intégrations fictives), et AUCUNE requête
-- HTTP ne part — pg_net n'envoie qu'après le COMMIT, qui n'a jamais lieu.
--
-- Résultat attendu : une seule table, toutes les lignes avec ok = true.
-- En cas d'erreur, lancer `rollback;` seul.
-- ═══════════════════════════════════════════════════════════════════════════

begin;

set local timezone = 'UTC';

create temp table step6_results (
  ordre serial,
  cas text not null,
  ok boolean not null,
  detail text
) on commit drop;

-- ─── 0. Prérequis ────────────────────────────────────────────────────────
insert into step6_results (cas, ok, detail)
select '0 pgcrypto dans le schéma extensions (digest, gen_random_bytes)',
       to_regprocedure('extensions.digest(text, text)') is not null
   and to_regprocedure('extensions.gen_random_bytes(integer)') is not null,
       null;

insert into step6_results (cas, ok, detail)
select '0 URL de base des fonctions renseignée', value like 'https://%/functions/v1', value
  from private.app_settings where key = 'functions_base_url';

-- ─── A à D. Données fictives ─────────────────────────────────────────────
do $$
declare
  org_id uuid;
  i_due uuid; i_future uuid; i_paused uuid; i_failing uuid; i_error uuid;
  n integer;
  s public.scan_schedules;
  claimed record;
  d private.scan_dispatches;
  run_sched uuid; run_manual uuid; run_done uuid;
begin
  insert into public.organizations (name) values ('Test étape 6 — annulé') returning id into org_id;

  -- vault_secret_id est NOT NULL : identifiants fictifs.
  insert into public.integrations (organization_id, provider, account_email, status, vault_secret_id)
  values (org_id, 'gmail', 'due@example.invalid', 'active', gen_random_uuid()) returning id into i_due;
  insert into public.integrations (organization_id, provider, account_email, status, vault_secret_id)
  values (org_id, 'gmail', 'future@example.invalid', 'active', gen_random_uuid()) returning id into i_future;
  insert into public.integrations (organization_id, provider, account_email, status, vault_secret_id)
  values (org_id, 'gmail', 'paused@example.invalid', 'active', gen_random_uuid()) returning id into i_paused;
  insert into public.integrations (organization_id, provider, account_email, status, vault_secret_id)
  values (org_id, 'gmail', 'failing@example.invalid', 'active', gen_random_uuid()) returning id into i_failing;
  insert into public.integrations (organization_id, provider, account_email, status, vault_secret_id)
  values (org_id, 'gmail', 'error@example.invalid', 'active', gen_random_uuid()) returning id into i_error;

  -- Activation (trigger : intégration active requise), puis état forcé.
  update public.scan_schedules set enabled = true
   where integration_id in (i_due, i_future, i_failing, i_error);
  update public.scan_schedules set next_run_at = now() - interval '1 minute'
   where integration_id in (i_due, i_failing, i_error);
  update public.scan_schedules set next_run_at = now() + interval '1 day'
   where integration_id = i_future;
  update public.scan_schedules set consecutive_failures = 3 where integration_id = i_failing;
  update public.integrations set status = 'error' where id = i_error;

  -- ─── A. Dispatcher ───
  perform private.dispatch_due_gmail_scans();

  select count(*) into n from private.scan_dispatches where integration_id = i_due;
  select * into s from public.scan_schedules where integration_id = i_due;
  select * into d from private.scan_dispatches where integration_id = i_due;
  insert into pg_temp.step6_results (cas, ok, detail) values (
    'A1 boîte due → un déclenchement, requête pg_net en file, échéance avancée',
    n = 1 and d.net_request_id is not null and s.next_run_at > now()
      and d.expires_at > now() and d.claimed_at is null and length(d.token_hash) = 32,
    format('dispatches=%s request=%s next=%s', n, d.net_request_id, s.next_run_at));

  select count(*) into n from private.scan_dispatches
   where integration_id in (i_future, i_paused, i_failing, i_error);
  insert into pg_temp.step6_results (cas, ok, detail) values (
    'A2 ignorées : échéance future, pause, 3 échecs, intégration en erreur', n = 0, n::text);

  perform private.dispatch_due_gmail_scans();
  select count(*) into n from private.scan_dispatches where integration_id = i_due;
  insert into pg_temp.step6_results (cas, ok, detail) values (
    'A3 second passage immédiat → aucun nouveau déclenchement', n = 1, n::text);

  -- A4 : déclenchement expiré sans réclamation → un échec, compté une fois.
  insert into private.scan_dispatches (integration_id, organization_id, token_hash, expires_at)
  values (i_paused, org_id, extensions.digest('jeton-jamais-reclame', 'sha256'), now() - interval '1 second');

  perform private.dispatch_due_gmail_scans();
  select * into s from public.scan_schedules where integration_id = i_paused;
  select * into d from private.scan_dispatches
   where token_hash = extensions.digest('jeton-jamais-reclame', 'sha256');
  insert into pg_temp.step6_results (cas, ok, detail) values (
    'A4 déclenchement expiré non réclamé → un échec, last_error renseigné, marqué missed_at',
    s.consecutive_failures = 1 and d.missed_at is not null
      and s.last_error like 'L''analyse automatique n''a pas pu démarrer%',
    format('failures=%s missed=%s', s.consecutive_failures, d.missed_at));

  perform private.dispatch_due_gmail_scans();
  select * into s from public.scan_schedules where integration_id = i_paused;
  insert into pg_temp.step6_results (cas, ok, detail) values (
    'A5 passage suivant → le même déclenchement n''est pas recompté', s.consecutive_failures = 1,
    format('failures=%s', s.consecutive_failures));

  select count(*) into n from public.claim_scan_dispatch('jeton-jamais-reclame');
  insert into pg_temp.step6_results (cas, ok, detail) values (
    'A6 déclenchement compté manqué → ne peut plus être réclamé', n = 0, n::text);

  -- ─── B. Jeton à usage unique ───
  insert into private.scan_dispatches (integration_id, organization_id, token_hash, expires_at)
  values (i_future, org_id, extensions.digest('jeton-de-test-valide', 'sha256'), now() + interval '10 minutes'),
         (i_future, org_id, extensions.digest('jeton-de-test-expire', 'sha256'), now() - interval '1 second');

  select * into claimed from public.claim_scan_dispatch('jeton-de-test-valide');
  insert into pg_temp.step6_results (cas, ok, detail) values (
    'B1 jeton valide → rend la boîte et l''organisation',
    claimed.dispatch_integration_id = i_future and claimed.dispatch_organization_id = org_id,
    format('%s', claimed));

  select count(*) into n from public.claim_scan_dispatch('jeton-de-test-valide');
  insert into pg_temp.step6_results (cas, ok, detail) values (
    'B2 même jeton une seconde fois → refusé (usage unique)', n = 0, n::text);

  select count(*) into n from public.claim_scan_dispatch('jeton-de-test-expire');
  insert into pg_temp.step6_results (cas, ok, detail) values (
    'B3 jeton expiré → refusé', n = 0, n::text);

  select count(*) into n from public.claim_scan_dispatch('jeton-inconnu');
  insert into pg_temp.step6_results (cas, ok, detail) values (
    'B4 jeton inconnu → refusé', n = 0, n::text);

  insert into public.runs (organization_id, integration_id, status, trigger_source)
  values (org_id, i_future, 'succeeded', 'schedule') returning id into run_done;
  perform public.attach_scan_dispatch_run(claimed.dispatch_id, run_done);
  perform public.attach_scan_dispatch_run(claimed.dispatch_id, gen_random_uuid());
  select * into d from private.scan_dispatches where id = claimed.dispatch_id;
  insert into pg_temp.step6_results (cas, ok, detail) values (
    'B5 run rattaché au déclenchement, sans écrasement ultérieur', d.run_id = run_done, d.run_id::text);

  -- ─── C. Nettoyeur ───
  insert into public.runs (organization_id, integration_id, status, trigger_source, started_at)
  values (org_id, i_due, 'running', 'schedule', now() - interval '20 minutes') returning id into run_sched;
  insert into public.runs (organization_id, integration_id, status, trigger_source, started_at)
  values (org_id, i_future, 'running', 'manual', now() - interval '20 minutes') returning id into run_manual;

  perform private.reap_stuck_runs();

  select * into s from public.scan_schedules where integration_id = i_due;
  insert into pg_temp.step6_results (cas, ok, detail) values (
    'C1 analyse planifiée bloquée → échec compté sur la boîte',
    (select status from public.runs where id = run_sched) = 'failed'
      and s.consecutive_failures = 1 and s.last_scheduled_run_id = run_sched
      and s.last_error like 'Analyse interrompue%',
    format('failures=%s last_run=%s', s.consecutive_failures, s.last_scheduled_run_id));

  select * into s from public.scan_schedules where integration_id = i_future;
  insert into pg_temp.step6_results (cas, ok, detail) values (
    'C2 analyse manuelle bloquée → échouée, mais compteur de la boîte intact',
    (select status from public.runs where id = run_manual) = 'failed' and s.consecutive_failures = 0,
    format('failures=%s', s.consecutive_failures));

  -- ─── D. Déconnexion volontaire = pause ; jeton expiré ≠ pause ───
  update public.integrations set status = 'revoked' where id = i_due;
  select * into s from public.scan_schedules where integration_id = i_due;
  insert into pg_temp.step6_results (cas, ok, detail) values (
    'D1 intégration révoquée → analyse automatique en pause', not s.enabled and s.next_run_at is null,
    format('enabled=%s next=%s', s.enabled, s.next_run_at));

  update public.integrations set status = 'error' where id = i_future;
  select * into s from public.scan_schedules where integration_id = i_future;
  insert into pg_temp.step6_results (cas, ok, detail) values (
    'D2 intégration en erreur (jeton expiré) → reste activée', s.enabled, format('enabled=%s', s.enabled));
end;
$$;

-- ─── E. Privilèges ───────────────────────────────────────────────────────
insert into step6_results (cas, ok, detail)
select 'E1 claim et attach : service_role seulement',
       has_function_privilege('service_role', 'public.claim_scan_dispatch(text)', 'EXECUTE')
   and has_function_privilege('service_role', 'public.attach_scan_dispatch_run(uuid, uuid)', 'EXECUTE')
   and not has_function_privilege('authenticated', 'public.claim_scan_dispatch(text)', 'EXECUTE')
   and not has_function_privilege('anon', 'public.claim_scan_dispatch(text)', 'EXECUTE')
   and not has_function_privilege('authenticated', 'public.attach_scan_dispatch_run(uuid, uuid)', 'EXECUTE')
   and not has_function_privilege('anon', 'public.attach_scan_dispatch_run(uuid, uuid)', 'EXECUTE'),
       null;

insert into step6_results (cas, ok, detail)
select 'E2 dispatcher, nettoyeur, trigger : non exécutables par ' || r,
       not has_function_privilege(r, 'private.dispatch_due_gmail_scans()', 'EXECUTE')
   and not has_function_privilege(r, 'private.reap_stuck_runs()', 'EXECUTE')
   and not has_function_privilege(r, 'private.pause_schedule_on_revoke()', 'EXECUTE'),
       null
  from unnest(array['anon', 'authenticated', 'service_role']) as r;

insert into step6_results (cas, ok, detail)
select 'E3 journal et réglages privés : aucun accès pour ' || r,
       not has_table_privilege(r, 'private.scan_dispatches', 'SELECT')
   and not has_table_privilege(r, 'private.app_settings', 'SELECT'),
       null
  from unnest(array['anon', 'authenticated', 'service_role']) as r;

-- ─── F. Tâche cron ───────────────────────────────────────────────────────
insert into step6_results (cas, ok, detail)
select 'F1 tâche dispatch-gmail-scans créée INACTIVE, toutes les 15 min',
       count(*) = 1 and bool_and(not active) and bool_and(schedule = '*/15 * * * *'),
       string_agg(format('active=%s schedule=%s', active, schedule), ', ')
  from cron.job where jobname = 'dispatch-gmail-scans';

select ordre, cas, ok, detail from step6_results order by ordre;

rollback;
