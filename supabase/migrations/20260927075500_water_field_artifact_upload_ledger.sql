-- Pantavion Water field evidence upload ledger.
-- Private storage, approved Water actors only through server APIs.

create table public.water_field_artifact_uploads (
  upload_id uuid primary key default gen_random_uuid(),
  request_id text not null unique,
  actor_kind text not null check (actor_kind in ('admin_session','approved_device')),
  actor_ref text not null,
  device_id text,
  original_file_name text not null,
  mime_type text not null,
  file_size_bytes bigint not null check (file_size_bytes > 0),
  storage_bucket text not null check (storage_bucket = 'personal-media'),
  storage_path text not null unique,
  upload_state text not null check (upload_state in (
    'awaiting_upload','uploaded','verified','hash_pending','quarantined','failed'
  )),
  sha256 text,
  linked_pin_id uuid references public.water_map_evidence_pins(pin_id) on delete set null,
  linked_patch_id uuid references public.water_spatial_patches(patch_id) on delete set null,
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  provenance jsonb not null default '{}'::jsonb check (jsonb_typeof(provenance) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (sha256 is null or sha256 ~ '^[0-9a-f]{64}$')
);

create index water_field_artifact_uploads_actor_idx
  on public.water_field_artifact_uploads (actor_ref, created_at desc);
create index water_field_artifact_uploads_device_idx
  on public.water_field_artifact_uploads (device_id, created_at desc);
create index water_field_artifact_uploads_state_idx
  on public.water_field_artifact_uploads (upload_state, created_at desc);
create index water_field_artifact_uploads_pin_idx
  on public.water_field_artifact_uploads (linked_pin_id)
  where linked_pin_id is not null;
create index water_field_artifact_uploads_patch_idx
  on public.water_field_artifact_uploads (linked_patch_id)
  where linked_patch_id is not null;

create trigger water_field_artifact_uploads_set_updated_at
before update on public.water_field_artifact_uploads
for each row execute function public.pantavion_water_set_updated_at();

alter table public.water_field_artifact_uploads enable row level security;
alter table public.water_field_artifact_uploads force row level security;

revoke all on table public.water_field_artifact_uploads from public, anon, authenticated;
grant select, insert, update on table public.water_field_artifact_uploads to service_role;
revoke delete, truncate on table public.water_field_artifact_uploads from service_role;
