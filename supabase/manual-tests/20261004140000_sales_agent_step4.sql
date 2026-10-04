-- ═══════════════════════════════════════════════════════════════════════════
-- Tests de la migration 20261004140000_sales_agent_step4.sql.
--
-- À lancer dans le SQL Editor APRÈS la migration. Tout se passe dans une
-- transaction ANNULÉE : aucune donnée n'est conservée, « nassflow » n'est
-- jamais touchée (organisation et intégrations fictives).
--
-- Résultat attendu : une seule table, toutes les lignes avec ok = true.
-- En cas d'erreur, lancer `rollback;` seul.
-- ═══════════════════════════════════════════════════════════════════════════

begin;

-- Affichage des instants en UTC : sans ambiguïté, quel que soit le réglage
-- de la session.
set local timezone = 'UTC';

create temp table step4_results (
  ordre serial,
  cas text not null,
  ok boolean not null,
  detail text
) on commit drop;

-- ─── A. compute_next_scan_at à dates fixes ───────────────────────────────
-- Paris : UTC+2 jusqu'au 25 octobre 2026 à 3 h, UTC+1 ensuite ;
-- UTC+1 jusqu'au 28 mars 2027 à 2 h, UTC+2 ensuite.
insert into step4_results (cas, ok, detail)
select cas,
       obtenu is not distinct from attendu,
       'obtenu ' || coalesce(obtenu::text, 'NULL') || ' / attendu ' || attendu::text
  from (values
    ('A1 weekdays : vendredi 8 h → lundi 7 h',
      public.compute_next_scan_at('weekdays', 7, 'Europe/Paris', '2026-10-09 08:00+02'),
      '2026-10-12 07:00+02'::timestamptz),
    ('A2 weekdays : vendredi 6 h 59 → le jour même à 7 h',
      public.compute_next_scan_at('weekdays', 7, 'Europe/Paris', '2026-10-09 06:59+02'),
      '2026-10-09 07:00+02'::timestamptz),
    ('A3 weekdays : vendredi 7 h pile → lundi (strictement après)',
      public.compute_next_scan_at('weekdays', 7, 'Europe/Paris', '2026-10-09 07:00+02'),
      '2026-10-12 07:00+02'::timestamptz),
    ('A4 weekdays : samedi → lundi',
      public.compute_next_scan_at('weekdays', 7, 'Europe/Paris', '2026-10-10 12:00+02'),
      '2026-10-12 07:00+02'::timestamptz),
    ('A5 heure d''hiver : vendredi 23 oct. 8 h → lundi 26 oct. 7 h (06:00 UTC)',
      public.compute_next_scan_at('weekdays', 7, 'Europe/Paris', '2026-10-23 08:00+02'),
      '2026-10-26 06:00+00'::timestamptz),
    ('A6 heure d''hiver : daily samedi 24 oct. 8 h → dimanche 25 oct. 7 h (06:00 UTC)',
      public.compute_next_scan_at('daily', 7, 'Europe/Paris', '2026-10-24 08:00+02'),
      '2026-10-25 06:00+00'::timestamptz),
    ('A7 heure d''hiver : daily dimanche 25 oct. 2 h 30 (heure doublée) → 7 h',
      public.compute_next_scan_at('daily', 7, 'Europe/Paris', '2026-10-25 02:30+01'),
      '2026-10-25 07:00+01'::timestamptz),
    ('A8 heure d''été : daily samedi 27 mars 2027 8 h → dimanche 28 mars 7 h (05:00 UTC)',
      public.compute_next_scan_at('daily', 7, 'Europe/Paris', '2027-03-27 08:00+01'),
      '2027-03-28 05:00+00'::timestamptz),
    ('A9 daily : samedi 8 h → dimanche 7 h',
      public.compute_next_scan_at('daily', 7, 'Europe/Paris', '2026-10-10 08:00+02'),
      '2026-10-11 07:00+02'::timestamptz),
    ('A10 daily : 5 h → le jour même à 7 h',
      public.compute_next_scan_at('daily', 7, 'Europe/Paris', '2026-10-10 05:00+02'),
      '2026-10-10 07:00+02'::timestamptz),
    ('A11 twice_daily : lundi 8 h → lundi 13 h',
      public.compute_next_scan_at('twice_daily', 7, 'Europe/Paris', '2026-10-05 08:00+02'),
      '2026-10-05 13:00+02'::timestamptz),
    ('A12 twice_daily : lundi 13 h pile → mardi 7 h',
      public.compute_next_scan_at('twice_daily', 7, 'Europe/Paris', '2026-10-05 13:00+02'),
      '2026-10-06 07:00+02'::timestamptz),
    ('A13 twice_daily : vendredi 14 h → lundi 7 h',
      public.compute_next_scan_at('twice_daily', 7, 'Europe/Paris', '2026-10-09 14:00+02'),
      '2026-10-12 07:00+02'::timestamptz),
    ('A14 twice_daily, run_hour 16 : lundi 17 h → lundi 22 h',
      public.compute_next_scan_at('twice_daily', 16, 'Europe/Paris', '2026-10-05 17:00+02'),
      '2026-10-05 22:00+02'::timestamptz),
    ('A15 autre fuseau : weekdays 9 h New York, lundi 8 h → lundi 9 h',
      public.compute_next_scan_at('weekdays', 9, 'America/New_York', '2026-10-05 08:00-04'),
      '2026-10-05 09:00-04'::timestamptz)
  ) as t(cas, obtenu, attendu);

