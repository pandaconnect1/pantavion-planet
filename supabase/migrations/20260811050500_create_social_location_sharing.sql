-- Pantavion Social Map: consent-based friend location sharing.
-- Location is OFF by default. A user must explicitly enable sharing and choose recipients.

create table if not exists public.user_location_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  sharing_enabled boolean not null default false,
  precision text not null default 'approximate' check (precision in ('approximate','precise')),
  updated_at timestamptz not null default now()
);

create table if not exists public.location_shares (
  owner_id uuid not null references auth.users(id) on delete cascade,
  viewer_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'active' check (status in ('active','paused','revoked')),
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (owner_id, viewer_id),
  check (owner_id <> viewer_id)
);

create table if not exists public.user_live_locations (
  user_id uuid primary key references auth.users(id) on delete cascade,
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  accuracy_m double precision,
  captured_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_location_settings enable row level security;
alter table public.location_shares enable row level security;
alter table public.user_live_locations enable row level security;

create policy "location settings owner only" on public.user_location_settings
for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "location shares participants read" on public.location_shares
for select using (owner_id = auth.uid() or viewer_id = auth.uid());
create policy "location shares owner write" on public.location_shares
for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "live location owner write" on public.user_live_locations
for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "live location approved viewers read" on public.user_live_locations
for select using (
  user_id = auth.uid()
  or exists (
    select 1 from public.location_shares s
    join public.user_location_settings st on st.user_id = s.owner_id
    where s.owner_id = user_live_locations.user_id
      and s.viewer_id = auth.uid()
      and s.status = 'active'
      and st.sharing_enabled = true
      and (s.expires_at is null or s.expires_at > now())
  )
);

create index if not exists location_shares_viewer_idx on public.location_shares(viewer_id, status);
create index if not exists live_locations_updated_idx on public.user_live_locations(updated_at desc);
