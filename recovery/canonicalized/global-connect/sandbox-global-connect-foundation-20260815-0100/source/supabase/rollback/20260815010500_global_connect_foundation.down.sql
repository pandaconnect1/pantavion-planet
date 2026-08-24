-- Manual rollback companion for 20260815010500_global_connect_foundation.sql.
-- Run only after confirming no dependent data/events need preservation.

drop policy if exists global_country_registry_read on public.global_country_registry;
drop table if exists public.global_country_registry;
drop table if exists public.global_continents;
drop table if exists public.bridge_translation_outputs;
drop table if exists public.bridge_translation_jobs;
drop table if exists public.bridge_translation_lanes;
drop table if exists public.bridge_translation_channels;
drop table if exists public.identity_sessions;
drop table if exists public.identity_devices;
drop table if exists public.identity_recovery_codes;
drop table if exists public.identity_auth_challenges;
drop table if exists public.identity_authenticators;
drop table if exists public.platform_outbox_events;
drop table if exists public.platform_idempotency_keys;
