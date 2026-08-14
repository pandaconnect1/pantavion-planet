-- Pantavion Global Connect Foundation, cycle 1.
--
-- This is additive, server-controlled persistence only. It creates no policy
-- that gives anon/authenticated clients direct table access and it does not
-- connect an auth, translation or provider runtime by itself.
--
-- Command -> validation -> authorization/policy -> canonical write -> outbox
-- remains an application-transaction requirement. The tables below provide
-- idempotency and outbox primitives; no migration is applied by this branch.

begin;

create extension if not exists pgcrypto;

create table if not exists public.global_connect_handles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  handle text not null,
  normalized_handle text not null,
  confusable_skeleton text not null,
  status text not null default 'active'
    check (status in ('active', 'reserved', 'released', 'suspended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (handle = btrim(handle)),
  check (normalized_handle = lower(normalized_handle)),
  check (normalized_handle ~ '^[a-z0-9][a-z0-9._-]{1,28}[a-z0-9]$')
);
create unique index if not exists global_connect_handles_normalized_unique_idx
  on public.global_connect_handles(normalized_handle);
create unique index if not exists global_connect_handles_skeleton_unique_idx
  on public.global_connect_handles(confusable_skeleton);

create table if not exists public.global_connect_passkey_credentials (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  credential_id_hash text not null unique,
  public_key_cose bytea not null,
  relying_party_id text not null,
  sign_count bigint not null default 0 check (sign_count >= 0),
  backup_eligible boolean not null default false,
  backup_state boolean not null default false,
  transports text[] not null default '{}'::text[],
  created_at timestamptz not null default now(),
  last_used_at timestamptz,
  revoked_at timestamptz,
  check (revoked_at is null or revoked_at >= created_at)
);
create index if not exists global_connect_passkeys_user_active_idx
  on public.global_connect_passkey_credentials(user_id, created_at desc)
  where revoked_at is null;

create table if not exists public.global_connect_auth_challenges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  purpose text not null
    check (purpose in ('passkey_registration', 'passkey_authentication', 'recovery')),
  challenge_hash text not null unique,
  relying_party_id text,
  origin_hash text,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now(),
  check (expires_at > created_at),
  check (consumed_at is null or consumed_at >= created_at)
);
create index if not exists global_connect_auth_challenges_expiry_idx
  on public.global_connect_auth_challenges(expires_at)
  where consumed_at is null;

create table if not exists public.global_connect_recovery_codes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  batch_id uuid not null,
  code_hash text not null unique,
  created_at timestamptz not null default now(),
  consumed_at timestamptz,
  invalidated_at timestamptz,
  check (consumed_at is null or consumed_at >= created_at),
  check (invalidated_at is null or invalidated_at >= created_at)
);
create index if not exists global_connect_recovery_codes_user_active_idx
  on public.global_connect_recovery_codes(user_id, created_at desc)
  where consumed_at is null and invalidated_at is null;

create table if not exists public.global_connect_devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  device_label text not null,
  platform text not null default 'unknown'
    check (platform in ('ios', 'android', 'windows', 'macos', 'linux', 'chromeos', 'web', 'unknown')),
  capability_snapshot jsonb not null default '{}'::jsonb,
  user_agent_hash text,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (jsonb_typeof(capability_snapshot) = 'object'),
  check (last_seen_at >= first_seen_at),
  check (revoked_at is null or revoked_at >= first_seen_at)
);
create index if not exists global_connect_devices_user_active_idx
  on public.global_connect_devices(user_id, last_seen_at desc)
  where revoked_at is null;

create table if not exists public.global_connect_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  device_id uuid references public.global_connect_devices(id) on delete set null,
  refresh_secret_hash text not null unique,
  rotated_from_session_id uuid references public.global_connect_sessions(id) on delete set null,
  issued_at timestamptz not null default now(),
  expires_at timestamptz not null,
  last_seen_at timestamptz,
  revoked_at timestamptz,
  revoke_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (expires_at > issued_at),
  check (last_seen_at is null or last_seen_at >= issued_at),
  check (revoked_at is null or revoked_at >= issued_at)
);
create index if not exists global_connect_sessions_user_active_idx
  on public.global_connect_sessions(user_id, expires_at desc)
  where revoked_at is null;