-- A16 : 7 h → 7 h le lendemain à travers le changement d'heure = 25 h, pas 24.
insert into step4_results (cas, ok, detail)
select 'A16 samedi 7 h → dimanche 7 h, 25 oct. : 25 h d''écart',
       ecart = interval '25 hours',
       'écart ' || ecart::text
  from (select public.compute_next_scan_at('daily', 7, 'Europe/Paris', '2026-10-24 07:00+02')
               - '2026-10-24 07:00+02'::timestamptz as ecart) as t;

-- A17 : fréquence inconnue refusée.
do $$
begin
  perform public.compute_next_scan_at('hourly', 7, 'Europe/Paris', now());
  insert into pg_temp.step4_results (cas, ok, detail)
  values ('A17 fréquence inconnue refusée', false, 'aucune erreur levée');
exception when others then
  insert into pg_temp.step4_results (cas, ok, detail)
  values ('A17 fréquence inconnue refusée', true, sqlerrm);
end;
$$;

-- ─── B. Triggers sur données fictives ────────────────────────────────────
do $$
declare
  org_id uuid;
  gmail_id uuid;
  hubspot_id uuid;
  s public.scan_schedules;
  before_update timestamptz;
begin
  insert into public.organizations (name) values ('Test étape 4 — annulé')
  returning id into org_id;

  -- vault_secret_id est NOT NULL en base : un identifiant fictif suffit, aucun
  -- secret n'est lu, et le trigger de purge ignore un secret introuvable.
  insert into public.integrations (organization_id, provider, account_email, status, vault_secret_id)
  values (org_id, 'gmail', 'test-etape4@example.invalid', 'active', gen_random_uuid())
  returning id into gmail_id;

  insert into public.integrations (organization_id, provider, external_account_id, status, vault_secret_id)
  values (org_id, 'hubspot', 'test-etape4', 'active', gen_random_uuid())
  returning id into hubspot_id;

  -- B1 : ligne créée pour Gmail, désactivée, sans échéance, budget par défaut.
  select * into s from public.scan_schedules where integration_id = gmail_id;
  insert into pg_temp.step4_results (cas, ok, detail) values (
    'B1 intégration Gmail → réglages créés, désactivés',
    s.integration_id is not null and s.organization_id = org_id and not s.enabled
      and s.next_run_at is null and s.frequency = 'weekdays' and s.run_hour = 7
      and s.daily_ai_budget_millicents = 10000 and s.timezone = 'Europe/Paris',
    format('enabled=%s next=%s budget=%s', s.enabled, s.next_run_at, s.daily_ai_budget_millicents));

  -- B2 : rien pour HubSpot.
  insert into pg_temp.step4_results (cas, ok, detail)
  select 'B2 intégration HubSpot → aucun réglage', count(*) = 0, count(*)::text
    from public.scan_schedules where integration_id = hubspot_id;

  -- B3 : activation → échéance calculée.
  update public.scan_schedules set enabled = true where integration_id = gmail_id;
  select * into s from public.scan_schedules where integration_id = gmail_id;
  insert into pg_temp.step4_results (cas, ok, detail) values (
    'B3 activation → next_run_at = compute_next_scan_at(…, now())',
    s.next_run_at = public.compute_next_scan_at('weekdays', 7, 'Europe/Paris', now()),
    format('next=%s', s.next_run_at));

  -- B4 : mise à jour système (compteurs) → réglages et traçabilité intacts.
  before_update := s.updated_at;
  update public.scan_schedules
     set consecutive_failures = 2, last_error = 'test', last_error_at = now(),
         next_run_at = '2030-01-01 07:00+01'
   where integration_id = gmail_id;
  select * into s from public.scan_schedules where integration_id = gmail_id;
  insert into pg_temp.step4_results (cas, ok, detail) values (
    'B4 mise à jour système → échéance posée conservée, updated_at inchangé',
    s.next_run_at = '2030-01-01 07:00+01'::timestamptz and s.updated_at = before_update
      and s.consecutive_failures = 2,
    format('next=%s failures=%s', s.next_run_at, s.consecutive_failures));

  -- B5 : changement de fréquence → échéance recalculée.
  update public.scan_schedules set frequency = 'daily' where integration_id = gmail_id;
  select * into s from public.scan_schedules where integration_id = gmail_id;
  insert into pg_temp.step4_results (cas, ok, detail) values (
    'B5 fréquence modifiée → échéance recalculée',
    s.next_run_at = public.compute_next_scan_at('daily', 7, 'Europe/Paris', now()),
    format('next=%s', s.next_run_at));

  -- B6 : désactivation → plus d'échéance ; compteurs conservés.
  update public.scan_schedules set enabled = false where integration_id = gmail_id;
  select * into s from public.scan_schedules where integration_id = gmail_id;
  insert into pg_temp.step4_results (cas, ok, detail) values (
    'B6 pause → next_run_at NULL, échecs conservés',
    s.next_run_at is null and s.consecutive_failures = 2,
    format('next=%s failures=%s', s.next_run_at, s.consecutive_failures));

  -- B7 : réactivation → échecs remis à zéro.
  update public.scan_schedules set enabled = true where integration_id = gmail_id;
  select * into s from public.scan_schedules where integration_id = gmail_id;
  insert into pg_temp.step4_results (cas, ok, detail) values (
    'B7 réactivation → échecs et dernière erreur remis à zéro',
    s.consecutive_failures = 0 and s.last_error is null and s.last_error_at is null
      and s.next_run_at is not null,
    format('failures=%s error=%s', s.consecutive_failures, s.last_error));

  -- B8 : activation refusée si Gmail n'est plus actif.
  update public.scan_schedules set enabled = false where integration_id = gmail_id;
  update public.integrations set status = 'error' where id = gmail_id;
  begin
    update public.scan_schedules set enabled = true where integration_id = gmail_id;
    insert into pg_temp.step4_results (cas, ok, detail)
    values ('B8 activation refusée si Gmail en erreur', false, 'aucune erreur levée');
  exception when others then
    insert into pg_temp.step4_results (cas, ok, detail)
    values ('B8 activation refusée si Gmail en erreur',
            sqlerrm = 'Reconnectez Gmail avant d''activer l''analyse automatique.', sqlerrm);
  end;

  -- B9 : suppression de l'organisation → réglages supprimés en cascade.
  delete from public.organizations where id = org_id;
  insert into pg_temp.step4_results (cas, ok, detail)
  select 'B9 organisation supprimée → réglages supprimés', count(*) = 0, count(*)::text
    from public.scan_schedules where organization_id = org_id;
