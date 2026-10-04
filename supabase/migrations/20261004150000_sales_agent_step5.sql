-- ═══════════════════════════════════════════════════════════════════════════
-- Sales Agent autonome — étape 5 : arrêt sur budget et arriéré, sur le run.
--
-- À exécuter À LA MAIN dans le SQL Editor, après validation. Ne jamais lancer
-- `supabase db push` : le reste du schéma n'est pas versionné ici.
-- Retour arrière : supabase/rollbacks/20261004150000_sales_agent_step5.sql
--
-- ORDRE : cette migration AVANT le déploiement de run-gmail-scan qui écrit
-- ces colonnes. Dans l'autre ordre, la mise à jour finale du run échouerait
-- (colonne inconnue) et le run resterait 'running' jusqu'au nettoyeur.
--
-- Lisibles par owner/admin sans autre grant : authenticated a SELECT au
-- niveau de la table runs (relevé de l'étape 0). Écrites par service_role,
-- qui écrit déjà les colonnes ajoutées à l'étape 3.
-- ═══════════════════════════════════════════════════════════════════════════

begin;

alter table public.runs
  -- NULL : l'analyse est allée au bout. 'budget' : arrêtée avant, budget IA
  -- quotidien de la boîte atteint. D'autres motifs viendront élargir la liste.
  add column stop_reason text
    constraint runs_stop_reason_check check (stop_reason in ('budget')),
  -- Messages de la fenêtre restant à traiter à la fin du run : au-delà des 50,
  -- non analysés faute de budget, ou en échec réessayable. NULL : jamais
  -- mesuré (runs antérieurs, run en échec ou interrompu).
  add column backlog_remaining integer
    constraint runs_backlog_remaining_check check (backlog_remaining >= 0);

commit;

-- ─── Vérification après exécution (lecture seule) ────────────────────────
-- select column_name, data_type, is_nullable
--   from information_schema.columns
--  where table_schema = 'public' and table_name = 'runs'
--    and column_name in ('stop_reason', 'backlog_remaining');
