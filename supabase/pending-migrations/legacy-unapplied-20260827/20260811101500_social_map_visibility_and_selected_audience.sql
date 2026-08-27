-- Pantavion Social Map: usable friend visibility without exposing raw location broadly.

alter table public.social_location_shares
  add column if not exists precision_mode text not null default 'approximate'
    check (precision_mode in ('precise','approximate')),
  add column if not exists shared_at timestamptz;

create table if not exists public.social_location_share_members (
  owner_id uuid not null references auth.users(id) on delete cascade,
  viewer_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (owner_id, viewer_id),
  check (owner_id <> viewer_id)
);

alter table public.social_location_share_members enable row level security;

create policy social_location_members_owner_all
on public.social_location_share_members for all
using (owner_id = auth.uid())
with check (owner_id = auth.uid() and owner_id <> viewer_id);

-- Raw coordinates remain owner-only. Friends consume the safe RPC below.
drop policy if exists social_location_select_self on public.social_location_shares;
create policy social_location_select_self
on public.social_location_shares for select
using (user_id = auth.uid());

create or replace function public.pantavion_visible_social_locations()
returns table (
  user_id uuid,
  display_name text,
  username text,
  avatar_url text,
  latitude double precision,
  longitude double precision,
  accuracy_meters double precision,
  precision_mode text,
  updated_at timestamptz,
  expires_at timestamptz
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  with allowed as (
    select s.*
    from public.social_location_shares s
    where s.enabled = true
      and (s.expires_at is null or s.expires_at > now())
      and s.user_id <> auth.uid()
      and not public.pantavion_has_block_between(s.user_id, auth.uid())
      and (
        (s.audience = 'connections' and public.pantavion_are_connections(s.user_id, auth.uid()))
        or
        (s.audience = 'selected' and exists (
          select 1 from public.social_location_share_members m
          where m.owner_id = s.user_id and m.viewer_id = auth.uid()
        ))
      )
  )
  select
    a.user_id,
    p.display_name,
    p.username,
    p.avatar_url,
    case when a.precision_mode = 'approximate' then round(a.latitude::numeric, 2)::double precision else a.latitude end,
    case when a.precision_mode = 'approximate' then round(a.longitude::numeric, 2)::double precision else a.longitude end,
    case when a.precision_mode = 'approximate' then greatest(coalesce(a.accuracy_meters, 0), 1000) else a.accuracy_meters end,
    a.precision_mode,
    a.updated_at,
    a.expires_at
  from allowed a
  left join public.profiles p on p.id = a.user_id;
$$;

revoke all on function public.pantavion_visible_social_locations() from public;
grant execute on function public.pantavion_visible_social_locations() to authenticated;
