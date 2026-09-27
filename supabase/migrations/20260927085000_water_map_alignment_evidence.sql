create table public.water_map_alignments (
  alignment_id uuid primary key default gen_random_uuid(),
  map_id text not null default 'B',
  source_key text not null,
  source_sha256 text not null,
  map_version_id uuid references public.water_map_versions(version_id) on delete restrict,
  source_crs text not null,
  target_crs text not null,
  transform_name text not null,
  control_points jsonb not null check (jsonb_typeof(control_points) = 'array'),
  rmse_meters double precision not null check (rmse_meters >= 0),
  max_residual_meters double precision not null check (max_residual_meters >= 0),
  status text not null default 'needs_review' check (status in (
    'needs_review',
    'partially_georeferenced',
    'manually_aligned',
    'georeferenced',
    'field_confirmed',
    'approximate',
    'rejected'
  )),
  evidence_validated boolean not null default false,
  overlay_allowed boolean not null default false,
  created_by text not null,
  reviewed_by text,
  reviewed_at timestamptz,
  review_note text,
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source_sha256, transform_name, source_crs, target_crs),
  check (
    overlay_allowed = false
    or (
      evidence_validated = true
      and status in ('georeferenced','field_confirmed')
      and reviewed_by is not null
      and reviewed_at is not null
    )
  )
);

create index water_map_alignments_source_idx
  on public.water_map_alignments (source_key, created_at desc);
create index water_map_alignments_status_idx
  on public.water_map_alignments (status, overlay_allowed, created_at desc);
create index water_map_alignments_version_idx
  on public.water_map_alignments (map_version_id)
  where map_version_id is not null;

create trigger water_map_alignments_set_updated_at
before update on public.water_map_alignments
for each row execute function public.pantavion_water_set_updated_at();

alter table public.water_map_alignments enable row level security;
alter table public.water_map_alignments force row level security;
revoke all on table public.water_map_alignments from public, anon, authenticated;
grant select, insert, update on table public.water_map_alignments to service_role;
revoke delete, truncate on table public.water_map_alignments from service_role;

create table public.water_map_alignment_revisions (
  revision_id bigint generated always as identity primary key,
  alignment_id uuid not null,
  revision_action text not null check (revision_action in ('update','delete')),
  snapshot jsonb not null check (jsonb_typeof(snapshot) = 'object'),
  recorded_at timestamptz not null default now()
);

create index water_map_alignment_revisions_alignment_idx
  on public.water_map_alignment_revisions (alignment_id, revision_id desc);

alter table public.water_map_alignment_revisions enable row level security;
alter table public.water_map_alignment_revisions force row level security;
revoke all on table public.water_map_alignment_revisions from public, anon, authenticated;
grant select, insert on table public.water_map_alignment_revisions to service_role;
revoke update, delete, truncate on table public.water_map_alignment_revisions from service_role;

create or replace function public.pantavion_water_capture_alignment_revision()
returns trigger
language plpgsql
as $$
begin
  insert into public.water_map_alignment_revisions
    (alignment_id, revision_action, snapshot)
  values (
    old.alignment_id,
    case when tg_op = 'DELETE' then 'delete' else 'update' end,
    to_jsonb(old)
  );
  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

revoke all on function public.pantavion_water_capture_alignment_revision()
  from public, anon, authenticated;

create trigger water_map_alignments_capture_revision
before update or delete on public.water_map_alignments
for each row execute function public.pantavion_water_capture_alignment_revision();
