-- Global Connect Foundation: provider-neutral identity/session, outbox, translation contracts and global registry.
-- Branch-only migration. No provider activation and no production deployment is implied.

create extension if not exists pgcrypto;

create table if not exists public.platform_idempotency_keys (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references auth.users(id) on delete cascade,
  idempotency_key text not null,
  command_name text not null,
  request_hash text not null,
  response_ref jsonb,
  state text not null default 'started' check (state in ('started','completed','failed')),
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  unique (actor_user_id, command_name, idempotency_key)
);

create table if not exists public.platform_outbox_events (
  id uuid primary key default gen_random_uuid(),
  aggregate_type text not null,
  aggregate_id uuid,
  event_type text not null,
  event_version integer not null default 1 check (event_version > 0),
  idempotency_key text not null unique,
  payload jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  available_at timestamptz not null default now(),
  published_at timestamptz,
  attempt_count integer not null default 0 check (attempt_count >= 0),
  last_error text
);
create index if not exists platform_outbox_pending_idx
  on public.platform_outbox_events(available_at, occurred_at)
  where published_at is null;

create table if not exists public.identity_authenticators (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  credential_id_hash text not null unique,
  public_key_cose bytea not null,
  sign_count bigint not null default 0 check (sign_count >= 0),
  backup_eligible boolean,
  backup_state boolean,
  transports text[] not null default '{}'::text[],
  rp_id text not null,
  nickname text,
  created_at timestamptz not null default now(),
  last_used_at timestamptz,
  revoked_at timestamptz
);

create table if not exists public.identity_auth_challenges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  challenge_hash text not null unique,
  challenge_kind text not null check (challenge_kind in ('registration','authentication','recovery','reauthentication')),
  rp_id text not null,
  origin text not null,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now(),
  check (expires_at > created_at)
);

create table if not exists public.identity_recovery_codes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  code_hash text not null,
  hash_algorithm text not null default 'argon2id',
  created_at timestamptz not null default now(),
  consumed_at timestamptz,
  revoked_at timestamptz,
  unique(user_id, code_hash)
);

create table if not exists public.identity_devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  device_public_id uuid not null default gen_random_uuid(),
  display_name text,
  platform text,
  browser_family text,
  capability_snapshot jsonb not null default '{}'::jsonb,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  revoked_at timestamptz,
  unique(user_id, device_public_id)
);

create table if not exists public.identity_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  device_id uuid references public.identity_devices(id) on delete set null,
  session_secret_hash text not null unique,
  assurance_level text not null default 'aal1' check (assurance_level in ('aal1','aal2','phishing-resistant')),
  issued_at timestamptz not null default now(),
  expires_at timestamptz not null,
  rotated_at timestamptz,
  revoked_at timestamptz,
  last_seen_at timestamptz,
  check (expires_at > issued_at)
);

create table if not exists public.bridge_translation_channels (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  context_kind text not null check (context_kind in ('chat','interpreter','voice','document','other')),
  context_ref uuid,
  privacy_class text not null default 'private' check (privacy_class in ('private','restricted','public')),
  created_at timestamptz not null default now(),
  closed_at timestamptz
);

create table if not exists public.bridge_translation_lanes (
  id uuid primary key default gen_random_uuid(),
  channel_id uuid not null references public.bridge_translation_channels(id) on delete cascade,
  lane_direction text not null check (lane_direction in ('A_TO_B','B_TO_A')),
  source_language_tag text not null,
  target_language_tag text not null,
  auto_detect boolean not null default false,
  created_at timestamptz not null default now(),
  unique(channel_id, lane_direction)
);

create table if not exists public.bridge_translation_jobs (
  id uuid primary key default gen_random_uuid(),
  lane_id uuid not null references public.bridge_translation_lanes(id) on delete cascade,
  requested_by uuid references auth.users(id) on delete set null,
  idempotency_key text not null unique,
  source_artifact_kind text not null check (source_artifact_kind in ('text','transcript','subtitle','audio_transcript')),
  original_text text not null,
  provider_policy_decision jsonb not null default '{}'::jsonb,
  state text not null default 'queued' check (state in ('queued','running','succeeded','failed','quarantined')),
  attempt_count integer not null default 0,
  created_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz,
  last_error text
);

create table if not exists public.bridge_translation_outputs (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.bridge_translation_jobs(id) on delete cascade,
  version integer not null default 1 check (version > 0),
  translated_text text not null,
  provider_id text,
  model_version text,
  confidence numeric,
  ai_label text not null default 'machine_translation',
  transformation_history jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  superseded_at timestamptz,
  unique(job_id, version)
);

create table if not exists public.global_continents (
  code text primary key,
  canonical_name text not null unique
);
insert into public.global_continents(code, canonical_name) values
  ('AF','Africa'),('AN','Antarctica'),('AS','Asia'),('EU','Europe'),
  ('NA','North America'),('OC','Oceania'),('SA','South America')
on conflict (code) do update set canonical_name = excluded.canonical_name;

create table if not exists public.global_country_registry (
  alpha2 char(2) primary key,
  alpha3 char(3) not null unique,
  numeric_code char(3) not null unique,
  canonical_name text not null,
  native_name text,
  continent_code text references public.global_continents(code),
  evidence_status text not null default 'registry-only'
    check (evidence_status in ('registry-only','research-pending','evidence-partial','reviewed','legally-reviewed','approved-for-production','suspended')),
  evidence jsonb not null default '{}'::jsonb,
  reviewed_at timestamptz,
  recheck_at timestamptz,
  updated_at timestamptz not null default now()
);

-- Country rows are loaded from the versioned JSON ledger by an explicit seed step after migration review.
-- Keeping schema and evidence seed separate makes rollback/audit boundaries reviewable.

alter table public.platform_idempotency_keys enable row level security;
alter table public.platform_outbox_events enable row level security;
alter table public.identity_authenticators enable row level security;
alter table public.identity_auth_challenges enable row level security;
alter table public.identity_recovery_codes enable row level security;
alter table public.identity_devices enable row level security;
alter table public.identity_sessions enable row level security;
alter table public.bridge_translation_channels enable row level security;
alter table public.bridge_translation_lanes enable row level security;
alter table public.bridge_translation_jobs enable row level security;
alter table public.bridge_translation_outputs enable row level security;
alter table public.global_country_registry enable row level security;

-- Sensitive foundation tables intentionally have no direct client write policies.
-- Service/RPC commands must own mutation after authorization/policy decisions.
create policy global_country_registry_read on public.global_country_registry
for select using (true);

comment on table public.global_country_registry is
  'ISO 3166 registry ledger. A registry entry does not imply jurisdiction research or production approval.';
comment on table public.bridge_translation_outputs is
  'Derived translation artifacts. The original remains immutable in bridge_translation_jobs.original_text.';
