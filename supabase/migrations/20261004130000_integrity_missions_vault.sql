-- ═══════════════════════════════════════════════════════════════════════════
-- Intégrité : suppression d'une organisation, d'un compte, d'une intégration.
--
-- À exécuter À LA MAIN dans le SQL Editor, après validation. Ne jamais lancer
-- `supabase db push` : le reste du schéma n'est pas versionné ici.
-- Retour arrière : supabase/rollbacks/20261004130000_integrity_missions_vault.sql
--
-- Constat (FK relevées le 2026-10-04) : missions_organization_id_fkey est en
-- NO ACTION. Dès qu'une organisation a une mission, sa suppression échoue —
-- depuis /account comme depuis delete-account, qui supprime d'abord les
-- organisations dont l'utilisateur est le seul membre.
--
-- pulses.generated_by n'est PAS modifiée : la base la déclare déjà nullable
-- (ON DELETE SET NULL fonctionne). Seul src/lib/supabase/database.types.ts la
-- type à tort en `string`.
--
-- Prérequis : le schéma `private` existe (migration 20261004120000).
-- ═══════════════════════════════════════════════════════════════════════════

begin;

-- ─── 1. missions → organizations : la mission suit son organisation ──────
alter table public.missions drop constraint missions_organization_id_fkey;
alter table public.missions
  add constraint missions_organization_id_fkey
  foreign key (organization_id) references public.organizations (id)
  on delete cascade;

-- ─── 2. missions → runs : une seule FK, la mission suit son run ──────────
-- missions_run_org_fkey (run_id, organization_id) garantit tout ce que
-- garantit missions_run_id_fkey (run_id), plus la cohérence d'organisation :
-- la seconde est redondante. Le nom de la composite est conservé, l'embed
-- PostgREST `runs!missions_run_org_fkey` (src/services/missions.ts) en dépend.
alter table public.missions drop constraint missions_run_id_fkey;

alter table public.missions drop constraint missions_run_org_fkey;
alter table public.missions
  add constraint missions_run_org_fkey
  foreign key (run_id, organization_id) references public.runs (id, organization_id)
  on delete cascade;

-- ─── 3. Secret Vault supprimé avec sa ligne integrations ─────────────────
-- Sans cela, la suppression d'une organisation (en cascade) laisse ses jetons
-- Google et HubSpot dans le Vault ; ceux de HubSpot n'expirent pas.
-- Ne révoque pas l'autorisation chez Google ou HubSpot (il faudrait un appel
-- HTTP) : NASSFLOW cesse seulement de conserver le jeton.
--
-- SECURITY DEFINER : la suppression arrive en cascade, depuis le rôle de
-- l'appelant (owner via RLS, service_role via delete-account), qui n'a pas le
-- droit d'exécuter vault_delete_secret.
--
-- Une intégration déconnectée garde son vault_secret_id alors que le secret
-- est déjà supprimé (disconnect-gmail) : un échec ici ne doit JAMAIS bloquer
-- la suppression de l'organisation. Il est journalisé, pas propagé.
create function private.purge_integration_secret()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.vault_secret_id is not null then
    begin
      perform public.vault_delete_secret(old.vault_secret_id);
    exception when others then
      raise warning 'purge_integration_secret : secret % non supprimé (%)',
        old.vault_secret_id, sqlerrm;
    end;
  end if;
  return old;
end;
$$;

revoke all on function private.purge_integration_secret()
  from public, anon, authenticated, service_role;

create trigger integrations_purge_secret
  after delete on public.integrations
  for each row execute function private.purge_integration_secret();

commit;

-- ─── Vérifications après exécution (lecture seule) ───────────────────────
-- select conname,
--        case confdeltype when 'a' then 'NO ACTION' when 'c' then 'CASCADE' end as on_delete,
--        pg_get_constraintdef(oid)
--   from pg_constraint
--  where conrelid = 'public.missions'::regclass and contype = 'f'
--  order by conname;
--   → missions_organization_id_fkey CASCADE, missions_run_org_fkey CASCADE,
--     plus aucune missions_run_id_fkey.
-- select tgname, pg_get_triggerdef(oid) from pg_trigger
--  where tgrelid = 'public.integrations'::regclass and not tgisinternal;
