-- Manual rollback for 20260815010000_create_global_connect_foundation.sql.
-- Do not execute without a verified backup, restore plan, exact production
-- impact review and explicit owner approval. Supabase does not apply files in
-- this directory automatically.

begin;

drop trigger if exists global_connect_audit_references_immutable on public.global_connect_audit_references;
drop trigger if exists global_connect_command_receipts_touch_updated_at on public.global_connect_command_receipts;
drop trigger if exists global_connect_translation_jobs_immutable_original on public.global_connect_translation_jobs;
drop trigger if exists global_connect_translation_channels_touch_updated_at on public.global_connect_translation_channels;
drop trigger if exists global_connect_country_registry_touch_updated_at on public.global_connect_country_registry;
drop trigger if exists global_connect_sessions_touch_updated_at on public.global_connect_sessions;
drop trigger if exists global_connect_devices_touch_updated_at on public.global_connect_devices;
drop trigger if exists global_connect_handles_touch_updated_at on public.global_connect_handles;

drop table if exists public.global_connect_audit_references;
drop table if exists public.global_connect_outbox_events;
drop table if exists public.global_connect_command_receipts;
drop table if exists public.global_connect_translation_outputs;
drop table if exists public.global_connect_translation_jobs;
drop table if exists public.global_connect_translation_lanes;
drop table if exists public.global_connect_translation_channels;
drop table if exists public.global_connect_country_registry;
drop table if exists public.global_connect_sessions;
drop table if exists public.global_connect_devices;
drop table if exists public.global_connect_recovery_codes;
drop table if exists public.global_connect_auth_challenges;
drop table if exists public.global_connect_passkey_credentials;
drop table if exists public.global_connect_handles;

drop function if exists public.global_connect_forbid_translation_original_mutation();
drop function if exists public.global_connect_forbid_audit_mutation();

commit;
