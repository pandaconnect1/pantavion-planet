-- Pantavion identity registration core.
-- Public discovery data stays in public.profiles. Legal identity, address and
-- contact methods stay in owner-only tables protected by RLS.

alter table public.profiles
  add column if not exists country_code text,
  add column if not exists region text,
  add column if not exists city text;

create table if not exists public.profile_private_details (
  user_id uuid primary key references auth.users(id) on delete cascade,
  legal_first_name text not null default '',
  legal_last_name text not null default '',
  declared_age_group text not null default 'unconfirmed'
    check (declared_age_group in ('unconfirmed', 'minor', 'adult')),
  country_code text,
  address_line1 text,
  address_line2 text,
  postal_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (country_code is null or country_code ~ '^[A-Z]{2}$')
);

create table if not exists public.profile_contact_methods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('email', 'phone')),
  value text not null check (char_length(btrim(value)) between 3 and 320),
  normalized_value text not null check (char_length(btrim(normalized_value)) between 3 and 320),
  label text,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, kind, normalized_value)
);

create table if not exists public.profile_registration_states (
  user_id uuid primary key references auth.users(id) on delete cascade,
  state text not null default 'email_confirmation_pending'
    check (state in (
      'email_confirmation_pending',
      'profile_completion_required',
      'active',
      'minor_protected',
      'manual_review',
      'rejected',
      'suspended'
    )),
  email_confirmed_at timestamptz,
  profile_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profile_private_details enable row level security;
alter table public.profile_contact_methods enable row level security;
alter table public.profile_registration_states enable row level security;

revoke all on table public.profile_private_details from anon;
revoke all on table public.profile_contact_methods from anon;
revoke all on table public.profile_registration_states from anon;

grant select, insert, update, delete on table public.profile_private_details to authenticated;
grant select, insert, update, delete on table public.profile_contact_methods to authenticated;
grant select on table public.profile_registration_states to authenticated;

drop policy if exists profile_private_details_owner on public.profile_private_details;
create policy profile_private_details_owner
  on public.profile_private_details
  for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists profile_contact_methods_owner on public.profile_contact_methods;
create policy profile_contact_methods_owner
  on public.profile_contact_methods
  for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists profile_registration_states_owner_read on public.profile_registration_states;
create policy profile_registration_states_owner_read
  on public.profile_registration_states
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create or replace function public.pantavion_touch_identity_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function public.pantavion_touch_identity_updated_at() from public;

drop trigger if exists pantavion_touch_profile_private_details on public.profile_private_details;
create trigger pantavion_touch_profile_private_details
  before update on public.profile_private_details
  for each row
  execute function public.pantavion_touch_identity_updated_at();

drop trigger if exists pantavion_touch_profile_contact_methods on public.profile_contact_methods;
create trigger pantavion_touch_profile_contact_methods
  before update on public.profile_contact_methods
  for each row
  execute function public.pantavion_touch_identity_updated_at();

drop trigger if exists pantavion_touch_profile_registration_states on public.profile_registration_states;
create trigger pantavion_touch_profile_registration_states
  before update on public.profile_registration_states
  for each row
  execute function public.pantavion_touch_identity_updated_at();

create or replace function public.pantavion_create_identity_for_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_first_name text := left(coalesce(new.raw_user_meta_data ->> 'first_name', ''), 80);
  v_last_name text := left(coalesce(new.raw_user_meta_data ->> 'last_name', ''), 80);
  v_display_name text;
  v_country text := left(coalesce(new.raw_user_meta_data ->> 'country', ''), 120);
  v_language text := left(coalesce(new.raw_user_meta_data ->> 'language', 'el'), 16);
  v_age_group text := case lower(coalesce(new.raw_user_meta_data ->> 'declared_age_group', 'unconfirmed'))
    when 'minor' then 'minor'
    when 'adult' then 'adult'
    else 'unconfirmed'
  end;
  v_consent_version text := left(coalesce(new.raw_user_meta_data ->> 'consent_version', '2026-08-13'), 40);
begin
  v_display_name := nullif(
    btrim(
      coalesce(
        nullif(left(new.raw_user_meta_data ->> 'display_name', 120), ''),
        concat_ws(' ', nullif(btrim(v_first_name), ''), nullif(btrim(v_last_name), ''))
      )
    ),
    ''
  );

  insert into public.profiles (id, display_name, country, language)
  values (new.id, v_display_name, nullif(btrim(v_country), ''), coalesce(nullif(btrim(v_language), ''), 'el'))
  on conflict (id) do nothing;

  insert into public.user_privacy_settings (
    user_id,
    profile_visibility,
    discoverability_enabled,
    contact_import_enabled,
    messaging_policy,
    translation_enabled
  )
  values (new.id, 'private', false, false, 'nobody', true)
  on conflict (user_id) do nothing;

  insert into public.profile_private_details (
    user_id,
    legal_first_name,
    legal_last_name,
    declared_age_group
  )
  values (new.id, btrim(v_first_name), btrim(v_last_name), v_age_group)
  on conflict (user_id) do nothing;

  insert into public.profile_registration_states (user_id, state, email_confirmed_at)
  values (
    new.id,
    case
      when new.email_confirmed_at is null then 'email_confirmation_pending'
      else 'profile_completion_required'
    end,
    new.email_confirmed_at
  )
  on conflict (user_id) do nothing;

  if coalesce(new.raw_user_meta_data ->> 'terms_accepted', 'false') = 'true' then
    insert into public.consent_records (
      user_id, purpose, status, source, granted_at, metadata
    )
    values (
      new.id,
      'terms_of_service',
      'granted',
      'registration',
      now(),
      jsonb_build_object('version', v_consent_version)
    );
  end if;

  if coalesce(new.raw_user_meta_data ->> 'privacy_accepted', 'false') = 'true' then
    insert into public.consent_records (
      user_id, purpose, status, source, granted_at, metadata
    )
    values (
      new.id,
      'privacy_policy',
      'granted',
      'registration',
      now(),
      jsonb_build_object('version', v_consent_version)
    );
  end if;

  return new;
end;
$$;

revoke all on function public.pantavion_create_identity_for_new_auth_user() from public;

drop trigger if exists pantavion_create_identity_for_new_auth_user on auth.users;
create trigger pantavion_create_identity_for_new_auth_user
  after insert on auth.users
  for each row
  execute function public.pantavion_create_identity_for_new_auth_user();

create or replace function public.pantavion_mark_identity_email_confirmed()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if old.email_confirmed_at is null and new.email_confirmed_at is not null then
    update public.profile_registration_states
    set state = 'profile_completion_required',
        email_confirmed_at = new.email_confirmed_at
    where user_id = new.id
      and state = 'email_confirmation_pending';
  end if;

  return new;
end;
$$;

revoke all on function public.pantavion_mark_identity_email_confirmed() from public;

drop trigger if exists pantavion_mark_identity_email_confirmed on auth.users;
create trigger pantavion_mark_identity_email_confirmed
  after update of email_confirmed_at on auth.users
  for each row
  execute function public.pantavion_mark_identity_email_confirmed();

create or replace function public.pantavion_complete_own_profile()
returns table (registration_state text, protected_by_default boolean)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_first_name text;
  v_last_name text;
  v_country_code text;
  v_age_group text;
  v_next_state text;
begin
  if v_user_id is null then
    raise exception 'pantavion_identity_not_authenticated' using errcode = '28000';
  end if;

  select legal_first_name, legal_last_name, country_code, declared_age_group
  into v_first_name, v_last_name, v_country_code, v_age_group
  from public.profile_private_details
  where user_id = v_user_id;

  if not found
    or nullif(btrim(v_first_name), '') is null
    or nullif(btrim(v_last_name), '') is null
    or v_country_code is null
    or not exists (
      select 1
      from public.profiles
      where id = v_user_id
        and nullif(btrim(display_name), '') is not null
    ) then
    raise exception 'pantavion_identity_profile_incomplete' using errcode = '22023';
  end if;

  v_next_state := case
    when v_age_group = 'minor' then 'minor_protected'
    else 'active'
  end;

  update public.profile_registration_states
  set state = v_next_state,
      profile_completed_at = coalesce(profile_completed_at, now())
  where user_id = v_user_id;

  if v_age_group = 'minor' then
    update public.user_privacy_settings
    set profile_visibility = 'private',
        discoverability_enabled = false,
        contact_import_enabled = false,
        messaging_policy = 'nobody'
    where user_id = v_user_id;
  end if;

  return query select v_next_state, v_age_group = 'minor';
end;
$$;

revoke all on function public.pantavion_complete_own_profile() from public;
grant execute on function public.pantavion_complete_own_profile() to authenticated;
