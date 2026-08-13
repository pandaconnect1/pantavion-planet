-- Pantavion Identity / Trust / Security Core
-- Foundation only: no biometric template is stored and no liveness provider is implied.

create table if not exists public.user_identity_private (
  user_id uuid primary key references auth.users(id) on delete cascade,
  first_name text not null default '',
  last_name text not null default '',
  birth_date date,
  address_line1 text,
  address_line2 text,
  postal_code text,
  locality text,
  region text,
  country_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_emails (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  email text not null,
  label text not null default 'personal' check (label in ('personal','work','business','recovery','other')),
  is_primary boolean not null default false,
  login_enabled boolean not null default false,
  recovery_enabled boolean not null default false,
  discoverability_enabled boolean not null default false,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_emails_nonempty check (length(btrim(email)) between 3 and 320)
);

create unique index if not exists user_emails_per_user_unique
  on public.user_emails (user_id, lower(btrim(email)));
create unique index if not exists user_emails_one_primary
  on public.user_emails (user_id) where is_primary;
create unique index if not exists user_emails_verified_global_unique
  on public.user_emails (lower(btrim(email))) where verified_at is not null;
create index if not exists user_emails_user_id_idx on public.user_emails (user_id);

create table if not exists public.user_phones (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  phone_e164 text not null,
  label text not null default 'personal' check (label in ('personal','work','business','recovery','other')),
  is_primary boolean not null default false,
  login_enabled boolean not null default false,
  recovery_enabled boolean not null default false,
  discoverability_enabled boolean not null default false,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_phones_e164 check (phone_e164 ~ '^\+[1-9][0-9]{7,14}$')
);

create unique index if not exists user_phones_per_user_unique
  on public.user_phones (user_id, phone_e164);
create unique index if not exists user_phones_one_primary
  on public.user_phones (user_id) where is_primary;
create unique index if not exists user_phones_verified_global_unique
  on public.user_phones (phone_e164) where verified_at is not null;
create index if not exists user_phones_user_id_idx on public.user_phones (user_id);

create table if not exists public.user_identity_security (
  user_id uuid primary key references auth.users(id) on delete cascade,
  account_type text not null default 'personal'
    check (account_type in ('personal','professional','business','public_figure','elite','protected')),
  age_band text not null default 'unknown'
    check (age_band in ('unknown','child','teen','adult','verified_adult')),
  trust_tier text not null default 'unverified'
    check (trust_tier in ('unverified','email_verified','phone_verified','identity_verified','public_figure_verified','protected_verified')),
  security_level text not null default 'standard'
    check (security_level in ('standard','enhanced','maximum')),
  onboarding_mode text not null default 'standard'
    check (onboarding_mode in ('standard','assisted','guardian_assisted')),
  account_state text not null default 'pending_verification'
    check (account_state in ('pending_verification','pending_guardian','pending_review','active','restricted','suspended','blocked')),
  manual_review_required boolean not null default false,
  passkey_required boolean not null default false,
  hardware_key_required boolean not null default false,
  minimum_registered_keys smallint not null default 0 check (minimum_registered_keys between 0 and 4),
  sensitive_change_step_up_required boolean not null default true,
  last_security_review_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint protected_security_floor check (
    account_type <> 'protected'
    or (
      security_level = 'maximum'
      and manual_review_required
      and passkey_required
      and hardware_key_required
      and minimum_registered_keys >= 2
      and sensitive_change_step_up_required
    )
  )
);

create table if not exists public.identity_verifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  verification_type text not null
    check (verification_type in ('email','phone','profile_photo','liveness','identity_document','public_figure','organization','protected_account')),
  status text not null default 'pending'
    check (status in ('pending','provider_required','in_review','verified','rejected','expired','revoked')),
  provider text,
  provider_reference text,
  evidence_metadata jsonb not null default '{}'::jsonb,
  reviewed_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists identity_verifications_user_status_idx
  on public.identity_verifications (user_id, status, verification_type);

create table if not exists public.registration_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  reason text not null,
  priority text not null default 'normal' check (priority in ('normal','high','critical')),
  status text not null default 'pending' check (status in ('pending','in_review','approved','rejected','escalated')),
  assigned_to uuid references auth.users(id) on delete set null,
  decision_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  decided_at timestamptz
);
create index if not exists registration_reviews_queue_idx
  on public.registration_reviews (status, priority, created_at);

