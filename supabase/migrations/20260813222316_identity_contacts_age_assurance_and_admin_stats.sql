alter table public.profile_contact_methods
  add column if not exists verification_state text not null default 'unverified'
    check (verification_state in ('unverified','pending','verified','rejected','revoked')),
  add column if not exists verified_at timestamptz,
  add column if not exists recovery_allowed boolean not null default false,
  add column if not exists discoverability_allowed boolean not null default false,
  add column if not exists public_visibility boolean not null default false;

create unique index if not exists profile_contact_methods_unique_normalized
  on public.profile_contact_methods(user_id, kind, normalized_value);
create unique index if not exists profile_contact_methods_one_primary_per_kind
  on public.profile_contact_methods(user_id, kind) where is_primary;

alter table public.profile_private_details
  add column if not exists date_of_birth date,
  add column if not exists age_band text not null default 'unknown'
    check (age_band in ('unknown','child','teen','adult','verified_adult')),
  add column if not exists age_assurance_state text not null default 'unverified'
    check (age_assurance_state in ('unverified','pending','verified','rejected','expired')),
  add column if not exists guardian_consent_state text not null default 'not_applicable'
    check (guardian_consent_state in ('not_applicable','required','pending','verified','revoked'));

create table if not exists public.profile_age_assurance (
  user_id uuid primary key references auth.users(id) on delete cascade,
  jurisdiction_country_code text,
  assurance_method text not null default 'none'
    check (assurance_method in ('none','self_declaration','document','liveness','trusted_provider','guardian','manual_review')),
  assurance_state text not null default 'unverified'
    check (assurance_state in ('unverified','pending','verified','rejected','expired')),
  assessed_age_band text not null default 'unknown'
    check (assessed_age_band in ('unknown','child','teen','adult','verified_adult')),
  guardian_required boolean not null default false,
  guardian_verified boolean not null default false,
  evidence_reference text,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profile_age_assurance enable row level security;
drop policy if exists profile_age_assurance_owner_read on public.profile_age_assurance;
create policy profile_age_assurance_owner_read on public.profile_age_assurance
for select using (auth.uid() = user_id);

create index if not exists profiles_geo_sort_idx
  on public.profiles(country_code, region, city, display_name);
create index if not exists profile_private_age_idx
  on public.profile_private_details(age_band, age_assurance_state, country_code);
create index if not exists profile_security_class_idx
  on public.profile_security_posture(account_class, security_level);

create or replace function public.pantavion_public_registration_status()
returns table(public_registration_enabled boolean, required_launch_state text, reason text)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select g.public_registration_enabled, g.required_launch_state, g.reason
  from public.public_registration_gate g
  where g.singleton = true;
$$;
revoke all on function public.pantavion_public_registration_status() from public;
grant execute on function public.pantavion_public_registration_status() to anon, authenticated;

create or replace function public.pantavion_registration_stats(
  p_country_code text default null,
  p_region text default null,
  p_city text default null
)
returns table(
  country_code text,
  region text,
  city text,
  account_class text,
  age_band text,
  registration_state text,
  exact_count bigint,
  public_count bigint,
  low_count_suppressed boolean
)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
begin
  if not public.pantavion_is_active_founder() then
    raise exception 'forbidden';
  end if;

  return query
  select
    p.country_code,
    p.region,
    p.city,
    coalesce(sp.account_class, 'personal')::text,
    coalesce(pd.age_band, 'unknown')::text,
    coalesce(rs.state, 'unknown')::text,
    count(*)::bigint as exact_count,
    case when count(*) < 5 then 0 else count(*) end::bigint as public_count,
    (count(*) < 5) as low_count_suppressed
  from public.profiles p
  left join public.profile_security_posture sp on sp.user_id = p.id
  left join public.profile_private_details pd on pd.user_id = p.id
  left join public.profile_registration_states rs on rs.user_id = p.id
  where (p_country_code is null or p.country_code = upper(p_country_code))
    and (p_region is null or p.region = p_region)
    and (p_city is null or p.city = p_city)
  group by p.country_code, p.region, p.city, coalesce(sp.account_class, 'personal'), coalesce(pd.age_band, 'unknown'), coalesce(rs.state, 'unknown')
  order by p.country_code nulls last, p.region nulls last, p.city nulls last, account_class, age_band, registration_state;
end;
$$;
revoke all on function public.pantavion_registration_stats(text,text,text) from public;
grant execute on function public.pantavion_registration_stats(text,text,text) to authenticated;
