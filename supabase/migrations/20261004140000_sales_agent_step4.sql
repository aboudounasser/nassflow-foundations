-- ═══════════════════════════════════════════════════════════════════════════
-- Sales Agent autonome — étape 4 : réglages d'analyse automatique par boîte.
--
-- À exécuter À LA MAIN dans le SQL Editor, après validation. Ne jamais lancer
-- `supabase db push` : le reste du schéma n'est pas versionné ici.
-- Retour arrière : supabase/rollbacks/20261004140000_sales_agent_step4.sql
-- Tests (transaction annulée) : supabase/manual-tests/20261004140000_sales_agent_step4.sql
-- (hors de supabase/tests/, que `supabase test db` exécuterait avec pgTAP)
--
-- Cette migration ne déclenche AUCUNE analyse : le dispatcher arrive à
-- l'étape 6. D'ici là, `next_run_at` est calculé mais rien ne le lit, et
-- l'interface des réglages n'est pas montée.
--
-- Prérequis : schéma `private` (migration 20261004120000).
-- ═══════════════════════════════════════════════════════════════════════════

begin;

-- ─── 1. Prochaine échéance ───────────────────────────────────────────────
-- Calcul en heure LOCALE de la boîte, converti ensuite en instant absolu :
-- « 7 h à Paris » reste 7 h au changement d'heure (05:00 UTC en été, 06:00
-- UTC en hiver), là où un intervalle de 24 h dériverait d'une heure.
--
-- - weekdays    : du lundi au vendredi, à run_hour ;
-- - daily       : tous les jours, à run_hour ;
-- - twice_daily : du lundi au vendredi, à run_hour et run_hour + 6.
--
-- Strictement après `p_from` : appelée à 07:00 pile, elle rend l'échéance
-- suivante, jamais la même.
--
-- run_hour est borné entre 6 et 16 (contrainte de scan_schedules) : aucune
-- échéance ne tombe dans l'heure qui n'existe pas au passage à l'heure d'été
-- (02:00–03:00), ni dans celle qui existe deux fois en octobre.
create function public.compute_next_scan_at(
  p_frequency text,
  p_run_hour integer,
  p_timezone text,
  p_from timestamptz
)
returns timestamptz
language plpgsql
stable
set search_path = ''
as $$
declare
  local_day date := (p_from at time zone p_timezone)::date;
  slots integer[];
  slot integer;
  scan_day date;
  candidate timestamptz;
begin
  if p_frequency = 'twice_daily' then
    slots := array[p_run_hour, p_run_hour + 6];
  elsif p_frequency in ('weekdays', 'daily') then
    slots := array[p_run_hour];
  else
    raise exception 'Fréquence d''analyse inconnue : %', p_frequency;
  end if;

  -- Huit jours couvrent tous les cas : le pire est un vendredi soir, dont
  -- l'échéance suivante est le lundi (J+3).
  for offset_days in 0..7 loop
    scan_day := local_day + offset_days;
    if p_frequency <> 'daily' and extract(isodow from scan_day) > 5 then
      continue;
    end if;
    foreach slot in array slots loop
      -- date + interval = heure locale sans fuseau ; AT TIME ZONE la
      -- convertit en instant absolu selon les règles du fuseau à cette date.
      candidate := (scan_day + make_interval(hours => slot)) at time zone p_timezone;
      if candidate > p_from then
        return candidate;
      end if;
    end loop;
  end loop;

  return null;
end;
$$;

-- Appelée seulement par les triggers ci-dessous (SECURITY DEFINER) et, à
-- l'étape 6, par le dispatcher (postgres). Pas d'appel RPC depuis l'API.
revoke all on function public.compute_next_scan_at(text, integer, text, timestamptz)
  from public, anon, authenticated, service_role;

