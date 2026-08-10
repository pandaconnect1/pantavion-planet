-- Pantavion Durable Execution Runtime persistence
-- Server-controlled storage for queued/running/paused/retryable long-running work.

create table if not exists public.durable_executions (
  execution_id uuid primary key,
  idempotency_key text not null unique,
  task_name text,
  status text not null check (status in ('queued','planned','running','paused','succeeded','failed','cancelled')),
  attempt integer not null default 0 check (attempt >= 0),
  max_attempts integer not null default 3 check (max_attempts >= 1),
  input jsonb,
  output jsonb,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists durable_executions_status_updated_idx
  on public.durable_executions(status, updated_at asc);
create index if not exists durable_executions_task_updated_idx
  on public.durable_executions(task_name, updated_at desc);

create table if not exists public.durable_execution_checkpoints (
  checkpoint_id text primary key,
  execution_id uuid not null references public.durable_executions(execution_id) on delete cascade,
  sequence integer not null check (sequence >= 1),
  label text not null,
  state jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(execution_id, sequence)
);

create index if not exists durable_execution_checkpoints_execution_idx
  on public.durable_execution_checkpoints(execution_id, sequence asc);

alter table public.durable_executions enable row level security;
alter table public.durable_execution_checkpoints enable row level security;

-- Durable execution is control-plane state. No direct anon/authenticated table access.
revoke all on public.durable_executions from anon, authenticated;
revoke all on public.durable_execution_checkpoints from anon, authenticated;

create or replace function public.pantavion_claim_durable_execution(
  p_execution_id uuid,
  p_expected_statuses text[] default array['queued','planned']::text[]
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  touched integer;
begin
  update public.durable_executions
  set status = 'running',
      attempt = attempt + 1,
      last_error = null,
      updated_at = now()
  where execution_id = p_execution_id
    and status = any(p_expected_statuses)
    and attempt < max_attempts;

  get diagnostics touched = row_count;
  return touched = 1;
end;
$$;

create or replace function public.pantavion_append_durable_checkpoint(
  p_execution_id uuid,
  p_label text,
  p_state jsonb default '{}'::jsonb
)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  next_sequence integer;
  new_id text;
begin
  if not exists (select 1 from public.durable_executions where execution_id = p_execution_id) then
    raise exception 'execution_not_found';
  end if;

  select coalesce(max(sequence), 0) + 1
    into next_sequence
  from public.durable_execution_checkpoints
  where execution_id = p_execution_id;

  new_id := p_execution_id::text || ':' || next_sequence::text;

  insert into public.durable_execution_checkpoints(checkpoint_id, execution_id, sequence, label, state)
  values (new_id, p_execution_id, next_sequence, p_label, coalesce(p_state, '{}'::jsonb));

  update public.durable_executions set updated_at = now() where execution_id = p_execution_id;
  return new_id;
end;
$$;

revoke all on function public.pantavion_claim_durable_execution(uuid, text[]) from public, anon, authenticated;
revoke all on function public.pantavion_append_durable_checkpoint(uuid, text, jsonb) from public, anon, authenticated;
