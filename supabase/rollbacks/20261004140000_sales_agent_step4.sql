-- ═══════════════════════════════════════════════════════════════════════════
-- Retour arrière de 20261004140000_sales_agent_step4.sql.
--
-- Sans risque tant que l'étape 6 (dispatcher) n'est pas en place : rien ne lit
-- encore scan_schedules. Après l'étape 6, retirer d'abord la tâche cron du
-- dispatcher et la fonction Edge planifiée.
--
-- Effet : les réglages saisis (enabled, frequency, run_hour) et l'état tenu
-- par le système (repère, compteurs) sont perdus.
-- ═══════════════════════════════════════════════════════════════════════════

begin;

drop trigger if exists integrations_create_scan_schedule on public.integrations;
drop function if exists private.create_scan_schedule();

-- Emporte ses politiques, son index et son trigger BEFORE UPDATE.
drop table if exists public.scan_schedules;
drop function if exists private.scan_schedules_before_update();

drop function if exists public.compute_next_scan_at(text, integer, text, timestamptz);

commit;