end;
$$;

-- ─── C. Privilèges ───────────────────────────────────────────────────────
insert into step4_results (cas, ok, detail)
select 'C1 authenticated : UPDATE limité à enabled, frequency, run_hour',
       array_agg(column_name::text order by column_name)
         = array['enabled', 'frequency', 'run_hour'],
       array_agg(column_name::text order by column_name)::text
  from information_schema.columns
 where table_schema = 'public' and table_name = 'scan_schedules'
   and has_column_privilege('authenticated', 'public.scan_schedules', column_name, 'UPDATE');

insert into step4_results (cas, ok, detail)
select 'C2 aucun INSERT ni DELETE pour authenticated et service_role',
       not has_table_privilege('authenticated', 'public.scan_schedules', 'INSERT')
   and not has_table_privilege('authenticated', 'public.scan_schedules', 'DELETE')
   and not has_table_privilege('service_role', 'public.scan_schedules', 'INSERT')
   and not has_table_privilege('service_role', 'public.scan_schedules', 'DELETE'),
       null;

insert into step4_results (cas, ok, detail)
select 'C3 anon : aucun accès',
       not has_table_privilege('anon', 'public.scan_schedules', 'SELECT'),
       null;

insert into step4_results (cas, ok, detail)
select 'C4 compute_next_scan_at non exécutable depuis l''API',
       not has_function_privilege('authenticated', 'public.compute_next_scan_at(text, integer, text, timestamptz)', 'EXECUTE')
   and not has_function_privilege('anon', 'public.compute_next_scan_at(text, integer, text, timestamptz)', 'EXECUTE'),
       null;

insert into step4_results (cas, ok, detail)
select 'C5 RLS activée', relrowsecurity, null
  from pg_class where oid = 'public.scan_schedules'::regclass;

select ordre, cas, ok, detail from step4_results order by ordre;

rollback;