-- Add sortable public-safe geography fields. Exact home address remains private.
alter table public.profiles add column if not exists first_name text;
alter table public.profiles add column if not exists last_name text;
alter table public.profiles add column if not exists continent_code text;
alter table public.profiles add column if not exists country_code text;
alter table public.profiles add column if not exists region text;
alter table public.profiles add column if not exists city text;
alter table public.profiles add column if not exists profile_photo_status text not null default 'missing'
  check (profile_photo_status in ('missing','pending','verified','rejected'));

create index if not exists profiles_geo_admin_idx
  on public.profiles (continent_code, country_code, region, city, last_name, first_name);
create index if not exists profiles_created_at_idx on public.profiles (created_at desc);

-- Private/sensitive tables are RLS-protected. Service-role/admin server APIs bypass RLS;
-- users may only read or maintain their own permitted records.
alter table public.user_identity_private enable row level security;
alter table public.user_emails enable row level security;
alter table public.user_phones enable row level security;
alter table public.user_identity_security enable row level security;
alter table public.identity_verifications enable row level security;
alter table public.registration_reviews enable row level security;

create policy "identity_private_owner_select" on public.user_identity_private
for select using (auth.uid() = user_id);
create policy "identity_private_owner_update" on public.user_identity_private
for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "user_emails_owner_select" on public.user_emails
for select using (auth.uid() = user_id);
create policy "user_emails_owner_insert" on public.user_emails
for insert with check (auth.uid() = user_id and not is_primary and not login_enabled and not recovery_enabled and verified_at is null);
create policy "user_emails_owner_update" on public.user_emails
for update using (auth.uid() = user_id)
with check (auth.uid() = user_id and verified_at is null and not is_primary and not login_enabled and not recovery_enabled);
create policy "user_emails_owner_delete" on public.user_emails
for delete using (auth.uid() = user_id and not is_primary);

create policy "user_phones_owner_select" on public.user_phones
for select using (auth.uid() = user_id);
create policy "user_phones_owner_insert" on public.user_phones
for insert with check (auth.uid() = user_id and not is_primary and not login_enabled and not recovery_enabled and verified_at is null);
create policy "user_phones_owner_update" on public.user_phones
for update using (auth.uid() = user_id)
with check (auth.uid() = user_id and verified_at is null and not is_primary and not login_enabled and not recovery_enabled);
create policy "user_phones_owner_delete" on public.user_phones
for delete using (auth.uid() = user_id and not is_primary);

create policy "identity_security_owner_select" on public.user_identity_security
for select using (auth.uid() = user_id);

create policy "identity_verifications_owner_select" on public.identity_verifications
for select using (auth.uid() = user_id);

-- No client policy is created for registration_reviews. It is admin/service-only.

-- Keep timestamps consistent.
drop trigger if exists user_identity_private_set_updated_at on public.user_identity_private;
create trigger user_identity_private_set_updated_at before update on public.user_identity_private
for each row execute procedure public.set_updated_at();
drop trigger if exists user_emails_set_updated_at on public.user_emails;
create trigger user_emails_set_updated_at before update on public.user_emails
for each row execute procedure public.set_updated_at();
drop trigger if exists user_phones_set_updated_at on public.user_phones;
create trigger user_phones_set_updated_at before update on public.user_phones
for each row execute procedure public.set_updated_at();
drop trigger if exists user_identity_security_set_updated_at on public.user_identity_security;
create trigger user_identity_security_set_updated_at before update on public.user_identity_security
for each row execute procedure public.set_updated_at();
drop trigger if exists identity_verifications_set_updated_at on public.identity_verifications;
create trigger identity_verifications_set_updated_at before update on public.identity_verifications
for each row execute procedure public.set_updated_at();
drop trigger if exists registration_reviews_set_updated_at on public.registration_reviews;
create trigger registration_reviews_set_updated_at before update on public.registration_reviews
for each row execute procedure public.set_updated_at();

