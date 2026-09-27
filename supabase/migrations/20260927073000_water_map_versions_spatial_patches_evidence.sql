-- Pantavion Water canonical persistence for spatial patches, map versions and evidence pins.
-- Server-only tables: RLS + FORCE RLS, no anon/authenticated grants.

create or replace function public.pantavion_water_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function public.pantavion_water_set_updated_at() from public, anon, authenticated;

create table public.water_map_versions (
  version_id uuid primary key default gen_random_uuid(),
  map_id text not null,
  source_key text not null,
  version_number integer not null check (version_number > 0),
  label text not null,
  status text not null check (status in (
    'received','inspected','candidate','approved_reference','superseded_reference','archived'
  )),
  source_ref text not null,
  source_fingerprint text not null,
  storage_bucket text,
  storage_path text,
  source_date date,
  received_by text not null,
  crs_authority text,
  crs_code text,
  immutable_source boolean not null default true check (immutable_source = true),
  deleted_automatically boolean not null default false check (deleted_automatically = false),
  notes jsonb not null default '[]'::jsonb check (jsonb_typeof(notes) = 'array'),
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (map_id, version_number),
  unique (source_fingerprint)
);

create index water_map_versions_map_status_idx
  on public.water_map_versions (map_id, status, version_number desc);
create index water_map_versions_source_key_idx
  on public.water_map_versions (source_key);
create index water_map_versions_created_at_idx
  on public.water_map_versions (created_at desc);

create trigger water_map_versions_set_updated_at
before update on public.water_map_versions
for each row execute function public.pantavion_water_set_updated_at();

alter table public.water_map_versions enable row level security;
alter table public.water_map_versions force row level security;
revoke all on table public.water_map_versions from public, anon, authenticated;
grant select, insert, update, delete on table public.water_map_versions to service_role;

create table public.water_spatial_patches (
  patch_id uuid primary key default gen_random_uuid(),
  asset_type text not null check (asset_type in (
    'valve','pipe','network_extension','service_connection','meter','fitting',
    'hydrant','chamber','fault','leak','repair','road_reference','zone','general_update'
  )),
  operation text not null check (operation in ('create','correct','replace','retire','annotate')),
  status text not null default 'pending_review' check (status in (
    'local_only','pending_review','approved_overlay','officialization_candidate',
    'officialized','conflict','rejected','superseded'
  )),
  map_id text not null,
  source_key text,
  source_map_version_id uuid references public.water_map_versions(version_id) on delete restrict,
  geometry_type text not null check (geometry_type in ('Point','LineString','Polygon')),
  geometry jsonb not null check (jsonb_typeof(geometry) = 'object'),
  crs_authority text not null,
  crs_code text not null,
  bbox_min_x double precision not null,
  bbox_min_y double precision not null,
  bbox_max_x double precision not null,
  bbox_max_y double precision not null,
  location_source text not null check (location_source in (
    'gps','assisted_gps','wifi','cell','manual_map','coordinate_entry',
    'snapped_to_network','survey','cad_gis','official_plan','unknown'
  )),
  accuracy_state text not null check (accuracy_state in (
    'measured','verified','estimated','approximate','unknown'
  )),
  accuracy_meters double precision check (accuracy_meters is null or accuracy_meters >= 0),
  street_name text,
  area text,
  postal_code text,
  parcel_reference text,
  technical_address_id text,
  snapped_asset_id text,
  attributes jsonb not null default '{}'::jsonb check (jsonb_typeof(attributes) = 'object'),
  evidence_refs jsonb not null default '[]'::jsonb check (jsonb_typeof(evidence_refs) = 'array'),
  artifact_refs jsonb not null default '[]'::jsonb check (jsonb_typeof(artifact_refs) = 'array'),
  related_job_ids jsonb not null default '[]'::jsonb check (jsonb_typeof(related_job_ids) = 'array'),
  related_report_ids jsonb not null default '[]'::jsonb check (jsonb_typeof(related_report_ids) = 'array'),
  created_by text not null,
  source_device_id text,
  source_network_version text,
  immutable_fingerprint text not null,
  reviewed_by text,
  reviewed_at timestamptz,
  decision_note text,
  supersedes_patch_id uuid references public.water_spatial_patches(patch_id) on delete restrict,
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (immutable_fingerprint),
  check (bbox_min_x <= bbox_max_x),
  check (bbox_min_y <= bbox_max_y),
  check (
    status not in ('approved_overlay','officialization_candidate','officialized')
    or (reviewed_by is not null and reviewed_at is not null)
  ),
  check (
    status <> 'officialized'
    or accuracy_state not in ('approximate','unknown')
  )
);

