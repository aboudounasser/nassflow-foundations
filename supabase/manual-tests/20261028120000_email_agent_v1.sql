-- ═══════════════════════════════════════════════════════════════════════════
-- Tests de la migration 20261028120000_email_agent_v1.sql.
--
-- À lancer dans le SQL Editor APRÈS la migration. Tout se passe dans une
-- transaction ANNULÉE : aucune donnée n'est conservée, « nassflow » n'est
-- jamais touchée (organisation et intégrations fictives).
--
-- La partie C joue le rôle `authenticated` avec le JWT simulé d'un compte
-- existant (le plus ancien d'auth.users), rattaché le temps du test à
-- l'organisation fictive : d'abord admin, puis member. Rien n'est conservé.
--
-- Résultat attendu : une seule table, toutes les lignes avec ok = true.
-- En cas d'erreur, lancer `rollback;` seul.
-- ═══════════════════════════════════════════════════════════════════════════

begin;

create temp table email_agent_results (
  ordre serial,
  cas text not null,
  ok boolean not null,
  detail text
) on commit drop;

-- Les blocs C basculent sur `authenticated`, qui n'a aucun droit sur cette
-- table temporaire : les résultats y sont écrits après retour au rôle initial.

-- ─── A. Structure et privilèges ──────────────────────────────────────────
insert into email_agent_results (cas, ok, detail)
select 'A1 RLS activée sur les deux tables', bool_and(relrowsecurity), string_agg(relname || '=' || relrowsecurity, ', ')
  from pg_class
 where oid in ('public.inbox_messages'::regclass, 'public.email_reply_drafts'::regclass);

insert into email_agent_results (cas, ok, detail)
select 'A2 authenticated : UPDATE limité à inbox_messages.status',
       array_agg(column_name::text order by column_name) = array['status'],
       array_agg(column_name::text order by column_name)::text
  from information_schema.columns
 where table_schema = 'public' and table_name = 'inbox_messages'
   and has_column_privilege('authenticated', 'public.inbox_messages', column_name, 'UPDATE');

insert into email_agent_results (cas, ok, detail)
select 'A3 authenticated : SELECT seul, ni INSERT ni DELETE, aucun UPDATE sur les brouillons',
       has_table_privilege('authenticated', 'public.inbox_messages', 'SELECT')
   and has_table_privilege('authenticated', 'public.email_reply_drafts', 'SELECT')
   and not has_table_privilege('authenticated', 'public.inbox_messages', 'INSERT')
   and not has_table_privilege('authenticated', 'public.inbox_messages', 'DELETE')
   and not has_table_privilege('authenticated', 'public.email_reply_drafts', 'INSERT')
   and not has_table_privilege('authenticated', 'public.email_reply_drafts', 'DELETE')
   and not has_any_column_privilege('authenticated', 'public.email_reply_drafts', 'UPDATE'),
       null;

insert into email_agent_results (cas, ok, detail)
select 'A4 service_role : SELECT et INSERT seulement',
       has_table_privilege('service_role', 'public.inbox_messages', 'SELECT')
   and has_table_privilege('service_role', 'public.inbox_messages', 'INSERT')
   and has_table_privilege('service_role', 'public.email_reply_drafts', 'SELECT')
   and has_table_privilege('service_role', 'public.email_reply_drafts', 'INSERT')
   and not has_any_column_privilege('service_role', 'public.inbox_messages', 'UPDATE')
   and not has_any_column_privilege('service_role', 'public.email_reply_drafts', 'UPDATE')
   and not has_table_privilege('service_role', 'public.inbox_messages', 'DELETE')
   and not has_table_privilege('service_role', 'public.email_reply_drafts', 'DELETE')
   and not has_table_privilege('service_role', 'public.inbox_messages', 'TRUNCATE')
   and not has_table_privilege('authenticated', 'public.inbox_messages', 'TRUNCATE'),
       null;

insert into email_agent_results (cas, ok, detail)
select 'A5 anon : aucun accès',
       not has_table_privilege('anon', 'public.inbox_messages', 'SELECT')
   and not has_table_privilege('anon', 'public.email_reply_drafts', 'SELECT'),
       null;

insert into email_agent_results (cas, ok, detail)
select 'A6 trois politiques, toutes réservées à owner et admin',
       count(*) = 3
   and bool_and(coalesce(qual, '') like '%current_user_role%' and qual like '%owner%' and qual like '%admin%'),
       string_agg(tablename || '.' || policyname || ' (' || cmd || ')', ', ' order by policyname)
  from pg_policies
 where schemaname = 'public' and tablename in ('inbox_messages', 'email_reply_drafts');

insert into email_agent_results (cas, ok, detail)
select 'A7 fonctions internes non exécutables depuis l''API',
       not has_function_privilege('authenticated', 'private.purge_email_agent_data()', 'EXECUTE')
   and not has_function_privilege('service_role', 'private.purge_email_agent_data()', 'EXECUTE')
   and not has_function_privilege('anon', 'private.purge_email_agent_data()', 'EXECUTE')
   and not has_function_privilege('authenticated', 'private.inbox_messages_before_update()', 'EXECUTE'),
       null;

insert into email_agent_results (cas, ok, detail)
select 'A8 tâche purge-email-agent-data active à 3 h 45',
       count(*) = 1 and bool_and(active and schedule = '45 3 * * *'),
       string_agg(schedule || ' active=' || active, ', ')
  from cron.job where jobname = 'purge-email-agent-data';

insert into email_agent_results (cas, ok, detail)
select 'A9 dispatch-gmail-scans toujours active', coalesce(bool_and(active), false), string_agg(active::text, ', ')
  from cron.job where jobname = 'dispatch-gmail-scans';

-- ─── B. Contraintes, trigger, purge et cascade (données fictives) ────────
do $$
declare
  org_id uuid;
  gmail_id uuid;
  other_gmail_id uuid;
  msg_id uuid;
  old_msg_id uuid;
  m public.inbox_messages;
  user_id uuid := (select id from auth.users order by created_at limit 1);
  remaining integer;
  cascaded integer;
begin
  insert into public.organizations (name) values ('Test Agent Email — annulé')
  returning id into org_id;

  -- vault_secret_id est NOT NULL en base : un identifiant fictif suffit.
  insert into public.integrations (organization_id, provider, account_email, status, vault_secret_id)
  values (org_id, 'gmail', 'test-email-agent@example.invalid', 'active', gen_random_uuid())
  returning id into gmail_id;
  insert into public.integrations (organization_id, provider, account_email, status, vault_secret_id)
  values (org_id, 'gmail', 'test-email-agent-2@example.invalid', 'active', gen_random_uuid())
  returning id into other_gmail_id;

  -- B1 : valeurs par défaut.
  insert into public.inbox_messages (organization_id, integration_id, message_id, category)
  values (org_id, gmail_id, 'm-1', 'client')
  returning * into m;
  msg_id := m.id;
  insert into pg_temp.email_agent_results (cas, ok, detail) values (
    'B1 valeurs par défaut : à traiter, priorité normale, sans trace de statut',
    m.status = 'to_handle' and m.priority = 'normal' and m.status_changed_at is null
      and m.status_changed_by is null and m.created_at is not null,
    format('status=%s priority=%s', m.status, m.priority));

  -- B2 à B5 : valeurs refusées.
  begin
    insert into public.inbox_messages (organization_id, integration_id, message_id, category)
    values (org_id, gmail_id, 'm-bad', 'urgent');
    insert into pg_temp.email_agent_results (cas, ok, detail) values ('B2 catégorie inconnue refusée', false, 'acceptée');
  exception when check_violation then
    insert into pg_temp.email_agent_results (cas, ok, detail) values ('B2 catégorie inconnue refusée', true, sqlerrm);
  end;

  begin
    insert into public.inbox_messages (organization_id, integration_id, message_id, category, priority)
    values (org_id, gmail_id, 'm-bad', 'other', 'urgent');
    insert into pg_temp.email_agent_results (cas, ok, detail) values ('B3 priorité inconnue refusée', false, 'acceptée');
  exception when check_violation then
    insert into pg_temp.email_agent_results (cas, ok, detail) values ('B3 priorité inconnue refusée', true, sqlerrm);
  end;

  begin
    update public.inbox_messages set status = 'archived' where id = msg_id;
    insert into pg_temp.email_agent_results (cas, ok, detail) values ('B4 statut inconnu refusé', false, 'accepté');
  exception when check_violation then
    insert into pg_temp.email_agent_results (cas, ok, detail) values ('B4 statut inconnu refusé', true, sqlerrm);
  end;

  begin
    insert into public.inbox_messages (organization_id, integration_id, message_id, category, summary)
    values (org_id, gmail_id, 'm-bad', 'other', repeat('x', 301));
    insert into pg_temp.email_agent_results (cas, ok, detail) values ('B5 résumé de 301 caractères refusé', false, 'accepté');
  exception when check_violation then
    insert into pg_temp.email_agent_results (cas, ok, detail) values ('B5 résumé de 301 caractères refusé', true, sqlerrm);
  end;

  -- B6 : unicité par boîte, pas globale.
  begin
    insert into public.inbox_messages (organization_id, integration_id, message_id, category)
    values (org_id, gmail_id, 'm-1', 'other');
    insert into pg_temp.email_agent_results (cas, ok, detail) values ('B6 même message dans la même boîte refusé', false, 'accepté');
  exception when unique_violation then
    insert into pg_temp.email_agent_results (cas, ok, detail) values ('B6 même message dans la même boîte refusé', true, sqlerrm);
  end;

  insert into public.inbox_messages (organization_id, integration_id, message_id, category)
  values (org_id, other_gmail_id, 'm-1', 'other');
  insert into pg_temp.email_agent_results (cas, ok, detail) values (
    'B7 même identifiant dans une autre boîte accepté', true, null);

  -- B8 : le trigger trace le changement de statut et l'auteur (JWT simulé).
  perform set_config('request.jwt.claims', json_build_object('sub', user_id, 'role', 'authenticated')::text, true);
  update public.inbox_messages set status = 'handled' where id = msg_id;
  select * into m from public.inbox_messages where id = msg_id;
  insert into pg_temp.email_agent_results (cas, ok, detail) values (
    'B8 changement de statut tracé (date et auteur)',
    m.status = 'handled' and m.status_changed_at is not null and m.status_changed_by is not distinct from user_id,
    format('changed_at=%s by=%s attendu=%s', m.status_changed_at, m.status_changed_by, user_id));
  perform set_config('request.jwt.claims', '', true);

  -- B9 : une mise à jour sans changement de statut ne touche pas à la trace.
  update public.inbox_messages set status_changed_at = '2000-01-01' where id = msg_id;
  update public.inbox_messages set subject = 'Objet modifié' where id = msg_id;
  select * into m from public.inbox_messages where id = msg_id;
  insert into pg_temp.email_agent_results (cas, ok, detail) values (
    'B9 autre colonne modifiée → trace de statut inchangée',
    m.status_changed_at = '2000-01-01'::timestamptz,
    m.status_changed_at::text);

  -- B10 à B12 : brouillons.
  insert into public.email_reply_drafts (organization_id, integration_id, inbox_message_id, body, model, cost_millicents)
  values (org_id, gmail_id, msg_id, null, 'gpt-4o-mini', 4);
  insert into pg_temp.email_agent_results (cas, ok, detail) values (
    'B10 brouillon sans texte (réponse illisible) accepté, missing_info = []',
    (select missing_info = '[]'::jsonb from public.email_reply_drafts where inbox_message_id = msg_id limit 1),
    null);

  begin
    insert into public.email_reply_drafts (organization_id, integration_id, inbox_message_id, body, missing_info, model, cost_millicents)
    values (org_id, gmail_id, msg_id, 'x', '{"a": 1}', 'gpt-4o-mini', 4);
    insert into pg_temp.email_agent_results (cas, ok, detail) values ('B11 missing_info non tableau refusé', false, 'accepté');
  exception when check_violation then
    insert into pg_temp.email_agent_results (cas, ok, detail) values ('B11 missing_info non tableau refusé', true, sqlerrm);
  end;

  begin
    insert into public.email_reply_drafts (organization_id, integration_id, inbox_message_id, body, model, cost_millicents)
    values (org_id, gmail_id, msg_id, 'x', 'gpt-4o-mini', -1);
    insert into pg_temp.email_agent_results (cas, ok, detail) values ('B12 coût négatif refusé', false, 'accepté');
  exception when check_violation then
    insert into pg_temp.email_agent_results (cas, ok, detail) values ('B12 coût négatif refusé', true, sqlerrm);
  end;

  -- B13 : purge — 89 / 91 jours pour le tri, 29 / 31 jours pour les brouillons,
  -- et les brouillons d'un message purgé partent avec lui.
  delete from public.email_reply_drafts where inbox_message_id = msg_id;
  update public.inbox_messages set created_at = now() - interval '89 days' where id = msg_id;
  insert into public.inbox_messages (organization_id, integration_id, message_id, category, created_at)
  values (org_id, gmail_id, 'm-old', 'other', now() - interval '91 days')
  returning id into old_msg_id;
  insert into public.email_reply_drafts (organization_id, integration_id, inbox_message_id, body, model, cost_millicents, created_at)
  values
    (org_id, gmail_id, msg_id, 'récent', 'gpt-4o-mini', 4, now() - interval '29 days'),
    (org_id, gmail_id, msg_id, 'ancien', 'gpt-4o-mini', 4, now() - interval '31 days'),
    (org_id, gmail_id, old_msg_id, 'du message purgé', 'gpt-4o-mini', 4, now() - interval '1 day');

  perform private.purge_email_agent_data();

  insert into pg_temp.email_agent_results (cas, ok, detail)
  select 'B13 purge du tri : 91 jours supprimé, 89 jours conservé',
         bool_or(id = msg_id) and not bool_or(id = old_msg_id),
         string_agg(message_id, ', ')
    from public.inbox_messages where integration_id = gmail_id;

  insert into pg_temp.email_agent_results (cas, ok, detail)
  select 'B14 purge des brouillons : 31 jours et brouillons du message purgé supprimés',
         array_agg(body order by body) = array['récent'],
         array_agg(body order by body)::text
    from public.email_reply_drafts where integration_id = gmail_id;

  -- B15 : la suppression d'une boîte emporte son tri et ses brouillons.
  delete from public.integrations where id = gmail_id;
  select count(*) into remaining from public.inbox_messages where integration_id = gmail_id;
  select count(*) into cascaded from public.email_reply_drafts where integration_id = gmail_id;
  insert into pg_temp.email_agent_results (cas, ok, detail) values (
    'B15 boîte supprimée → tri et brouillons supprimés',
    remaining = 0 and cascaded = 0,
    format('messages=%s brouillons=%s', remaining, cascaded));
end;
$$;

-- ─── C. RLS jouée en tant qu'utilisateur (admin puis member) ─────────────
do $$
declare
  initial_role text := current_user;
  user_id uuid := (select id from auth.users order by created_at limit 1);
  org_id uuid;
  gmail_id uuid;
  msg_id uuid;
  membership_id uuid;
  seen_messages integer;
  seen_drafts integer;
  updated integer;
  status_after text;
  results text[][] := array[]::text[][];
  outcome text;
begin
  insert into public.organizations (name) values ('Test Agent Email RLS — annulé')
  returning id into org_id;
  insert into public.integrations (organization_id, provider, account_email, status, vault_secret_id)
  values (org_id, 'gmail', 'test-email-agent-rls@example.invalid', 'active', gen_random_uuid())
  returning id into gmail_id;
  insert into public.inbox_messages (organization_id, integration_id, message_id, category, summary)
  values (org_id, gmail_id, 'm-rls', 'prospect', 'Résumé d''origine')
  returning id into msg_id;
  insert into public.email_reply_drafts (organization_id, integration_id, inbox_message_id, body, model, cost_millicents)
  values (org_id, gmail_id, msg_id, 'Bonjour,', 'gpt-4o-mini', 4);
  insert into public.memberships (organization_id, user_id, role)
  values (org_id, user_id, 'admin')
  returning id into membership_id;

  -- ── En tant qu'admin ──
  perform set_config('request.jwt.claims', json_build_object('sub', user_id, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);

  select count(*) into seen_messages from public.inbox_messages where organization_id = org_id;
  select count(*) into seen_drafts from public.email_reply_drafts where organization_id = org_id;
  results := results || array[['C1 admin : lit le message et le brouillon de son organisation',
    (seen_messages = 1 and seen_drafts = 1)::text, format('messages=%s brouillons=%s', seen_messages, seen_drafts)]];

  update public.inbox_messages set status = 'ignored' where id = msg_id;
  get diagnostics updated = row_count;
  results := results || array[['C2 admin : modifie le statut', (updated = 1)::text, format('lignes=%s', updated)]];

  begin
    update public.inbox_messages set summary = 'Résumé falsifié' where id = msg_id;
    outcome := 'accepté';
  exception when insufficient_privilege then
    outcome := null;
  end;
  results := results || array[['C3 admin : ne peut pas modifier le résumé', (outcome is null)::text, coalesce(outcome, 'permission denied')]];

  begin
    update public.inbox_messages set category = 'other' where id = msg_id;
    outcome := 'accepté';
  exception when insufficient_privilege then
    outcome := null;
  end;
  results := results || array[['C4 admin : ne peut pas modifier la catégorie', (outcome is null)::text, coalesce(outcome, 'permission denied')]];

  begin
    insert into public.inbox_messages (organization_id, integration_id, message_id, category)
    values (org_id, gmail_id, 'm-injecte', 'other');
    outcome := 'accepté';
  exception when insufficient_privilege then
    outcome := null;
  end;
  results := results || array[['C5 admin : ne peut pas insérer de message', (outcome is null)::text, coalesce(outcome, 'permission denied')]];

  begin
    delete from public.email_reply_drafts where organization_id = org_id;
    outcome := 'accepté';
  exception when insufficient_privilege then
    outcome := null;
  end;
  results := results || array[['C6 admin : ne peut pas supprimer de brouillon', (outcome is null)::text, coalesce(outcome, 'permission denied')]];

  -- ── En tant que member ──
  perform set_config('role', initial_role, true);
  update public.memberships set role = 'member' where id = membership_id;
  perform set_config('role', 'authenticated', true);

  select count(*) into seen_messages from public.inbox_messages where organization_id = org_id;
  select count(*) into seen_drafts from public.email_reply_drafts where organization_id = org_id;
  results := results || array[['C7 member : ne lit ni message ni brouillon',
    (seen_messages = 0 and seen_drafts = 0)::text, format('messages=%s brouillons=%s', seen_messages, seen_drafts)]];

  update public.inbox_messages set status = 'handled' where id = msg_id;
  get diagnostics updated = row_count;

  perform set_config('role', initial_role, true);
  perform set_config('request.jwt.claims', '', true);

  select status into status_after from public.inbox_messages where id = msg_id;
  results := results || array[['C8 member : sa modification de statut n''atteint aucune ligne',
    (updated = 0 and status_after = 'ignored')::text, format('lignes=%s statut=%s', updated, status_after)]];

  for i in 1 .. array_length(results, 1) loop
    insert into pg_temp.email_agent_results (cas, ok, detail)
    values (results[i][1], results[i][2]::boolean, results[i][3]);
  end loop;
end;
$$;

select ordre, cas, ok, detail from email_agent_results order by ordre;

rollback;
