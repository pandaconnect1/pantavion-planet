-- Pantavion internal scheduler redundancy.
-- This migration prepares a Supabase-owned scheduler path but DOES NOT activate a cron job.
-- Activation is a separate post-deploy operation so the live route can verify the Vault token first.

create extension if not exists pg_net with schema extensions;
create extension if not exists pg_cron with schema pg_catalog;

create table if not exists public.pantavion_internal_scheduler_dispatches (
  dispatch_id uuid primary key default gen_random_uuid(),
  scheduler_name text not null,
  bucket_start timestamptz not null,
  request_id bigint,
  dispatched_at timestamptz not null default now(),
  dispatch_error text,
  unique (scheduler_name, bucket_start)
);

create index if not exists pantavion_internal_scheduler_dispatches_recent_idx
  on public.pantavion_internal_scheduler_dispatches(scheduler_name, dispatched_at desc);

alter table public.pantavion_internal_scheduler_dispatches enable row level security;
revoke all on public.pantavion_internal_scheduler_dispatches from public, anon, authenticated;
grant select, insert, update on public.pantavion_internal_scheduler_dispatches to service_role;

create or replace function public.pantavion_verify_internal_scheduler_token(p_token text)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  stored_secret text;
begin
  if length(coalesce(p_token, '')) < 32 then
    return false;
  end if;

  select decrypted_secret
    into stored_secret
  from vault.decrypted_secrets
  where name = 'pantavion_internal_scheduler_token_v1'
  order by created_at desc
  limit 1;

  if length(coalesce(stored_secret, '')) < 32 then
    return false;
  end if;

  return extensions.digest(p_token, 'sha256') = extensions.digest(stored_secret, 'sha256');
end;
$$;

revoke all on function public.pantavion_verify_internal_scheduler_token(text)
  from public, anon, authenticated;
grant execute on function public.pantavion_verify_internal_scheduler_token(text)
  to service_role;

create or replace function public.pantavion_internal_scheduler_dispatch()
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  scheduler_constant constant text := 'pantavion-internal-scheduler-5m';
  bucket_start_value timestamptz;
  dispatch_id_value uuid;
  scheduler_token text;
  request_id_value bigint;
  error_text text;
begin
  bucket_start_value := date_trunc('hour', now())
    + floor(extract(minute from now()) / 5)::integer * interval '5 minutes';

  insert into public.pantavion_internal_scheduler_dispatches(
    scheduler_name,
    bucket_start
  )
  values (
    scheduler_constant,
    bucket_start_value
  )
  on conflict (scheduler_name, bucket_start) do nothing
  returning dispatch_id into dispatch_id_value;

  if dispatch_id_value is null then
    return null;
  end if;

  select decrypted_secret
    into scheduler_token
  from vault.decrypted_secrets
  where name = 'pantavion_internal_scheduler_token_v1'
  order by created_at desc
  limit 1;

  if length(coalesce(scheduler_token, '')) < 32 then
    update public.pantavion_internal_scheduler_dispatches
      set dispatch_error = 'scheduler_token_missing_or_invalid'
    where dispatch_id = dispatch_id_value;
    return null;
  end if;

  begin
    select net.http_get(
      url := 'https://pantavion.com/api/pantavion/intelligence/cron',
      params := '{}'::jsonb,
      headers := jsonb_build_object(
        'x-pantavion-scheduler-token', scheduler_token,
        'user-agent', 'pantavion-supabase-scheduler/1.0'
      ),
      timeout_milliseconds := 240000
    ) into request_id_value;

    update public.pantavion_internal_scheduler_dispatches
      set request_id = request_id_value,
          dispatch_error = null
    where dispatch_id = dispatch_id_value;
  exception when others then
    error_text := left(sqlerrm, 1000);
    update public.pantavion_internal_scheduler_dispatches
      set dispatch_error = error_text
    where dispatch_id = dispatch_id_value;
    return null;
  end;

  return request_id_value;
end;
$$;

revoke all on function public.pantavion_internal_scheduler_dispatch()
  from public, anon, authenticated;
grant execute on function public.pantavion_internal_scheduler_dispatch()
  to service_role;

comment on function public.pantavion_internal_scheduler_dispatch() is
  'Idempotent five-minute Pantavion scheduler dispatch. A cron job must be activated separately after the matching application route is deployed.';