create index water_spatial_patches_map_status_idx
  on public.water_spatial_patches (map_id, status, created_at desc);
create index water_spatial_patches_source_key_idx
  on public.water_spatial_patches (source_key, status, created_at desc);
create index water_spatial_patches_street_idx
  on public.water_spatial_patches (street_name);
create index water_spatial_patches_bbox_x_idx
  on public.water_spatial_patches (bbox_min_x, bbox_max_x);
create index water_spatial_patches_bbox_y_idx
  on public.water_spatial_patches (bbox_min_y, bbox_max_y);
create index water_spatial_patches_created_by_idx
  on public.water_spatial_patches (created_by, created_at desc);

create trigger water_spatial_patches_set_updated_at
before update on public.water_spatial_patches
for each row execute function public.pantavion_water_set_updated_at();

alter table public.water_spatial_patches enable row level security;
alter table public.water_spatial_patches force row level security;
revoke all on table public.water_spatial_patches from public, anon, authenticated;
grant select, insert, update, delete on table public.water_spatial_patches to service_role;

create table public.water_spatial_patch_revisions (
  revision_id bigint generated always as identity primary key,
  patch_id uuid not null,
  revision_action text not null check (revision_action in ('update','delete')),
  snapshot jsonb not null check (jsonb_typeof(snapshot) = 'object'),
  recorded_at timestamptz not null default now()
);

create index water_spatial_patch_revisions_patch_idx
  on public.water_spatial_patch_revisions (patch_id, revision_id desc);

alter table public.water_spatial_patch_revisions enable row level security;
alter table public.water_spatial_patch_revisions force row level security;
revoke all on table public.water_spatial_patch_revisions from public, anon, authenticated;
grant select, insert on table public.water_spatial_patch_revisions to service_role;

create or replace function public.pantavion_water_capture_patch_revision()
returns trigger
language plpgsql
as $$
begin
  insert into public.water_spatial_patch_revisions (patch_id, revision_action, snapshot)
  values (
    old.patch_id,
    case when tg_op = 'DELETE' then 'delete' else 'update' end,
    to_jsonb(old)
  );
  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

revoke all on function public.pantavion_water_capture_patch_revision() from public, anon, authenticated;

create trigger water_spatial_patches_capture_revision
before update or delete on public.water_spatial_patches
for each row execute function public.pantavion_water_capture_patch_revision();

create table public.water_map_evidence_pins (
  pin_id uuid primary key default gen_random_uuid(),
  map_id text not null,
  source_key text,
  map_version_id uuid references public.water_map_versions(version_id) on delete restrict,
  linked_patch_id uuid references public.water_spatial_patches(patch_id) on delete set null,
  x double precision not null,
  y double precision not null,
  crs_authority text not null,
  crs_code text not null,
  location_source text not null,
  accuracy_state text not null,
  accuracy_meters double precision check (accuracy_meters is null or accuracy_meters >= 0),
  street_name text,
  technical_address_id text,
  note text,
  artifact_refs jsonb not null default '[]'::jsonb check (jsonb_typeof(artifact_refs) = 'array'),
  ai_observation jsonb not null default '{}'::jsonb check (jsonb_typeof(ai_observation) = 'object'),
  review_state text not null default 'pending' check (review_state in (
    'pending','approved','rejected','superseded'
  )),
  created_by text not null,
  source_device_id text,
  immutable_fingerprint text not null unique,
  reviewed_by text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index water_map_evidence_pins_map_review_idx
  on public.water_map_evidence_pins (map_id, review_state, created_at desc);
create index water_map_evidence_pins_source_key_idx
  on public.water_map_evidence_pins (source_key, review_state, created_at desc);
create index water_map_evidence_pins_xy_idx
  on public.water_map_evidence_pins (x, y);
create index water_map_evidence_pins_created_by_idx
  on public.water_map_evidence_pins (created_by, created_at desc);

create trigger water_map_evidence_pins_set_updated_at
before update on public.water_map_evidence_pins
for each row execute function public.pantavion_water_set_updated_at();

alter table public.water_map_evidence_pins enable row level security;
alter table public.water_map_evidence_pins force row level security;
revoke all on table public.water_map_evidence_pins from public, anon, authenticated;
grant select, insert, update, delete on table public.water_map_evidence_pins to service_role;