-- ─── 2. Table ────────────────────────────────────────────────────────────
-- Une ligne par intégration Gmail, créée automatiquement (§ 5) : jamais par
-- le navigateur.
create table public.scan_schedules (
  integration_id uuid primary key
    references public.integrations (id) on delete cascade,
  organization_id uuid not null
    references public.organizations (id) on delete cascade,

  -- Réglages modifiables par owner/admin (grants de colonnes, § 3).
  enabled boolean not null default false,
  frequency text not null default 'weekdays'
    constraint scan_schedules_frequency_check
    check (frequency in ('weekdays', 'daily', 'twice_daily')),
  run_hour smallint not null default 7
    constraint scan_schedules_run_hour_check
    check (run_hour between 6 and 16),

  -- Réglages fixés par la plateforme : aucun grant à authenticated.
  timezone text not null default 'Europe/Paris',
  daily_ai_budget_millicents integer not null default 10000
    constraint scan_schedules_budget_check
    check (daily_ai_budget_millicents between 0 and 1000000),

  -- État tenu par le système.
  next_run_at timestamptz,
  inbox_watermark timestamptz,
  last_scheduled_run_id uuid references public.runs (id) on delete set null,
  consecutive_failures smallint not null default 0
    constraint scan_schedules_failures_check check (consecutive_failures >= 0),
  last_error text,
  last_error_at timestamptz,

  -- Dernière modification des RÉGLAGES (pas de l'état système).
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null
);

-- Le dispatcher (étape 6) cherchera les boîtes actives dont l'échéance est passée.
create index scan_schedules_due_idx
  on public.scan_schedules (next_run_at)
  where enabled;

-- ─── 3. RLS et privilèges (les six étapes) ───────────────────────────────
alter table public.scan_schedules enable row level security;

create policy scan_schedules_select on public.scan_schedules
  for select to authenticated
  using (public.current_user_role(organization_id) in ('owner', 'admin'));

create policy scan_schedules_update on public.scan_schedules
  for update to authenticated
  using (public.current_user_role(organization_id) in ('owner', 'admin'))
  with check (public.current_user_role(organization_id) in ('owner', 'admin'));

-- Point de départ explicite : aucun privilège implicite.
revoke all on public.scan_schedules from anon, authenticated, service_role;

grant select on public.scan_schedules to authenticated;
-- Seuls les trois réglages : ni le budget, ni le fuseau, ni l'échéance, ni
-- les compteurs ne sont modifiables depuis le navigateur.
grant update (enabled, frequency, run_hour) on public.scan_schedules to authenticated;

-- Edge Functions (étapes 5 et 6) : lecture, et mise à jour de l'état système
-- seulement. Pas d'INSERT (le trigger crée les lignes), pas de DELETE (cascade).
grant select on public.scan_schedules to service_role;
grant update (inbox_watermark, last_scheduled_run_id, consecutive_failures, last_error, last_error_at)
  on public.scan_schedules to service_role;

revoke truncate, references, trigger on public.scan_schedules from authenticated, service_role;

-- ─── 4. Trigger BEFORE UPDATE : traçabilité et échéance ──────────────────
-- N'agit que si un RÉGLAGE change : les mises à jour de l'état système
-- (compteurs, repère, échéance avancée par le dispatcher) passent intactes.
--
-- SECURITY DEFINER : l'utilisateur n'a pas le droit d'exécuter
-- compute_next_scan_at. auth.uid() lit le JWT de la requête, pas le rôle :
-- il désigne bien l'utilisateur, et vaut NULL depuis le SQL Editor ou une
-- Edge Function.
create function private.scan_schedules_before_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  integration_status text;
begin
  if new.enabled is distinct from old.enabled
     or new.frequency is distinct from old.frequency
     or new.run_hour is distinct from old.run_hour
     or new.timezone is distinct from old.timezone then

    if new.enabled and not old.enabled then
      select status into integration_status
        from public.integrations
       where id = new.integration_id;
      if integration_status is distinct from 'active' then
        -- Message destiné à l'utilisateur, affiché tel quel.
        raise exception 'Reconnectez Gmail avant d''activer l''analyse automatique.';
      end if;
      -- Réactivation : on repart d'une ardoise propre.
      new.consecutive_failures := 0;
      new.last_error := null;
      new.last_error_at := null;
    end if;

    new.next_run_at := case
      when new.enabled
        then public.compute_next_scan_at(new.frequency, new.run_hour, new.timezone, now())
      else null
    end;
    new.updated_at := now();
    new.updated_by := auth.uid();
  end if;

  return new;
end;
$$;

revoke all on function private.scan_schedules_before_update()
  from public, anon, authenticated, service_role;

create trigger scan_schedules_before_update
  before update on public.scan_schedules
  for each row execute function private.scan_schedules_before_update();

-- ─── 5. Création automatique de la ligne ─────────────────────────────────
-- Plutôt qu'une modification de gmail-oauth-callback : la ligne naît dans la
-- MÊME transaction que l'intégration, quel que soit le chemin d'insertion.
--
-- Une reconnexion passe par l'upsert de gmail-oauth-callback : la ligne
-- integrations existe déjà, c'est un UPDATE, ce trigger ne se déclenche pas —
-- et la ligne scan_schedules existe déjà, réglages conservés.
create function private.create_scan_schedule()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.scan_schedules (integration_id, organization_id)
  values (new.id, new.organization_id)
  on conflict (integration_id) do nothing;
  return null;
end;
$$;

revoke all on function private.create_scan_schedule()
  from public, anon, authenticated, service_role;

create trigger integrations_create_scan_schedule
  after insert on public.integrations
  for each row
  when (new.provider = 'gmail')
  execute function private.create_scan_schedule();

-- ─── 6. Rattrapage des intégrations Gmail existantes ─────────────────────
-- Toutes, révoquées comprises : une reconnexion réutilise la même ligne.
insert into public.scan_schedules (integration_id, organization_id)
select id, organization_id
  from public.integrations
 where provider = 'gmail'
on conflict (integration_id) do nothing;

commit;

-- ─── Vérifications après exécution (lecture seule) ───────────────────────
-- select count(*) as gmail, (select count(*) from public.scan_schedules) as reglages
--   from public.integrations where provider = 'gmail';          -- égaux
-- select integration_id, enabled, frequency, run_hour, next_run_at
--   from public.scan_schedules;                                  -- enabled = false, next_run_at NULL
-- select column_name,
--        has_column_privilege('authenticated', 'public.scan_schedules', column_name, 'UPDATE') as maj_authenticated
--   from information_schema.columns
--  where table_schema = 'public' and table_name = 'scan_schedules'
--  order by ordinal_position;                                     -- true pour enabled, frequency, run_hour seulement
