-- ═══════════════════════════════════════════════════════════════════════════
-- Retour arrière de 20261004120000_sales_agent_step3.sql.
--
-- ORDRE IMPÉRATIF : redéployer d'abord une version de run-gmail-scan qui
-- n'écrit pas les nouvelles colonnes (v11, commit b7e7881), PUIS exécuter ce
-- fichier dans le SQL Editor. Dans l'autre ordre, chaque analyse échouerait
-- entre les deux opérations.
--
-- Effets : les valeurs écrites dans trigger_source, ai_cost_millicents et
-- emails_failed sont perdues ; les runs eux-mêmes ne sont pas touchés.
-- ═══════════════════════════════════════════════════════════════════════════

begin;

-- ─── 1. pg_cron ──────────────────────────────────────────────────────────
-- Supprimer l'extension supprime TOUTES les tâches planifiées. À l'étape 3,
-- seules les deux tâches ci-dessous existent : vérifier avant d'exécuter
--   select jobname from cron.job;
-- Si d'autres tâches sont apparues depuis (étape 6), ne retirer que les
-- nôtres et conserver l'extension : commenter le DROP EXTENSION.
select cron.unschedule(jobid)
  from cron.job
 where jobname in ('reap-stuck-runs', 'purge-cron-history');

drop extension if exists pg_cron;

-- ─── 2. Nettoyeur et schéma privé ────────────────────────────────────────
drop function if exists private.reap_stuck_runs();
-- RESTRICT (défaut) : échoue si le schéma contient encore autre chose, ce qui
-- est voulu — rien d'autre que cette migration ne doit l'avoir rempli.
drop schema if exists private;

-- ─── 3. runs ─────────────────────────────────────────────────────────────
drop index if exists public.runs_one_running_per_integration;

alter table public.runs drop constraint if exists runs_schedule_has_no_user;

alter table public.runs
  drop column if exists emails_failed,
  drop column if exists ai_cost_millicents,
  drop column if exists trigger_source;

commit;
