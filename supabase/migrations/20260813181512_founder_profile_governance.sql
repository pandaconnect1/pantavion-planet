alter table public.profiles
  add column if not exists publication_state text not null default 'draft',
  add column if not exists profile_published_at timestamptz;
alter table public.profiles
  add constraint profiles_publication_state_check
  check (publication_state in ('draft', 'submitted', 'under_review', 'published', 'rejected', 'suspended'));
create table if not exists public.pantavion_operator_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('founder', 'profile_reviewer', 'safety_reviewer')),
  active boolean not null default true,
  granted_at timestamptz not null default now(),
  granted_by uuid references auth.users(id) on delete set null,
  note text
);
create table if not exists public.profile_review_cases (
  id uuid primary key default gen_random_uuid(),
  subject_user_id uuid not null references auth.users(id) on delete cascade,
  case_state text not null default 'under_review' check (case_state in ('under_review', 'published', 'rejected', 'withdrawn')),
  public_snapshot jsonb not null default '{}'::jsonb,
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id) on delete set null,
  decision_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists profile_review_cases_one_open_case on public.profile_review_cases (subject_user_id) where case_state = 'under_review';
create table if not exists public.profile_governance_audit (
  id uuid primary key default gen_random_uuid(),
  subject_user_id uuid not null references auth.users(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  action text not null check (action in ('submitted', 'published', 'rejected', 'suspended')),
  case_id uuid references public.profile_review_cases(id) on delete set null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
alter table public.pantavion_operator_roles enable row level security;
alter table public.profile_review_cases enable row level security;
alter table public.profile_governance_audit enable row level security;
revoke all on table public.pantavion_operator_roles from anon;
revoke insert, update, delete on table public.pantavion_operator_roles from authenticated;
grant select on table public.pantavion_operator_roles to authenticated;
revoke all on table public.profile_review_cases from anon;
revoke insert, update, delete on table public.profile_review_cases from authenticated;
grant select on table public.profile_review_cases to authenticated;
revoke all on table public.profile_governance_audit from anon;
revoke insert, update, delete on table public.profile_governance_audit from authenticated;
grant select on table public.profile_governance_audit to authenticated;
create or replace function public.pantavion_is_active_founder()
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select auth.uid() is not null and exists (
    select 1 from public.pantavion_operator_roles
    where user_id = auth.uid() and role = 'founder' and active = true
  );
$$;
revoke all on function public.pantavion_is_active_founder() from public, anon;
grant execute on function public.pantavion_is_active_founder() to authenticated;
create policy operator_roles_self_read on public.pantavion_operator_roles for select to authenticated using ((select auth.uid()) = user_id);
create policy profile_review_cases_owner_read on public.profile_review_cases for select to authenticated using ((select auth.uid()) = subject_user_id);
create policy profile_review_cases_founder_read on public.profile_review_cases for select to authenticated using ((select public.pantavion_is_active_founder()) and coalesce((select auth.jwt() ->> 'aal'), 'aal1') = 'aal2');
create policy profile_governance_audit_owner_read on public.profile_governance_audit for select to authenticated using ((select auth.uid()) = subject_user_id);
create policy profile_governance_audit_founder_read on public.profile_governance_audit for select to authenticated using ((select public.pantavion_is_active_founder()) and coalesce((select auth.jwt() ->> 'aal'), 'aal1') = 'aal2');
drop policy if exists "profiles self insert" on public.profiles;
drop policy if exists "profiles self update" on public.profiles;
drop policy if exists profiles_privacy_read on public.profiles;
create policy profiles_owner_insert_draft on public.profiles for insert to authenticated with check ((select auth.uid()) = id and publication_state = 'draft');
create policy profiles_owner_stage_update on public.profiles for update to authenticated using ((select auth.uid()) = id and publication_state in ('draft', 'rejected')) with check ((select auth.uid()) = id and publication_state in ('draft', 'submitted', 'rejected'));
create policy profiles_privacy_read on public.profiles for select to authenticated using ((select auth.uid()) = id or (publication_state = 'published' and exists (select 1 from public.user_privacy_settings ps where ps.user_id = profiles.id and ps.profile_visibility = 'public' and ps.discoverability_enabled)));
create or replace function public.pantavion_open_profile_review_case()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if new.publication_state = 'submitted' and old.publication_state is distinct from 'submitted' then
    insert into public.profile_review_cases (subject_user_id, public_snapshot)
    values (new.id, jsonb_build_object('username', new.username, 'display_name', new.display_name, 'avatar_url', new.avatar_url, 'bio', new.bio, 'country', new.country, 'country_code', new.country_code, 'region', new.region, 'city', new.city, 'language', new.language))
    on conflict (subject_user_id) where case_state = 'under_review'
    do update set public_snapshot = excluded.public_snapshot, submitted_at = now(), updated_at = now();
    update public.profiles set publication_state = 'under_review' where id = new.id;
    insert into public.profile_governance_audit (subject_user_id, actor_id, action) values (new.id, new.id, 'submitted');
  end if;
  return new;
end;
$$;
revoke all on function public.pantavion_open_profile_review_case() from public, anon, authenticated;
drop trigger if exists pantavion_open_profile_review_case on public.profiles;
create trigger pantavion_open_profile_review_case after update of publication_state on public.profiles for each row execute function public.pantavion_open_profile_review_case();
create or replace function public.pantavion_decide_profile_review(p_case_id uuid, p_decision text, p_note text default null)
returns text language plpgsql security definer set search_path = public, pg_temp as $$
declare v_actor_id uuid := auth.uid(); v_case public.profile_review_cases%rowtype; v_result_state text;
begin
  if v_actor_id is null or not public.pantavion_is_active_founder() then raise exception 'Founder authorization required'; end if;
  if coalesce(auth.jwt() ->> 'aal', 'aal1') <> 'aal2' then raise exception 'AAL2 multi-factor authentication required'; end if;
  if p_decision not in ('publish', 'reject') then raise exception 'Unsupported profile review decision'; end if;
  select * into v_case from public.profile_review_cases where id = p_case_id and case_state = 'under_review' for update;
  if not found then raise exception 'Profile review case is not available'; end if;
  v_result_state := case when p_decision = 'publish' then 'published' else 'rejected' end;
  update public.profile_review_cases set case_state = v_result_state, reviewed_by = v_actor_id, reviewed_at = now(), decision_note = nullif(btrim(coalesce(p_note, '')), ''), updated_at = now() where id = v_case.id;
  update public.profiles set publication_state = v_result_state, profile_published_at = case when v_result_state = 'published' then now() else null end where id = v_case.subject_user_id;
  insert into public.profile_governance_audit (subject_user_id, actor_id, action, case_id, details) values (v_case.subject_user_id, v_actor_id, v_result_state, v_case.id, jsonb_build_object('note_present', nullif(btrim(coalesce(p_note, '')), '') is not null));
  return v_result_state;
end;
$$;
revoke all on function public.pantavion_decide_profile_review(uuid, text, text) from public, anon;
grant execute on function public.pantavion_decide_profile_review(uuid, text, text) to authenticated;
