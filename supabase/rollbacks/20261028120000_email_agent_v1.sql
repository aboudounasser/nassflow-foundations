-- ═══════════════════════════════════════════════════════════════════════════
-- Retour arrière de 20261028120000_email_agent_v1.sql.
--
-- D'ABORD redéployer run-gmail-scan et scheduled-gmail-scan dans leur version
-- antérieure (code de 123ee68 : v13 et v1), et retirer draft-email-reply :
-- la v14 écrit dans inbox_messages, et l'analyse planifiée (cron actif)
-- échouerait à chaque passage une fois les tables supprimées.
--
-- Effet : le tri, les statuts et les brouillons sont perdus. Les prospects
-- (run_results) et seen_messages ne sont pas touchés.
-- ═══════════════════════════════════════════════════════════════════════════

begin;

select cron.unschedule('purge-email-agent-data')
 where exists (select 1 from cron.job where jobname = 'purge-email-agent-data');

drop function if exists private.purge_email_agent_data();

drop table if exists public.email_reply_drafts;
-- Emporte ses politiques, ses index et son trigger.
drop table if exists public.inbox_messages;
drop function if exists private.inbox_messages_before_update();

commit;
