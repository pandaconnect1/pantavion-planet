-- Secure scheduled-worker control plane.
-- Server-only tables: no anon/authenticated access, explicit service_role grants.
-- No business data is deleted or mutated by this migration.

create table if not exists public.pantavion_scheduled_worker_leases (
  worker_name text primary key,
  lease_token text not null,
  lease_until timestamptz not null,
  acquired_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.pantavion_scheduled_worker_runs (
  run_id text primary key,
  worker_name text not null,
  run_key text not null,
  lease_token text not null,
  status text not null check (status in ('running', 'succeeded', 'failed', 'skipped_overlap')),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  summary jsonb not null default '{}'::jsonb,
  error text,
  unique (worker_name, run_key)
);

create index if not exists pantavion_scheduled_worker_runs_recent_idx
  on public.pantavion_scheduled_worker_runs(worker_name, started_at desc);

alter table public.pantavion_scheduled_worker_leases enable row level security;
alter table public.pantavion_scheduled_worker_runs enable row level security;

revoke all on public.pantavion_scheduled_worker_leases from public, anon, authenticated;
revoke all on public.pantavion_scheduled_worker_runs from public, anon, authenticated;
grant select, insert, update on public.pantavion_scheduled_worker_leases to service_role;
grant select, insert, update on public.pantavion_scheduled_worker_runs to service_role;

create or replace function public.pantavion_claim_scheduled_worker(
  p_worker_name text,
  p_run_id text,
  p_run_key text,
  p_lease_token text,
  p_lease_seconds integer default 240
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  claimed_token text;
  inserted_run_id text;
begin
  if length(trim(coalesce(p_worker_name, ''))) = 0
     or length(trim(coalesce(p_run_id, ''))) = 0
     or length(trim(coalesce(p_run_key, ''))) = 0
     or length(trim(coalesce(p_lease_token, ''))) < 16 then
    raise exception 'invalid_scheduled_worker_claim';
  end if;

  insert into public.pantavion_scheduled_worker_runs(
    run_id, worker_name, run_key, lease_token, status
  )
  values (p_run_id, p_worker_name, p_run_key, p_lease_token, 'running')
  on conflict (worker_name, run_key) do nothing
  returning run_id into inserted_run_id;

  if inserted_run_id is null then
    return jsonb_build_object('acquired', false, 'reason', 'duplicate_run_key');
  end if;

  insert into public.pantavion_scheduled_worker_leases(
    worker_name, lease_token, lease_until, acquired_at, updated_at
  )
  values (
    p_worker_name,
    p_lease_token,
    now() + make_interval(secs => greatest(30, least(p_lease_seconds, 600))),
    now(),
    now()
  )
  on conflict (worker_name) do update
    set lease_token = excluded.lease_token,
        lease_until = excluded.lease_until,
        acquired_at = excluded.acquired_at,
        updated_at = excluded.updated_at
    where public.pantavion_scheduled_worker_leases.lease_until <= now()
  returning lease_token into claimed_token;

  if claimed_token is distinct from p_lease_token then
    update public.pantavion_scheduled_worker_runs
      set status = 'skipped_overlap',
          finished_at = now(),
          summary = jsonb_build_object('reason', 'active_lease')
    where run_id = p_run_id;
    return jsonb_build_object('acquired', false, 'reason', 'active_lease', 'runId', p_run_id);
  end if;

  return jsonb_build_object(
    'acquired', true,
    'reason', 'lease_acquired',
    'runId', p_run_id,
    'leaseToken', p_lease_token
  );
end;
$$;

create or replace function public.pantavion_finish_scheduled_worker(
  p_worker_name text,
  p_run_id text,
  p_lease_token text,
  p_status text,
  p_summary jsonb default '{}'::jsonb,
  p_error text default null
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  touched integer;
begin
  if p_status not in ('succeeded', 'failed') then
    raise exception 'invalid_scheduled_worker_terminal_status';
  end if;

  update public.pantavion_scheduled_worker_runs
    set status = p_status,
        finished_at = now(),
        summary = coalesce(p_summary, '{}'::jsonb),
        error = left(p_error, 2000)
  where run_id = p_run_id
    and worker_name = p_worker_name
    and lease_token = p_lease_token
    and status = 'running';

  get diagnostics touched = row_count;

  update public.pantavion_scheduled_worker_leases
    set lease_until = now(), updated_at = now()
  where worker_name = p_worker_name
    and lease_token = p_lease_token;

  return touched = 1;
end;
$$;

revoke all on function public.pantavion_claim_scheduled_worker(text, text, text, text, integer)
  from public, anon, authenticated;
revoke all on function public.pantavion_finish_scheduled_worker(text, text, text, text, jsonb, text)
  from public, anon, authenticated;
grant execute on function public.pantavion_claim_scheduled_worker(text, text, text, text, integer)
  to service_role;
grant execute on function public.pantavion_finish_scheduled_worker(text, text, text, text, jsonb, text)
  to service_role;
