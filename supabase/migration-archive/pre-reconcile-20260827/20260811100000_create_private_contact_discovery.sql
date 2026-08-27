-- Pantavion Find My People: privacy-safe contact discovery.
-- Raw emails/phones are never exposed through discovery APIs.
-- Verified auth identifiers are stored only as hashes in a table with no direct user access.

create table if not exists public.user_discovery_identifiers (
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('email','phone')),
  identifier_hash text not null,
  verified_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, kind),
  unique(kind, identifier_hash)
);

create index if not exists user_discovery_identifiers_lookup_idx
  on public.user_discovery_identifiers(kind, identifier_hash);

alter table public.user_discovery_identifiers enable row level security;
-- Intentionally no direct SELECT/INSERT/UPDATE/DELETE policies for authenticated users.

create or replace function public.pantavion_normalize_email(p_email text)
returns text
language sql
immutable
set search_path = public, pg_temp
as $$
  select lower(btrim(coalesce(p_email, '')))
$$;

create or replace function public.pantavion_normalize_phone(p_phone text)
returns text
language sql
immutable
set search_path = public, pg_temp
as $$
  select regexp_replace(coalesce(p_phone, ''), '[^0-9+]', '', 'g')
$$;

create or replace function public.pantavion_identifier_hash(p_kind text, p_value text)
returns text
language sql
immutable
set search_path = public, pg_temp
as $$
  select encode(
    digest(
      case
        when p_kind = 'email' then public.pantavion_normalize_email(p_value)
        when p_kind = 'phone' then public.pantavion_normalize_phone(p_value)
        else ''
      end,
      'sha256'
    ),
    'hex'
  )
$$;

create or replace function public.pantavion_sync_auth_discovery_identifiers()
returns trigger
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
begin
  if new.email is not null and new.email_confirmed_at is not null then
    insert into public.user_discovery_identifiers(user_id, kind, identifier_hash, verified_at, updated_at)
    values (new.id, 'email', public.pantavion_identifier_hash('email', new.email), new.email_confirmed_at, now())
    on conflict (user_id, kind) do update
      set identifier_hash = excluded.identifier_hash,
          verified_at = excluded.verified_at,
          updated_at = now();
  else
    delete from public.user_discovery_identifiers where user_id = new.id and kind = 'email';
  end if;

  if new.phone is not null and new.phone_confirmed_at is not null then
    insert into public.user_discovery_identifiers(user_id, kind, identifier_hash, verified_at, updated_at)
    values (new.id, 'phone', public.pantavion_identifier_hash('phone', new.phone), new.phone_confirmed_at, now())
    on conflict (user_id, kind) do update
      set identifier_hash = excluded.identifier_hash,
          verified_at = excluded.verified_at,
          updated_at = now();
  else
    delete from public.user_discovery_identifiers where user_id = new.id and kind = 'phone';
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_sync_discovery_identifiers on auth.users;
create trigger on_auth_user_sync_discovery_identifiers
after insert or update of email, phone, email_confirmed_at, phone_confirmed_at on auth.users
for each row execute function public.pantavion_sync_auth_discovery_identifiers();

insert into public.user_discovery_identifiers(user_id, kind, identifier_hash, verified_at)
select id, 'email', public.pantavion_identifier_hash('email', email), email_confirmed_at
from auth.users
where email is not null and email_confirmed_at is not null
on conflict (user_id, kind) do update
set identifier_hash = excluded.identifier_hash, verified_at = excluded.verified_at, updated_at = now();

insert into public.user_discovery_identifiers(user_id, kind, identifier_hash, verified_at)
select id, 'phone', public.pantavion_identifier_hash('phone', phone), phone_confirmed_at
from auth.users
where phone is not null and phone_confirmed_at is not null
on conflict (user_id, kind) do update
set identifier_hash = excluded.identifier_hash, verified_at = excluded.verified_at, updated_at = now();

create or replace function public.pantavion_find_people_from_my_contacts()
returns table (
  contact_id uuid,
  user_id uuid,
  match_kind text,
  username text,
  display_name text,
  avatar_url text,
  bio text,
  country text,
  language text
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  actor uuid := auth.uid();
begin
  if actor is null then
    raise exception 'authentication required';
  end if;

  if not exists (
    select 1 from public.consent_records cr
    where cr.user_id = actor
      and cr.purpose = 'contact_discovery'
      and cr.status = 'granted'
      and cr.revoked_at is null
  ) then
    raise exception 'contact discovery consent required';
  end if;

  update public.contacts c
  set linked_user_id = matched.user_id,
      updated_at = now()
  from (
    select distinct on (c2.id)
      c2.id as contact_id,
      udi.user_id
    from public.contacts c2
    join public.user_discovery_identifiers udi
      on (
        (c2.email is not null and udi.kind = 'email' and udi.identifier_hash = public.pantavion_identifier_hash('email', c2.email))
        or
        (c2.phone is not null and udi.kind = 'phone' and udi.identifier_hash = public.pantavion_identifier_hash('phone', c2.phone))
      )
    join public.user_privacy_settings ps on ps.user_id = udi.user_id
    where c2.owner_id = actor
      and udi.user_id <> actor
      and ps.discoverability_enabled = true
      and ps.profile_visibility <> 'private'
      and not public.pantavion_has_block_between(actor, udi.user_id)
    order by c2.id, case when udi.kind = 'phone' then 0 else 1 end
  ) matched
  where c.id = matched.contact_id and c.owner_id = actor;

  return query
  select distinct on (c.id)
    c.id,
    udi.user_id,
    udi.kind,
    p.username,
    p.display_name,
    p.avatar_url,
    p.bio,
    p.country,
    p.language
  from public.contacts c
  join public.user_discovery_identifiers udi
    on (
      (c.email is not null and udi.kind = 'email' and udi.identifier_hash = public.pantavion_identifier_hash('email', c.email))
      or
      (c.phone is not null and udi.kind = 'phone' and udi.identifier_hash = public.pantavion_identifier_hash('phone', c.phone))
    )
  join public.user_privacy_settings ps on ps.user_id = udi.user_id
  join public.profiles p on p.id = udi.user_id
  where c.owner_id = actor
    and udi.user_id <> actor
    and ps.discoverability_enabled = true
    and ps.profile_visibility <> 'private'
    and not public.pantavion_has_block_between(actor, udi.user_id)
  order by c.id, case when udi.kind = 'phone' then 0 else 1 end;
end;
$$;

revoke all on function public.pantavion_find_people_from_my_contacts() from public;
grant execute on function public.pantavion_find_people_from_my_contacts() to authenticated;
