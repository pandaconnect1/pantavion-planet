-- Water network register, built from the authentic Map B DWG by the derived
-- worker (inventory mode). Areas are the numbered supply areas drawn as dashed
-- pink boundaries; assets are valves, air valves, hydrants, pressure reducers
-- and tanks with the area that contains them and the nearest street label.
-- Rows are written only by the worker (service role). Readers go through the
-- protected water API; no public policy is granted.

create table if not exists public.water_network_areas (
  code text primary key,
  source_sha256 text not null,
  layer text not null,
  outline text not null check (outline in ('closed', 'hull')),
  area_m2 bigint not null default 0,
  centroid_x double precision,
  centroid_y double precision,
  bounds jsonb,
  ring jsonb,
  group_name text,
  updated_at timestamptz not null default now()
);

create table if not exists public.water_network_assets (
  number text primary key,
  source_sha256 text not null,
  kind text not null check (kind in ('valve', 'air_valve', 'hydrant', 'pressure_reducing_valve', 'tank')),
  dn integer,
  x double precision not null,
  y double precision not null,
  layer text,
  block text,
  area_code text,
  street text,
  street_distance real,
  tag text,
  tag_distance real,
  name text,
  capacity_m3 double precision,
  proposed boolean not null default false,
  origin text not null default 'drawing',
  updated_at timestamptz not null default now()
);

create index if not exists water_network_assets_area_idx on public.water_network_assets (area_code, kind, street);
create index if not exists water_network_assets_xy_idx on public.water_network_assets (x, y);

alter table public.water_network_areas enable row level security;
alter table public.water_network_assets enable row level security;