-- Replace the signup trigger so one canonical auth user seeds all identity layers.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_birth_date date;
  v_age integer;
  v_age_band text := 'unknown';
  v_account_state text := 'pending_verification';
begin
  begin
    v_birth_date := nullif(new.raw_user_meta_data ->> 'birth_date', '')::date;
  exception when others then
    v_birth_date := null;
  end;

  if v_birth_date is not null then
    v_age := extract(year from age(current_date, v_birth_date));
    if v_age < 13 then
      v_age_band := 'child';
      v_account_state := 'pending_guardian';
    elsif v_age < 18 then
      v_age_band := 'teen';
      v_account_state := 'pending_guardian';
    else
      v_age_band := 'adult';
    end if;
  end if;

  insert into public.profiles (
    id, username, display_name, first_name, last_name, country, country_code,
    continent_code, region, city, language
  ) values (
    new.id,
    nullif(lower(new.raw_user_meta_data ->> 'username'), ''),
    coalesce(nullif(new.raw_user_meta_data ->> 'display_name', ''), nullif(new.raw_user_meta_data ->> 'username', '')),
    nullif(new.raw_user_meta_data ->> 'first_name', ''),
    nullif(new.raw_user_meta_data ->> 'last_name', ''),
    nullif(new.raw_user_meta_data ->> 'country', ''),
    nullif(upper(new.raw_user_meta_data ->> 'country_code'), ''),
    nullif(upper(new.raw_user_meta_data ->> 'continent_code'), ''),
    nullif(new.raw_user_meta_data ->> 'region', ''),
    nullif(new.raw_user_meta_data ->> 'city', ''),
    coalesce(nullif(new.raw_user_meta_data ->> 'language', ''), 'el')
  ) on conflict (id) do nothing;

  insert into public.user_identity_private (
    user_id, first_name, last_name, birth_date, locality, region, country_code
  ) values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'first_name', ''),
    coalesce(new.raw_user_meta_data ->> 'last_name', ''),
    v_birth_date,
    nullif(new.raw_user_meta_data ->> 'city', ''),
    nullif(new.raw_user_meta_data ->> 'region', ''),
    nullif(upper(new.raw_user_meta_data ->> 'country_code'), '')
  ) on conflict (user_id) do nothing;

  insert into public.user_identity_security (user_id, age_band, account_state, onboarding_mode)
  values (
    new.id,
    v_age_band,
    v_account_state,
    case when coalesce(new.raw_user_meta_data ->> 'onboarding_mode','') in ('assisted','guardian_assisted')
      then new.raw_user_meta_data ->> 'onboarding_mode' else 'standard' end
  ) on conflict (user_id) do nothing;

  if new.email is not null then
    insert into public.user_emails (
      user_id, email, is_primary, login_enabled, recovery_enabled, verified_at
    ) values (
      new.id, new.email, true, true, true, new.email_confirmed_at
    ) on conflict do nothing;
  end if;

  if new.phone is not null and new.phone ~ '^\+[1-9][0-9]{7,14}$' then
    insert into public.user_phones (
      user_id, phone_e164, is_primary, login_enabled, recovery_enabled, verified_at
    ) values (
      new.id, new.phone, true, true, true, new.phone_confirmed_at
    ) on conflict do nothing;
  end if;

  insert into public.user_privacy_settings (user_id)
  values (new.id) on conflict (user_id) do nothing;

  return new;
end;
$$;

comment on table public.user_identity_private is 'Private identity data; never used as a public people directory.';
comment on table public.user_identity_security is 'Server-controlled account, age, trust and minimum-security policy state.';
comment on table public.identity_verifications is 'Verification workflow metadata only. Do not store raw biometric templates here.';
comment on table public.registration_reviews is 'Admin-only review queue for high-risk, protected or exceptional registrations.';
