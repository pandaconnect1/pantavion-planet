-- Pantavion Trust & Safety profile controls.
-- Safety action is human-reviewed, least-privilege and fully audited.
-- It never exposes passwords or general private-message content.

create table if not exists public.profile_safety_controls (
  user_id uuid primary key references auth.users(id) on delete cascade,
  control_state text not null default 'active'
    check (control_state in ('active', 'monitoring', 'verification_required', 'restricted', 'suspended')),
  discovery_allowed boolean not null default true,
  new_contacts_allowed boolean not null default true,
  messaging_allowed boolean not null default true,
  public_activity_allowed boolean not null default true,
  identity_review_required boolean not null default false,
  active_case_id uuid,
  updated_at timestamptz not null default now()
);

create table if not exists public.trust_safety_cases (
  id uuid primary key default gen_random_uuid(),
  subject_user_id uuid not null references auth.users(id) on delete cascade,
  case_kind text not null check (case_kind in (
    'profile_integrity', 'impersonation', 'scam_fraud', 'account_security',
    'harassment', 'minor_safety', 'non_consensual_media', 'threat',
    'doxxing', 'illegal_content', 'other'
  )),
  severity text not null check (severity in ('low', 'medium', 'high', 'critical')),
  sensitivity text not null default 'standard'
    check (sensitivity in ('standard', 'protected', 'minor_protected', 'elite_sealed')),
  case_state text not null default 'open' check (case_state in (
    'open', 'assessing', 'verification_requested', 'restricted', 'suspended',
    'resolved_no_action', 'closed', 'appealed'
  )),
  opened_by uuid references auth.users(id) on delete set null,
  reason_summary text not null check (char_length(btrim(reason_summary)) between 10 and 2000),
  opened_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid references auth.users(id) on delete set null
);

alter table public.profile_safety_controls
  add constraint profile_safety_controls_active_case_id_fkey
  foreign key (active_case_id) references public.trust_safety_cases(id) on delete set null;

create table if not exists public.trust_safety_signals (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.trust_safety_cases(id) on delete cascade,
  subject_user_id uuid not null references auth.users(id) on delete cascade,
  reporter_id uuid references auth.users(id) on delete set null,
  source text not null check (source in ('founder_manual', 'user_report', 'system_integrity', 'trusted_partner')),
  signal_kind text not null check (signal_kind in (
    'profile_integrity', 'impersonation', 'scam_fraud', 'account_security',
    'harassment', 'minor_safety', 'non_consensual_media', 'threat',
    'doxxing', 'illegal_content', 'other'
  )),
  severity text not null check (severity in ('low', 'medium', 'high', 'critical')),
  redacted_summary text not null check (char_length(btrim(redacted_summary)) between 10 and 2000),
  state text not null default 'active' check (state in ('active', 'dismissed', 'confirmed')),
  created_at timestamptz not null default now()
);

