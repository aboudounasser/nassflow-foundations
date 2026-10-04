-- ═══════════════════════════════════════════════════════════════════════════
-- Retour arrière de 20261004150000_sales_agent_step5.sql.
--
-- ORDRE : redéployer d'abord une version de run-gmail-scan qui n'écrit pas ces
-- colonnes (v12, commit 31e53ff), PUIS exécuter ce fichier.
--
-- Effet : les motifs d'arrêt et les arriérés enregistrés sont perdus.
-- ═══════════════════════════════════════════════════════════════════════════

begin;

alter table public.runs
  drop column if exists backlog_remaining,
  drop column if exists stop_reason;

commit;
