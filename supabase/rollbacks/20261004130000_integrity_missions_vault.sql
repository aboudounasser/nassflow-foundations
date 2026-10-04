-- ═══════════════════════════════════════════════════════════════════════════
-- Retour arrière de 20261004130000_integrity_missions_vault.sql.
--
-- Rétablit l'état relevé le 2026-10-04 : trois FK missions en NO ACTION, dont
-- une redondante, et aucun trigger sur integrations. AVANT d'exécuter,
-- comparer avec les définitions d'origine si elles ont été sauvegardées :
-- une option (MATCH, DEFERRABLE) absente ici ne serait pas restaurée.
--
-- Effet : la suppression d'une organisation qui a des missions échoue de
-- nouveau, et les secrets Vault survivent à leur ligne integrations.
-- ═══════════════════════════════════════════════════════════════════════════

begin;

-- ─── 3. Trigger Vault ────────────────────────────────────────────────────
drop trigger if exists integrations_purge_secret on public.integrations;
drop function if exists private.purge_integration_secret();

-- ─── 2. missions → runs ──────────────────────────────────────────────────
alter table public.missions drop constraint missions_run_org_fkey;
alter table public.missions
  add constraint missions_run_org_fkey
  foreign key (run_id, organization_id) references public.runs (id, organization_id);
alter table public.missions
  add constraint missions_run_id_fkey
  foreign key (run_id) references public.runs (id);

-- ─── 1. missions → organizations ─────────────────────────────────────────
alter table public.missions drop constraint missions_organization_id_fkey;
alter table public.missions
  add constraint missions_organization_id_fkey
  foreign key (organization_id) references public.organizations (id);

commit;
