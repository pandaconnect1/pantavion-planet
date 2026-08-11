-- Pantavion Emergency Location Core
-- Separate from ordinary Social Map visibility.
-- Stores truthful last-known observations with timestamps; never claims a stale point is current.

create table if not exists public.emergency_location_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  enabled boolean not null default false,
  retain_recent_path boolean not null default false,
  retention_hours integer not null default 24 check (retention_hours between 1 and 168),
  updated_at timestamptz not null default now()
);

create table if not exists public.emergency_location_observations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  accuracy_m double precision,
  altitude_m double precision,
  speed_mps double precision,
  heading_degrees double precision check (heading_degrees is null or heading_degrees between 0 and 360),
  captured_at timestamptz not null,
  received_at timestamptz not null default now(),
  source text not null default 'device' check (source in ('device','social_location','sos','offline_sync')),
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists emergency_location_user_captured_idx
  on public.emergency_location_observations(user_id, captured_at desc);

alter table public.emergency_location_settings enable row level security;
alter table public.emergency_location_observations enable row level security;

create policy "emergency settings owner only" on public.emergency_location_settings
for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "emergency observations owner read" on public.emergency_location_observations
for select using (user_id = auth.uid());
create policy "emergency observations owner insert" on public.emergency_location_observations
for insert with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.emergency_location_settings s
    where s.user_id = auth.uid() and s.enabled = true
  )
);

-- Emergency contacts are explicit and revocable. Access by emergency contacts is not granted
-- directly to raw history here; a future audited SOS service must mediate disclosure.
create table if not exists public.emergency_contacts (
  owner_id uuid not null references auth.users(id) on delete cascade,
  contact_user_id uuid references auth.users(id) on delete cascade,
  contact_name text,
  contact_phone text,
  contact_email text,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (owner_id, contact_user_id),
  check (contact_user_id is not null or contact_phone is not null or contact_email is not null),
  check (contact_user_id is null or owner_id <> contact_user_id)
);

alter table public.emergency_contacts enable row level security;
create policy "emergency contacts owner only" on public.emergency_contacts
for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