create index if not exists global_connect_sessions_device_active_idx
  on public.global_connect_sessions(device_id, expires_at desc)
  where revoked_at is null and device_id is not null;

create table if not exists public.global_connect_country_registry (
  iso_alpha2 text primary key check (iso_alpha2 ~ '^[A-Z]{2}$'),
  canonical_name text not null,
  primary_continent text not null
    check (primary_continent in ('Africa', 'Antarctica', 'Asia', 'Europe', 'North America', 'Oceania', 'South America')),
  native_names jsonb not null default '[]'::jsonb,
  status text not null default 'registry-only'
    check (status in ('registry-only', 'research-pending', 'evidence-partial', 'reviewed', 'legally-reviewed', 'approved-for-production', 'suspended')),
  iso3166_snapshot_ref text not null,
  un_m49_context jsonb not null default '{}'::jsonb,
  jurisdiction_pack_ref text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (jsonb_typeof(native_names) = 'array'),
  check (jsonb_typeof(un_m49_context) = 'object')
);

-- Seed the source snapshot without upgrading an existing jurisdiction status.
-- Every record remains registry-only; numeric UN M49 reconciliation is pending.
insert into public.global_connect_country_registry (
  iso_alpha2,
  canonical_name,
  primary_continent,
  native_names,
  status,
  iso3166_snapshot_ref,
  un_m49_context
)
values
  ('AD', 'Andorra', 'Europe', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('AE', 'United Arab Emirates', 'Asia', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('AF', 'Afghanistan', 'Asia', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('AG', 'Antigua & Barbuda', 'North America', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('AI', 'Anguilla', 'North America', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('AL', 'Albania', 'Europe', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('AM', 'Armenia', 'Asia', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('AO', 'Angola', 'Africa', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('AQ', 'Antarctica', 'Antarctica', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('AR', 'Argentina', 'South America', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('AS', 'Samoa (American)', 'Oceania', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('AT', 'Austria', 'Europe', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('AU', 'Australia', 'Oceania', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('AW', 'Aruba', 'North America', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('AX', 'Åland Islands', 'Europe', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('AZ', 'Azerbaijan', 'Asia', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('BA', 'Bosnia & Herzegovina', 'Europe', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('BB', 'Barbados', 'North America', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('BD', 'Bangladesh', 'Asia', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('BE', 'Belgium', 'Europe', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('BF', 'Burkina Faso', 'Africa', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('BG', 'Bulgaria', 'Europe', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('BH', 'Bahrain', 'Asia', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('BI', 'Burundi', 'Africa', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('BJ', 'Benin', 'Africa', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('BL', 'St Barthelemy', 'North America', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('BM', 'Bermuda', 'North America', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('BN', 'Brunei', 'Asia', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('BO', 'Bolivia', 'South America', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('BQ', 'Caribbean NL', 'North America', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('BR', 'Brazil', 'South America', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('BS', 'Bahamas', 'North America', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('BT', 'Bhutan', 'Asia', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('BV', 'Bouvet Island', 'Antarctica', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('BW', 'Botswana', 'Africa', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('BY', 'Belarus', 'Europe', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('BZ', 'Belize', 'North America', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('CA', 'Canada', 'North America', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('CC', 'Cocos (Keeling) Islands', 'Oceania', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('CD', 'Congo (Dem. Rep.)', 'Africa', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('CF', 'Central African Rep.', 'Africa', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('CG', 'Congo (Rep.)', 'Africa', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('CH', 'Switzerland', 'Europe', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('CI', 'Côte d''Ivoire', 'Africa', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('CK', 'Cook Islands', 'Oceania', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('CL', 'Chile', 'South America', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('CM', 'Cameroon', 'Africa', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('CN', 'China', 'Asia', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('CO', 'Colombia', 'South America', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('CR', 'Costa Rica', 'North America', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('CU', 'Cuba', 'North America', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('CV', 'Cape Verde', 'Africa', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('CW', 'Curaçao', 'North America', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('CX', 'Christmas Island', 'Oceania', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('CY', 'Cyprus', 'Asia', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('CZ', 'Czech Republic', 'Europe', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('DE', 'Germany', 'Europe', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('DJ', 'Djibouti', 'Africa', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('DK', 'Denmark', 'Europe', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('DM', 'Dominica', 'North America', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('DO', 'Dominican Republic', 'North America', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('DZ', 'Algeria', 'Africa', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('EC', 'Ecuador', 'South America', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('EE', 'Estonia', 'Europe', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('EG', 'Egypt', 'Africa', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('EH', 'Western Sahara', 'Africa', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('ER', 'Eritrea', 'Africa', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('ES', 'Spain', 'Europe', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('ET', 'Ethiopia', 'Africa', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('FI', 'Finland', 'Europe', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('FJ', 'Fiji', 'Oceania', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('FK', 'Falkland Islands', 'South America', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('FM', 'Micronesia', 'Oceania', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('FO', 'Faroe Islands', 'Europe', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('FR', 'France', 'Europe', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('GA', 'Gabon', 'Africa', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('GB', 'Britain (UK)', 'Europe', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('GD', 'Grenada', 'North America', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('GE', 'Georgia', 'Asia', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('GF', 'French Guiana', 'South America', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('GG', 'Guernsey', 'Europe', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('GH', 'Ghana', 'Africa', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('GI', 'Gibraltar', 'Europe', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('GL', 'Greenland', 'North America', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('GM', 'Gambia', 'Africa', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('GN', 'Guinea', 'Africa', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('GP', 'Guadeloupe', 'North America', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('GQ', 'Equatorial Guinea', 'Africa', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('GR', 'Greece', 'Europe', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('GS', 'South Georgia & the South Sandwich Islands', 'South America', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('GT', 'Guatemala', 'North America', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('GU', 'Guam', 'Oceania', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('GW', 'Guinea-Bissau', 'Africa', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('GY', 'Guyana', 'South America', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('HK', 'Hong Kong', 'Asia', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('HM', 'Heard Island & McDonald Islands', 'Antarctica', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('HN', 'Honduras', 'North America', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('HR', 'Croatia', 'Europe', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('HT', 'Haiti', 'North America', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('HU', 'Hungary', 'Europe', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('ID', 'Indonesia', 'Asia', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('IE', 'Ireland', 'Europe', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('IL', 'Israel', 'Asia', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('IM', 'Isle of Man', 'Europe', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('IN', 'India', 'Asia', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('IO', 'British Indian Ocean Territory', 'Africa', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('IQ', 'Iraq', 'Asia', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('IR', 'Iran', 'Asia', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('IS', 'Iceland', 'Europe', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('IT', 'Italy', 'Europe', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('JE', 'Jersey', 'Europe', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('JM', 'Jamaica', 'North America', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('JO', 'Jordan', 'Asia', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('JP', 'Japan', 'Asia', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('KE', 'Kenya', 'Africa', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('KG', 'Kyrgyzstan', 'Asia', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('KH', 'Cambodia', 'Asia', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('KI', 'Kiribati', 'Oceania', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('KM', 'Comoros', 'Africa', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('KN', 'St Kitts & Nevis', 'North America', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('KP', 'Korea (North)', 'Asia', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('KR', 'Korea (South)', 'Asia', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('KW', 'Kuwait', 'Asia', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('KY', 'Cayman Islands', 'North America', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('KZ', 'Kazakhstan', 'Asia', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('LA', 'Laos', 'Asia', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('LB', 'Lebanon', 'Asia', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('LC', 'St Lucia', 'North America', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('LI', 'Liechtenstein', 'Europe', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('LK', 'Sri Lanka', 'Asia', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('LR', 'Liberia', 'Africa', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('LS', 'Lesotho', 'Africa', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('LT', 'Lithuania', 'Europe', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('LU', 'Luxembourg', 'Europe', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('LV', 'Latvia', 'Europe', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('LY', 'Libya', 'Africa', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('MA', 'Morocco', 'Africa', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('MC', 'Monaco', 'Europe', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('MD', 'Moldova', 'Europe', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('ME', 'Montenegro', 'Europe', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('MF', 'St Martin (French)', 'North America', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('MG', 'Madagascar', 'Africa', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('MH', 'Marshall Islands', 'Oceania', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('MK', 'North Macedonia', 'Europe', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('ML', 'Mali', 'Africa', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('MM', 'Myanmar (Burma)', 'Asia', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('MN', 'Mongolia', 'Asia', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('MO', 'Macau', 'Asia', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('MP', 'Northern Mariana Islands', 'Oceania', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('MQ', 'Martinique', 'North America', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('MR', 'Mauritania', 'Africa', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('MS', 'Montserrat', 'North America', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('MT', 'Malta', 'Europe', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('MU', 'Mauritius', 'Africa', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('MV', 'Maldives', 'Asia', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('MW', 'Malawi', 'Africa', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('MX', 'Mexico', 'North America', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('MY', 'Malaysia', 'Asia', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('MZ', 'Mozambique', 'Africa', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('NA', 'Namibia', 'Africa', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('NC', 'New Caledonia', 'Oceania', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('NE', 'Niger', 'Africa', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('NF', 'Norfolk Island', 'Oceania', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('NG', 'Nigeria', 'Africa', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('NI', 'Nicaragua', 'North America', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('NL', 'Netherlands', 'Europe', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('NO', 'Norway', 'Europe', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('NP', 'Nepal', 'Asia', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('NR', 'Nauru', 'Oceania', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('NU', 'Niue', 'Oceania', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('NZ', 'New Zealand', 'Oceania', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('OM', 'Oman', 'Asia', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('PA', 'Panama', 'North America', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('PE', 'Peru', 'South America', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('PF', 'French Polynesia', 'Oceania', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('PG', 'Papua New Guinea', 'Oceania', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('PH', 'Philippines', 'Asia', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('PK', 'Pakistan', 'Asia', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('PL', 'Poland', 'Europe', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('PM', 'St Pierre & Miquelon', 'North America', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('PN', 'Pitcairn', 'Oceania', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('PR', 'Puerto Rico', 'North America', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('PS', 'Palestine', 'Asia', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('PT', 'Portugal', 'Europe', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('PW', 'Palau', 'Oceania', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('PY', 'Paraguay', 'South America', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('QA', 'Qatar', 'Asia', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('RE', 'Réunion', 'Africa', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('RO', 'Romania', 'Europe', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('RS', 'Serbia', 'Europe', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('RU', 'Russia', 'Europe', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('RW', 'Rwanda', 'Africa', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('SA', 'Saudi Arabia', 'Asia', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('SB', 'Solomon Islands', 'Oceania', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('SC', 'Seychelles', 'Africa', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('SD', 'Sudan', 'Africa', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('SE', 'Sweden', 'Europe', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('SG', 'Singapore', 'Asia', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('SH', 'St Helena', 'Africa', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('SI', 'Slovenia', 'Europe', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('SJ', 'Svalbard & Jan Mayen', 'Europe', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('SK', 'Slovakia', 'Europe', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('SL', 'Sierra Leone', 'Africa', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('SM', 'San Marino', 'Europe', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('SN', 'Senegal', 'Africa', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('SO', 'Somalia', 'Africa', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('SR', 'Suriname', 'South America', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('SS', 'South Sudan', 'Africa', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('ST', 'Sao Tome & Principe', 'Africa', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('SV', 'El Salvador', 'North America', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('SX', 'St Maarten (Dutch)', 'North America', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('SY', 'Syria', 'Asia', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('SZ', 'Eswatini (Swaziland)', 'Africa', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('TC', 'Turks & Caicos Is', 'North America', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('TD', 'Chad', 'Africa', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('TF', 'French S. Terr.', 'Antarctica', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('TG', 'Togo', 'Africa', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('TH', 'Thailand', 'Asia', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('TJ', 'Tajikistan', 'Asia', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('TK', 'Tokelau', 'Oceania', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('TL', 'East Timor', 'Asia', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('TM', 'Turkmenistan', 'Asia', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('TN', 'Tunisia', 'Africa', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('TO', 'Tonga', 'Oceania', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('TR', 'Turkey', 'Asia', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('TT', 'Trinidad & Tobago', 'North America', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('TV', 'Tuvalu', 'Oceania', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('TW', 'Taiwan', 'Asia', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('TZ', 'Tanzania', 'Africa', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('UA', 'Ukraine', 'Europe', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('UG', 'Uganda', 'Africa', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('UM', 'US minor outlying islands', 'Oceania', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('US', 'United States', 'North America', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('UY', 'Uruguay', 'South America', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('UZ', 'Uzbekistan', 'Asia', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('VA', 'Vatican City', 'Europe', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('VC', 'St Vincent', 'North America', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('VE', 'Venezuela', 'South America', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('VG', 'Virgin Islands (UK)', 'North America', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('VI', 'Virgin Islands (US)', 'North America', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('VN', 'Vietnam', 'Asia', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('VU', 'Vanuatu', 'Oceania', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('WF', 'Wallis & Futuna', 'Oceania', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('WS', 'Samoa (western)', 'Oceania', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('YE', 'Yemen', 'Asia', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('YT', 'Mayotte', 'Africa', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('ZA', 'South Africa', 'Africa', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('ZM', 'Zambia', 'Africa', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb),
  ('ZW', 'Zimbabwe', 'Africa', '[]'::jsonb, 'registry-only', 'IANA tzdata iso3166.tab; ISO/TC 46 N1108 snapshot identified by that source as 2023-04-05.', '{"status":"research-pending"}'::jsonb)
on conflict (iso_alpha2) do nothing;

create table if not exists public.global_connect_translation_channels (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  source_conversation_id uuid references public.conversations(id) on delete set null,
  data_boundary text not null
    check (data_boundary in ('private_chat', 'social', 'voice', 'sos')),
  status text not null default 'planned'
    check (status in ('planned', 'active', 'suspended', 'closed')),
  external_processing_authorized boolean not null default false,
  policy_decision_reference text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (data_boundary <> 'private_chat' or source_conversation_id is not null),
  check (external_processing_authorized is false or policy_decision_reference is not null)
);
create index if not exists global_connect_translation_channels_owner_idx
  on public.global_connect_translation_channels(owner_user_id, created_at desc);
create index if not exists global_connect_translation_channels_conversation_idx
  on public.global_connect_translation_channels(source_conversation_id)
  where source_conversation_id is not null;

create table if not exists public.global_connect_translation_lanes (
  id uuid primary key default gen_random_uuid(),
  channel_id uuid not null references public.global_connect_translation_channels(id) on delete cascade,
  direction text not null check (direction in ('a_to_b', 'b_to_a')),
  source_language_bcp47 text not null,
  target_language_bcp47 text not null,
  created_at timestamptz not null default now(),
  unique(channel_id, direction),
  check (source_language_bcp47 <> target_language_bcp47),
  check (source_language_bcp47 ~ '^[A-Za-z0-9-]+$'),
  check (target_language_bcp47 ~ '^[A-Za-z0-9-]+$')
);

create table if not exists public.global_connect_translation_jobs (
  id uuid primary key default gen_random_uuid(),
  lane_id uuid not null references public.global_connect_translation_lanes(id) on delete cascade,
  idempotency_key text not null unique,
  source_artifact_kind text not null
    check (source_artifact_kind in ('text', 'transcript', 'subtitle', 'synthesized_audio_reference')),
  source_artifact_reference text not null,
  source_content_hash text not null,
  immutable_original boolean not null default true check (immutable_original),
  provider_route_id text,
  external_processing_authorized boolean not null default false,
  policy_decision_reference text,
  status text not null default 'blocked'
    check (status in ('blocked', 'queued', 'running', 'completed', 'failed', 'quarantined', 'cancelled')),
  retry_count integer not null default 0 check (retry_count >= 0),
  created_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz,
  check (external_processing_authorized is false or (provider_route_id is not null and policy_decision_reference is not null)),
  check (completed_at is null or completed_at >= created_at)
);
create index if not exists global_connect_translation_jobs_lane_status_idx
  on public.global_connect_translation_jobs(lane_id, status, created_at asc);

create table if not exists public.global_connect_translation_outputs (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.global_connect_translation_jobs(id) on delete cascade,
  output_kind text not null
    check (output_kind in ('text', 'transcript', 'subtitle', 'synthesized_audio_reference')),
  output_artifact_reference text not null,
  output_content_hash text not null,
  is_machine_generated boolean not null default true,
  engine_provider text,
  engine_model_version text,
  confidence_signal numeric,
  policy_decision_reference text,
  transformation_history jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  superseded_at timestamptz,
  check (jsonb_typeof(transformation_history) = 'array'),
  check (confidence_signal is null or (confidence_signal >= 0 and confidence_signal <= 1)),
  check (superseded_at is null or superseded_at >= created_at)
);
create index if not exists global_connect_translation_outputs_job_idx
  on public.global_connect_translation_outputs(job_id, created_at asc);

create table if not exists public.global_connect_command_receipts (
  id uuid primary key default gen_random_uuid(),
  idempotency_key text not null unique,
  command_type text not null,
  actor_user_id uuid references auth.users(id) on delete set null,
  request_hash text not null,
  canonical_aggregate_type text,
  canonical_aggregate_id uuid,
  state text not null default 'accepted'
    check (state in ('accepted', 'written', 'rejected', 'failed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists global_connect_command_receipts_actor_idx
  on public.global_connect_command_receipts(actor_user_id, created_at desc)
  where actor_user_id is not null;

create table if not exists public.global_connect_outbox_events (
  id uuid primary key default gen_random_uuid(),
  idempotency_key text not null unique,
  aggregate_type text not null,
  aggregate_id uuid not null,
  event_type text not null,
  payload_reference jsonb not null default '{}'::jsonb,
  status text not null default 'pending'
    check (status in ('pending', 'processing', 'delivered', 'failed', 'quarantined')),
  attempt_count integer not null default 0 check (attempt_count >= 0),
  available_at timestamptz not null default now(),
  delivered_at timestamptz,
  last_error_code text,
  created_at timestamptz not null default now(),
  check (jsonb_typeof(payload_reference) = 'object'),
  check (delivered_at is null or delivered_at >= created_at)
);
create index if not exists global_connect_outbox_delivery_idx
  on public.global_connect_outbox_events(status, available_at asc)
  where status in ('pending', 'failed');

create table if not exists public.global_connect_audit_references (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references auth.users(id) on delete set null,
  event_type text not null,
  decision_reference text,
  subject_reference text,
  event_hash text not null,
  created_at timestamptz not null default now(),
  metadata_reference jsonb not null default '{}'::jsonb,
  check (jsonb_typeof(metadata_reference) = 'object')
);
create index if not exists global_connect_audit_references_actor_idx
  on public.global_connect_audit_references(actor_user_id, created_at desc)
  where actor_user_id is not null;

create or replace function public.global_connect_forbid_audit_mutation()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  raise exception 'global_connect_audit_references_are_immutable';
end;
$$;

create or replace function public.global_connect_forbid_translation_original_mutation()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.source_artifact_reference <> old.source_artifact_reference
     or new.source_content_hash <> old.source_content_hash
     or new.immutable_original <> old.immutable_original then
    raise exception 'global_connect_translation_original_is_immutable';
  end if;

  return new;
end;
$$;

drop trigger if exists global_connect_handles_touch_updated_at on public.global_connect_handles;
create trigger global_connect_handles_touch_updated_at
before update on public.global_connect_handles
for each row execute function public.pantavion_touch_updated_at();

drop trigger if exists global_connect_devices_touch_updated_at on public.global_connect_devices;
create trigger global_connect_devices_touch_updated_at
before update on public.global_connect_devices
for each row execute function public.pantavion_touch_updated_at();

drop trigger if exists global_connect_sessions_touch_updated_at on public.global_connect_sessions;
create trigger global_connect_sessions_touch_updated_at
before update on public.global_connect_sessions
for each row execute function public.pantavion_touch_updated_at();

drop trigger if exists global_connect_country_registry_touch_updated_at on public.global_connect_country_registry;
create trigger global_connect_country_registry_touch_updated_at
before update on public.global_connect_country_registry
for each row execute function public.pantavion_touch_updated_at();

drop trigger if exists global_connect_translation_channels_touch_updated_at on public.global_connect_translation_channels;
create trigger global_connect_translation_channels_touch_updated_at
before update on public.global_connect_translation_channels
for each row execute function public.pantavion_touch_updated_at();

drop trigger if exists global_connect_translation_jobs_immutable_original on public.global_connect_translation_jobs;
create trigger global_connect_translation_jobs_immutable_original
before update on public.global_connect_translation_jobs
for each row execute function public.global_connect_forbid_translation_original_mutation();

drop trigger if exists global_connect_command_receipts_touch_updated_at on public.global_connect_command_receipts;
create trigger global_connect_command_receipts_touch_updated_at
before update on public.global_connect_command_receipts
for each row execute function public.pantavion_touch_updated_at();

drop trigger if exists global_connect_audit_references_immutable on public.global_connect_audit_references;
create trigger global_connect_audit_references_immutable
before update or delete on public.global_connect_audit_references
for each row execute function public.global_connect_forbid_audit_mutation();

alter table public.global_connect_handles enable row level security;
alter table public.global_connect_passkey_credentials enable row level security;
alter table public.global_connect_auth_challenges enable row level security;
alter table public.global_connect_recovery_codes enable row level security;
alter table public.global_connect_devices enable row level security;
alter table public.global_connect_sessions enable row level security;
alter table public.global_connect_country_registry enable row level security;
alter table public.global_connect_translation_channels enable row level security;
alter table public.global_connect_translation_lanes enable row level security;
alter table public.global_connect_translation_jobs enable row level security;
alter table public.global_connect_translation_outputs enable row level security;
alter table public.global_connect_command_receipts enable row level security;
alter table public.global_connect_outbox_events enable row level security;
alter table public.global_connect_audit_references enable row level security;

-- Service/RPC-only foundation. No direct anon/authenticated table policies are
-- introduced until authorization transactions and boundary tests are ready.
revoke all on public.global_connect_handles from anon, authenticated;
revoke all on public.global_connect_passkey_credentials from anon, authenticated;
revoke all on public.global_connect_auth_challenges from anon, authenticated;
revoke all on public.global_connect_recovery_codes from anon, authenticated;
revoke all on public.global_connect_devices from anon, authenticated;
revoke all on public.global_connect_sessions from anon, authenticated;
revoke all on public.global_connect_country_registry from anon, authenticated;
revoke all on public.global_connect_translation_channels from anon, authenticated;
revoke all on public.global_connect_translation_lanes from anon, authenticated;
revoke all on public.global_connect_translation_jobs from anon, authenticated;
revoke all on public.global_connect_translation_outputs from anon, authenticated;
revoke all on public.global_connect_command_receipts from anon, authenticated;
revoke all on public.global_connect_outbox_events from anon, authenticated;
revoke all on public.global_connect_audit_references from anon, authenticated;

commit;