create table if not exists public.trust_safety_actions (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.trust_safety_cases(id) on delete cascade,
  subject_user_id uuid not null references auth.users(id) on delete cascade,
  actor_id uuid not null references auth.users(id) on delete restrict,
  action_type text not null check (action_type in (
    'begin_assessment', 'request_reverification', 'restrict_discovery',
    'restrict_new_contacts', 'restrict_messaging', 'suspend_profile',
    'restore_profile', 'close_no_action'
  )),
  reason text not null check (char_length(btrim(reason)) between 10 and 2000),
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.trust_safety_appeals (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.trust_safety_cases(id) on delete cascade,
  subject_user_id uuid not null references auth.users(id) on delete cascade,
  statement text not null check (char_length(btrim(statement)) between 20 and 4000),
  appeal_state text not null default 'submitted'
    check (appeal_state in ('submitted', 'under_review', 'accepted', 'rejected')),
  submitted_at timestamptz not null default now(),
  decided_at timestamptz,
  decided_by uuid references auth.users(id) on delete set null,
  decision_note text
);

create table if not exists public.trust_safety_access_audit (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.trust_safety_cases(id) on delete cascade,
  subject_user_id uuid not null references auth.users(id) on delete cascade,
  actor_id uuid not null references auth.users(id) on delete restrict,
  access_scope text not null check (access_scope in ('case_metadata', 'standard_dossier', 'identity_review')),
  purpose text not null check (char_length(btrim(purpose)) between 10 and 2000),
  created_at timestamptz not null default now()
);

create index if not exists trust_safety_cases_open_queue_idx
  on public.trust_safety_cases (case_state, severity, opened_at);
create index if not exists trust_safety_cases_subject_idx
  on public.trust_safety_cases (subject_user_id, opened_at desc);
create index if not exists trust_safety_signals_case_idx
  on public.trust_safety_signals (case_id, created_at);
create index if not exists trust_safety_actions_case_idx
  on public.trust_safety_actions (case_id, created_at desc);
create index if not exists trust_safety_appeals_subject_idx
  on public.trust_safety_appeals (subject_user_id, submitted_at desc);

alter table public.profile_safety_controls enable row level security;
alter table public.trust_safety_cases enable row level security;
alter table public.trust_safety_signals enable row level security;
alter table public.trust_safety_actions enable row level security;
alter table public.trust_safety_appeals enable row level security;
alter table public.trust_safety_access_audit enable row level security;

revoke all on table public.profile_safety_controls from anon;
revoke all on table public.trust_safety_cases from anon;
revoke all on table public.trust_safety_signals from anon;
revoke all on table public.trust_safety_actions from anon;
revoke all on table public.trust_safety_appeals from anon;
revoke all on table public.trust_safety_access_audit from anon;

revoke insert, update, delete on table public.profile_safety_controls from authenticated;
revoke insert, update, delete on table public.trust_safety_cases from authenticated;
revoke insert, update, delete on table public.trust_safety_signals from authenticated;
revoke insert, update, delete on table public.trust_safety_actions from authenticated;
revoke insert, update, delete on table public.trust_safety_appeals from authenticated;
revoke all on table public.trust_safety_access_audit from authenticated;

grant select on table public.profile_safety_controls to authenticated;
grant select on table public.trust_safety_cases to authenticated;
grant select on table public.trust_safety_signals to authenticated;
grant select on table public.trust_safety_actions to authenticated;
grant select on table public.trust_safety_appeals to authenticated;

create or replace function public.pantavion_is_active_trust_safety_operator()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select auth.uid() is not null
    and exists (
      select 1
      from public.pantavion_operator_roles
      where user_id = auth.uid()
        and role in ('founder', 'safety_reviewer')
        and active = true
    );
$$;

create or replace function public.pantavion_has_aal2()
returns boolean
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
  select coalesce((select auth.jwt() ->> 'aal'), 'aal1') = 'aal2';
$$;

create or replace function public.pantavion_safety_allows_discovery(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce((select discovery_allowed from public.profile_safety_controls where user_id = p_user_id), true);
$$;

create or replace function public.pantavion_safety_allows_new_contacts(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce((select new_contacts_allowed from public.profile_safety_controls where user_id = p_user_id), true);
$$;

create or replace function public.pantavion_safety_allows_messages(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce((select messaging_allowed from public.profile_safety_controls where user_id = p_user_id), true);
$$;

create or replace function public.pantavion_safety_allows_public_activity(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce((select public_activity_allowed from public.profile_safety_controls where user_id = p_user_id), true);
$$;

revoke all on function public.pantavion_is_active_trust_safety_operator() from public, anon;
revoke all on function public.pantavion_has_aal2() from public, anon;
revoke all on function public.pantavion_safety_allows_discovery(uuid) from public, anon;
revoke all on function public.pantavion_safety_allows_new_contacts(uuid) from public, anon;
revoke all on function public.pantavion_safety_allows_messages(uuid) from public, anon;
revoke all on function public.pantavion_safety_allows_public_activity(uuid) from public, anon;
grant execute on function public.pantavion_is_active_trust_safety_operator() to authenticated;
grant execute on function public.pantavion_has_aal2() to authenticated;
grant execute on function public.pantavion_safety_allows_discovery(uuid) to authenticated;
grant execute on function public.pantavion_safety_allows_new_contacts(uuid) to authenticated;
grant execute on function public.pantavion_safety_allows_messages(uuid) to authenticated;
grant execute on function public.pantavion_safety_allows_public_activity(uuid) to authenticated;

create policy profile_safety_controls_owner_read
  on public.profile_safety_controls
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy profile_safety_controls_operator_read
  on public.profile_safety_controls
  for select to authenticated
  using (
    (select public.pantavion_is_active_trust_safety_operator())
    and (select public.pantavion_has_aal2())
  );

create policy trust_safety_cases_operator_read
  on public.trust_safety_cases
  for select to authenticated
  using (
    (select public.pantavion_is_active_trust_safety_operator())
    and (select public.pantavion_has_aal2())
    and (sensitivity = 'standard' or (select public.pantavion_is_active_founder()))
  );

create policy trust_safety_signals_operator_read
  on public.trust_safety_signals
  for select to authenticated
  using (
    exists (
      select 1 from public.trust_safety_cases c
      where c.id = trust_safety_signals.case_id
        and (select public.pantavion_is_active_trust_safety_operator())
        and (select public.pantavion_has_aal2())
        and (c.sensitivity = 'standard' or (select public.pantavion_is_active_founder()))
    )
  );

create policy trust_safety_actions_operator_read
  on public.trust_safety_actions
  for select to authenticated
  using (
    exists (
      select 1 from public.trust_safety_cases c
      where c.id = trust_safety_actions.case_id
        and (select public.pantavion_is_active_trust_safety_operator())
        and (select public.pantavion_has_aal2())
        and (c.sensitivity = 'standard' or (select public.pantavion_is_active_founder()))
    )
  );

create policy trust_safety_appeals_owner_read
  on public.trust_safety_appeals
  for select to authenticated
  using ((select auth.uid()) = subject_user_id);

create policy trust_safety_appeals_operator_read
  on public.trust_safety_appeals
  for select to authenticated
  using (
    exists (
      select 1 from public.trust_safety_cases c
      where c.id = trust_safety_appeals.case_id
        and (select public.pantavion_is_active_trust_safety_operator())
        and (select public.pantavion_has_aal2())
        and (c.sensitivity = 'standard' or (select public.pantavion_is_active_founder()))
    )
  );

create policy trust_safety_access_audit_founder_read
  on public.trust_safety_access_audit
  for select to authenticated
  using (
    (select public.pantavion_is_active_founder())
    and (select public.pantavion_has_aal2())
  );

drop policy if exists profiles_privacy_read on public.profiles;
create policy profiles_privacy_read
  on public.profiles
  for select to authenticated
  using (
    (select auth.uid()) = id
    or (
      publication_state = 'published'
      and (select public.pantavion_safety_allows_discovery(profiles.id))
      and exists (
        select 1 from public.user_privacy_settings ps
        where ps.user_id = profiles.id
          and ps.profile_visibility = 'public'
          and ps.discoverability_enabled
      )
    )
  );

drop policy if exists relationships_insert on public.relationships;
create policy relationships_insert
  on public.relationships
  for insert to authenticated
  with check (
    (select auth.uid()) = requester_id
    and requester_id <> addressee_id
    and (select public.pantavion_safety_allows_new_contacts(requester_id))
    and (select public.pantavion_safety_allows_new_contacts(addressee_id))
    and not public.pantavion_has_block_between(requester_id, addressee_id)
  );

drop policy if exists messages_insert on public.messages;
create policy messages_insert
  on public.messages
  for insert to authenticated
  with check (
    sender_id = (select auth.uid())
    and public.pantavion_can_send_to_conversation(conversation_id, (select auth.uid()))
  );

create policy social_posts_safety_read
  on public.social_posts
  as restrictive
  for select to authenticated
  using (
    author_id = (select auth.uid())
    or (select public.pantavion_safety_allows_public_activity(author_id))
  );

create policy social_posts_safety_write
  on public.social_posts
  as restrictive
  for insert to authenticated
  with check ((select public.pantavion_safety_allows_public_activity(author_id)));

create policy social_posts_safety_update
  on public.social_posts
  as restrictive
  for update to authenticated
  using ((select public.pantavion_safety_allows_public_activity(author_id)))
  with check ((select public.pantavion_safety_allows_public_activity(author_id)));

create policy public_listings_safety_public_read
  on public.public_listings
  as restrictive
  for select to anon, authenticated
  using ((select public.pantavion_safety_allows_public_activity(owner_id)));

create policy public_listings_safety_write
  on public.public_listings
  as restrictive
  for insert to authenticated
  with check ((select public.pantavion_safety_allows_public_activity(owner_id)));

create policy public_listings_safety_update
  on public.public_listings
  as restrictive
  for update to authenticated
  using ((select public.pantavion_safety_allows_public_activity(owner_id)))
  with check ((select public.pantavion_safety_allows_public_activity(owner_id)));

create or replace function public.pantavion_can_send_to_conversation(
  p_conversation_id uuid,
  p_user_id uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select public.pantavion_is_conversation_member(p_conversation_id, p_user_id)
    and public.pantavion_safety_allows_messages(p_user_id)
    and not exists (
      select 1
      from public.conversation_members a
      join public.conversation_members b
        on b.conversation_id = a.conversation_id
       and b.user_id <> a.user_id
       and b.left_at is null
      where a.conversation_id = p_conversation_id
        and a.user_id = p_user_id
        and a.left_at is null
        and (
          public.pantavion_has_block_between(a.user_id, b.user_id)
          or not public.pantavion_safety_allows_messages(b.user_id)
        )
    );
$$;

create or replace function public.pantavion_request_relationship(p_addressee_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  actor uuid := auth.uid();
  rid uuid;
  existing public.relationships%rowtype;
begin
  if actor is null then raise exception 'authentication required'; end if;
  if p_addressee_id is null or p_addressee_id = actor then raise exception 'invalid addressee'; end if;
  if not public.pantavion_safety_allows_new_contacts(actor)
     or not public.pantavion_safety_allows_new_contacts(p_addressee_id) then
    raise exception 'new contact activity is restricted';
  end if;
  if public.pantavion_has_block_between(actor, p_addressee_id) then raise exception 'relationship blocked'; end if;
  select * into existing from public.relationships r
    where least(r.requester_id, r.addressee_id) = least(actor, p_addressee_id)
      and greatest(r.requester_id, r.addressee_id) = greatest(actor, p_addressee_id)
    limit 1;
  if found and existing.status in ('pending', 'accepted') then return existing.id; end if;
  if found then delete from public.relationships where id = existing.id; end if;
  insert into public.relationships(requester_id, addressee_id, status)
    values(actor, p_addressee_id, 'pending') returning id into rid;
  return rid;
end;
$$;

create or replace function public.pantavion_create_direct_conversation(p_other_user_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  actor uuid := auth.uid();
  cid uuid;
begin
  if actor is null then raise exception 'authentication required'; end if;
  if p_other_user_id is null or p_other_user_id = actor then raise exception 'invalid participant'; end if;
  if not public.pantavion_safety_allows_messages(actor)
     or not public.pantavion_safety_allows_messages(p_other_user_id) then
    raise exception 'messaging is restricted';
  end if;
  if public.pantavion_has_block_between(actor, p_other_user_id) then raise exception 'conversation blocked'; end if;
  if not public.pantavion_are_connections(actor, p_other_user_id) then raise exception 'accepted relationship required'; end if;
  select c.id into cid from public.conversations c
    where c.kind = 'direct'
      and exists(select 1 from public.conversation_members m where m.conversation_id = c.id and m.user_id = actor and m.left_at is null)
      and exists(select 1 from public.conversation_members m where m.conversation_id = c.id and m.user_id = p_other_user_id and m.left_at is null)
      and 2 = (select count(*) from public.conversation_members m where m.conversation_id = c.id and m.left_at is null)
    limit 1;
  if cid is not null then return cid; end if;
  insert into public.conversations(kind, created_by) values('direct', actor) returning id into cid;
  insert into public.conversation_members(conversation_id, user_id, role)
    values(cid, actor, 'owner'), (cid, p_other_user_id, 'member');
  return cid;
end;
$$;

create or replace function public.pantavion_open_trust_safety_case(
  p_subject_user_id uuid,
  p_case_kind text,
  p_severity text,
  p_sensitivity text,
  p_reason text
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor_id uuid := auth.uid();
  v_case_id uuid;
  v_reason text := btrim(coalesce(p_reason, ''));
begin
  if v_actor_id is null or not public.pantavion_is_active_trust_safety_operator() or not public.pantavion_has_aal2() then
    raise exception 'Trust & Safety operator with AAL2 is required';
  end if;
  if p_subject_user_id is null or p_subject_user_id = v_actor_id then raise exception 'Invalid safety case subject'; end if;
  if p_case_kind not in ('profile_integrity','impersonation','scam_fraud','account_security','harassment','minor_safety','non_consensual_media','threat','doxxing','illegal_content','other') then raise exception 'Unsupported case kind'; end if;
  if p_severity not in ('low','medium','high','critical') then raise exception 'Unsupported severity'; end if;
  if p_sensitivity not in ('standard','protected','minor_protected','elite_sealed') then raise exception 'Unsupported sensitivity'; end if;
  if char_length(v_reason) < 10 or char_length(v_reason) > 2000 then raise exception 'A case reason of 10 to 2000 characters is required'; end if;
  if p_sensitivity <> 'standard' and not public.pantavion_is_active_founder() then raise exception 'Founder authorization required for protected cases'; end if;

  insert into public.trust_safety_cases(subject_user_id, case_kind, severity, sensitivity, opened_by, reason_summary)
  values(p_subject_user_id, p_case_kind, p_severity, p_sensitivity, v_actor_id, v_reason)
  returning id into v_case_id;
  insert into public.trust_safety_signals(case_id, subject_user_id, reporter_id, source, signal_kind, severity, redacted_summary)
  values(v_case_id, p_subject_user_id, v_actor_id, 'founder_manual', p_case_kind, p_severity, v_reason);
  insert into public.profile_safety_controls(user_id, control_state, active_case_id)
  values(p_subject_user_id, 'monitoring', v_case_id)
  on conflict (user_id) do update set control_state = 'monitoring', active_case_id = excluded.active_case_id, updated_at = now();
  insert into public.trust_safety_access_audit(case_id, subject_user_id, actor_id, access_scope, purpose)
  values(v_case_id, p_subject_user_id, v_actor_id, 'case_metadata', v_reason);
  return v_case_id;
end;
$$;

create or replace function public.pantavion_report_profile(
  p_subject_user_id uuid,
  p_case_kind text,
  p_statement text
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_reporter_id uuid := auth.uid();
  v_case_id uuid;
  v_statement text := btrim(coalesce(p_statement, ''));
  v_severity text;
  v_sensitivity text;
begin
  if v_reporter_id is null then raise exception 'authentication required'; end if;
  if p_subject_user_id is null or p_subject_user_id = v_reporter_id then raise exception 'Invalid report subject'; end if;
  if p_case_kind not in ('profile_integrity','impersonation','scam_fraud','account_security','harassment','minor_safety','non_consensual_media','threat','doxxing','illegal_content','other') then raise exception 'Unsupported report type'; end if;
  if char_length(v_statement) < 10 or char_length(v_statement) > 2000 then raise exception 'A report of 10 to 2000 characters is required'; end if;
  if (select count(*) from public.trust_safety_signals where reporter_id = v_reporter_id and source = 'user_report' and created_at > now() - interval '24 hours') >= 5 then
    raise exception 'Report rate limit reached';
  end if;
  if exists(select 1 from public.trust_safety_signals where reporter_id = v_reporter_id and subject_user_id = p_subject_user_id and signal_kind = p_case_kind and source = 'user_report' and created_at > now() - interval '30 days') then
    raise exception 'A matching report is already under review';
  end if;
  v_severity := case when p_case_kind in ('minor_safety','non_consensual_media','threat','illegal_content') then 'high' else 'medium' end;
  v_sensitivity := case when p_case_kind = 'minor_safety' then 'minor_protected' else 'standard' end;
  select id into v_case_id from public.trust_safety_cases
    where subject_user_id = p_subject_user_id
      and case_state in ('open','assessing','verification_requested','restricted','suspended','appealed')
    order by opened_at desc limit 1;
  if v_case_id is null then
    insert into public.trust_safety_cases(subject_user_id, case_kind, severity, sensitivity, reason_summary)
    values(p_subject_user_id, p_case_kind, v_severity, v_sensitivity, 'User safety report received')
    returning id into v_case_id;
    insert into public.profile_safety_controls(user_id, control_state, active_case_id)
    values(p_subject_user_id, 'monitoring', v_case_id)
    on conflict (user_id) do update set control_state = 'monitoring', active_case_id = excluded.active_case_id, updated_at = now();
  end if;
  insert into public.trust_safety_signals(case_id, subject_user_id, reporter_id, source, signal_kind, severity, redacted_summary)
  values(v_case_id, p_subject_user_id, v_reporter_id, 'user_report', p_case_kind, v_severity, v_statement);
  return v_case_id;
end;
$$;

create or replace function public.pantavion_apply_trust_safety_action(
  p_case_id uuid,
  p_action text,
  p_reason text
)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor_id uuid := auth.uid();
  v_case public.trust_safety_cases%rowtype;
  v_reason text := btrim(coalesce(p_reason, ''));
  v_previous_profile_state text;
  v_previous_registration_state text;
  v_previous_privacy jsonb;
  v_previous_suspend jsonb;
begin
  if v_actor_id is null or not public.pantavion_is_active_trust_safety_operator() or not public.pantavion_has_aal2() then
    raise exception 'Trust & Safety operator with AAL2 is required';
  end if;
  if p_action not in ('begin_assessment','request_reverification','restrict_discovery','restrict_new_contacts','restrict_messaging','suspend_profile','restore_profile','close_no_action') then raise exception 'Unsupported safety action'; end if;
  if char_length(v_reason) < 10 or char_length(v_reason) > 2000 then raise exception 'An action reason of 10 to 2000 characters is required'; end if;
  select * into v_case from public.trust_safety_cases where id = p_case_id for update;
  if not found then raise exception 'Safety case is not available'; end if;
  if v_case.sensitivity <> 'standard' and not public.pantavion_is_active_founder() then raise exception 'Founder authorization required for protected cases'; end if;
  if p_action in ('suspend_profile','restore_profile','close_no_action') and not public.pantavion_is_active_founder() then raise exception 'Founder authorization required for this action'; end if;
  select publication_state into v_previous_profile_state from public.profiles where id = v_case.subject_user_id;
  select state into v_previous_registration_state from public.profile_registration_states where user_id = v_case.subject_user_id;
  select jsonb_build_object('profile_visibility', profile_visibility, 'discoverability_enabled', discoverability_enabled, 'messaging_policy', messaging_policy)
    into v_previous_privacy from public.user_privacy_settings where user_id = v_case.subject_user_id;
  insert into public.trust_safety_actions(case_id, subject_user_id, actor_id, action_type, reason, details)
  values(p_case_id, v_case.subject_user_id, v_actor_id, p_action, v_reason, jsonb_build_object(
    'previous_profile_state', v_previous_profile_state,
    'previous_registration_state', v_previous_registration_state,
    'previous_privacy', coalesce(v_previous_privacy, '{}'::jsonb)
  ));
  if p_action = 'begin_assessment' then
    update public.trust_safety_cases set case_state = 'assessing', updated_at = now() where id = p_case_id;
    update public.profile_safety_controls set control_state = 'monitoring', active_case_id = p_case_id, updated_at = now() where user_id = v_case.subject_user_id;
  elsif p_action = 'request_reverification' then
    update public.trust_safety_cases set case_state = 'verification_requested', updated_at = now() where id = p_case_id;
    update public.profile_safety_controls set control_state = 'verification_required', discovery_allowed = false, new_contacts_allowed = false, public_activity_allowed = false, identity_review_required = true, active_case_id = p_case_id, updated_at = now() where user_id = v_case.subject_user_id;
    update public.profile_registration_states set state = 'manual_review', updated_at = now() where user_id = v_case.subject_user_id and state not in ('suspended','rejected');
  elsif p_action = 'restrict_discovery' then
    update public.trust_safety_cases set case_state = 'restricted', updated_at = now() where id = p_case_id;
    update public.profile_safety_controls set control_state = 'restricted', discovery_allowed = false, active_case_id = p_case_id, updated_at = now() where user_id = v_case.subject_user_id;
  elsif p_action = 'restrict_new_contacts' then
    update public.trust_safety_cases set case_state = 'restricted', updated_at = now() where id = p_case_id;
    update public.profile_safety_controls set control_state = 'restricted', new_contacts_allowed = false, active_case_id = p_case_id, updated_at = now() where user_id = v_case.subject_user_id;
  elsif p_action = 'restrict_messaging' then
    update public.trust_safety_cases set case_state = 'restricted', updated_at = now() where id = p_case_id;
    update public.profile_safety_controls set control_state = 'restricted', messaging_allowed = false, active_case_id = p_case_id, updated_at = now() where user_id = v_case.subject_user_id;
  elsif p_action = 'suspend_profile' then
    update public.trust_safety_cases set case_state = 'suspended', updated_at = now() where id = p_case_id;
    update public.profile_safety_controls set control_state = 'suspended', discovery_allowed = false, new_contacts_allowed = false, messaging_allowed = false, public_activity_allowed = false, active_case_id = p_case_id, updated_at = now() where user_id = v_case.subject_user_id;
    update public.profiles set publication_state = 'suspended', profile_published_at = null where id = v_case.subject_user_id;
    update public.user_privacy_settings set profile_visibility = 'private', discoverability_enabled = false, messaging_policy = 'nobody', updated_at = now() where user_id = v_case.subject_user_id;
    update public.profile_registration_states set state = 'suspended', updated_at = now() where user_id = v_case.subject_user_id;
  elsif p_action = 'restore_profile' then
    select details into v_previous_suspend from public.trust_safety_actions where case_id = p_case_id and action_type = 'suspend_profile' order by created_at desc limit 1;
    update public.trust_safety_cases set case_state = 'assessing', updated_at = now() where id = p_case_id;
    update public.profile_safety_controls set control_state = 'monitoring', discovery_allowed = true, new_contacts_allowed = true, messaging_allowed = true, public_activity_allowed = true, identity_review_required = false, active_case_id = p_case_id, updated_at = now() where user_id = v_case.subject_user_id;
    update public.profiles set publication_state = coalesce(v_previous_suspend ->> 'previous_profile_state', 'draft') where id = v_case.subject_user_id;
    update public.user_privacy_settings set profile_visibility = coalesce(v_previous_suspend #>> '{previous_privacy,profile_visibility}', 'private'), discoverability_enabled = coalesce((v_previous_suspend #>> '{previous_privacy,discoverability_enabled}')::boolean, false), messaging_policy = coalesce(v_previous_suspend #>> '{previous_privacy,messaging_policy}', 'nobody'), updated_at = now() where user_id = v_case.subject_user_id;
    update public.profile_registration_states set state = coalesce(v_previous_suspend ->> 'previous_registration_state', 'profile_completion_required'), updated_at = now() where user_id = v_case.subject_user_id and state = 'suspended';
  elsif p_action = 'close_no_action' then
    update public.trust_safety_cases set case_state = 'resolved_no_action', resolved_at = now(), resolved_by = v_actor_id, updated_at = now() where id = p_case_id;
    update public.profile_safety_controls set control_state = 'active', active_case_id = null, identity_review_required = false, updated_at = now() where user_id = v_case.subject_user_id and control_state <> 'suspended';
  end if;
  return p_action;
end;
$$;

create or replace function public.pantavion_get_trust_safety_dossier(
  p_case_id uuid,
  p_scope text,
  p_purpose text
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor_id uuid := auth.uid();
  v_case public.trust_safety_cases%rowtype;
  v_purpose text := btrim(coalesce(p_purpose, ''));
  v_result jsonb;
begin
  if v_actor_id is null or not public.pantavion_is_active_trust_safety_operator() or not public.pantavion_has_aal2() then raise exception 'Trust & Safety operator with AAL2 is required'; end if;
  if p_scope not in ('standard', 'identity_review') then raise exception 'Unsupported dossier scope'; end if;
  if char_length(v_purpose) < 10 or char_length(v_purpose) > 2000 then raise exception 'A documented purpose of 10 to 2000 characters is required'; end if;
  select * into v_case from public.trust_safety_cases where id = p_case_id;
  if not found then raise exception 'Safety case is not available'; end if;
  if v_case.sensitivity <> 'standard' and not public.pantavion_is_active_founder() then raise exception 'Founder authorization required for protected cases'; end if;
  if p_scope = 'identity_review' and (not public.pantavion_is_active_founder() or v_case.severity not in ('high','critical') or char_length(v_purpose) < 20) then
    raise exception 'High-severity founder identity review with a detailed purpose is required';
  end if;
  insert into public.trust_safety_access_audit(case_id, subject_user_id, actor_id, access_scope, purpose)
  values(p_case_id, v_case.subject_user_id, v_actor_id, case when p_scope = 'identity_review' then 'identity_review' else 'standard_dossier' end, v_purpose);
  select jsonb_strip_nulls(jsonb_build_object(
    'case', jsonb_build_object('id', v_case.id, 'kind', v_case.case_kind, 'severity', v_case.severity, 'sensitivity', v_case.sensitivity, 'state', v_case.case_state, 'opened_at', v_case.opened_at),
    'public_profile', jsonb_build_object('id', p.id, 'username', p.username, 'display_name', p.display_name, 'avatar_url', p.avatar_url, 'bio', p.bio, 'country', p.country, 'country_code', p.country_code, 'region', p.region, 'city', p.city, 'language', p.language, 'publication_state', p.publication_state),
    'registration', jsonb_build_object('state', rs.state, 'email_confirmed_at', rs.email_confirmed_at, 'profile_completed_at', rs.profile_completed_at, 'declared_age_group', pd.declared_age_group),
    'safety_controls', jsonb_build_object('state', coalesce(sc.control_state, 'active'), 'discovery_allowed', coalesce(sc.discovery_allowed, true), 'new_contacts_allowed', coalesce(sc.new_contacts_allowed, true), 'messaging_allowed', coalesce(sc.messaging_allowed, true), 'public_activity_allowed', coalesce(sc.public_activity_allowed, true), 'identity_review_required', coalesce(sc.identity_review_required, false)),
    'private_profile_summary', jsonb_build_object('email_methods', (select count(*) from public.profile_contact_methods cm where cm.user_id = v_case.subject_user_id and cm.kind = 'email'), 'phone_methods', (select count(*) from public.profile_contact_methods cm where cm.user_id = v_case.subject_user_id and cm.kind = 'phone'), 'address_provided', nullif(btrim(coalesce(pd.address_line1, '')), '') is not null),
    'activity_summary', jsonb_build_object('relationship_count', (select count(*) from public.relationships r where r.requester_id = v_case.subject_user_id or r.addressee_id = v_case.subject_user_id), 'messages_sent_last_30_days', (select count(*) from public.messages m where m.sender_id = v_case.subject_user_id and m.created_at > now() - interval '30 days'), 'no_message_content_exposed', true),
    'signals', coalesce((select jsonb_agg(jsonb_build_object('id', s.id, 'source', s.source, 'kind', s.signal_kind, 'severity', s.severity, 'summary', s.redacted_summary, 'state', s.state, 'created_at', s.created_at) order by s.created_at desc) from public.trust_safety_signals s where s.case_id = v_case.id), '[]'::jsonb),
    'identity_review', case when p_scope = 'identity_review' then jsonb_build_object('legal_first_name', pd.legal_first_name, 'legal_last_name', pd.legal_last_name, 'country_code', pd.country_code, 'contact_values_exposed', false, 'address_values_exposed', false) else null end
  )) into v_result
  from public.profiles p
  left join public.profile_registration_states rs on rs.user_id = p.id
  left join public.profile_private_details pd on pd.user_id = p.id
  left join public.profile_safety_controls sc on sc.user_id = p.id
  where p.id = v_case.subject_user_id;
  return coalesce(v_result, '{}'::jsonb);
end;
$$;

create or replace function public.pantavion_submit_trust_safety_appeal(
  p_case_id uuid,
  p_statement text
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor_id uuid := auth.uid();
  v_appeal_id uuid;
  v_statement text := btrim(coalesce(p_statement, ''));
begin
  if v_actor_id is null then raise exception 'authentication required'; end if;
  if char_length(v_statement) < 20 or char_length(v_statement) > 4000 then raise exception 'An appeal of 20 to 4000 characters is required'; end if;
  if not exists(select 1 from public.trust_safety_cases where id = p_case_id and subject_user_id = v_actor_id and case_state in ('verification_requested','restricted','suspended','appealed')) then raise exception 'No appealable safety case is available'; end if;
  insert into public.trust_safety_appeals(case_id, subject_user_id, statement) values(p_case_id, v_actor_id, v_statement) returning id into v_appeal_id;
  update public.trust_safety_cases set case_state = 'appealed', updated_at = now() where id = p_case_id;
  return v_appeal_id;
end;
$$;

create or replace function public.pantavion_search_profiles_for_trust_safety(p_query text)
returns table(id uuid, username text, display_name text, country text, region text, publication_state text)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select p.id, p.username, p.display_name, p.country, p.region, p.publication_state
  from public.profiles p
  where public.pantavion_is_active_trust_safety_operator()
    and public.pantavion_has_aal2()
    and char_length(btrim(coalesce(p_query, ''))) >= 2
    and (coalesce(p.username, '') ilike '%' || btrim(p_query) || '%' or coalesce(p.display_name, '') ilike '%' || btrim(p_query) || '%')
  order by p.updated_at desc
  limit 20;
$$;

revoke all on function public.pantavion_open_trust_safety_case(uuid, text, text, text, text) from public, anon;
revoke all on function public.pantavion_report_profile(uuid, text, text) from public, anon;
revoke all on function public.pantavion_apply_trust_safety_action(uuid, text, text) from public, anon;
revoke all on function public.pantavion_get_trust_safety_dossier(uuid, text, text) from public, anon;
revoke all on function public.pantavion_submit_trust_safety_appeal(uuid, text) from public, anon;
revoke all on function public.pantavion_search_profiles_for_trust_safety(text) from public, anon;
grant execute on function public.pantavion_open_trust_safety_case(uuid, text, text, text, text) to authenticated;
grant execute on function public.pantavion_report_profile(uuid, text, text) to authenticated;
grant execute on function public.pantavion_apply_trust_safety_action(uuid, text, text) to authenticated;
grant execute on function public.pantavion_get_trust_safety_dossier(uuid, text, text) to authenticated;
grant execute on function public.pantavion_submit_trust_safety_appeal(uuid, text) to authenticated;
grant execute on function public.pantavion_search_profiles_for_trust_safety(text) to authenticated;
