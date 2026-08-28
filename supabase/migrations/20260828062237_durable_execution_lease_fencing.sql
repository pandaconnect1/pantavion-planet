-- Pantavion durable execution lease fencing
-- Adds server-enforced worker identity, bounded leases and monotonic fencing tokens.
-- Backward-compatible: the original claim/checkpoint RPCs remain available during rollout.

alter table public.durable_executions
  add column if not exists lease_owner text,
  add column if not exists lease_token bigint not null default 0,
  add column if not exists lease_expires_at timestamptz,
  add column if not exists lease_heartbeat_at timestamptz;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'durable_executions_lease_token_nonnegative'
      and conrelid = 'public.durable_executions'::regclass
  ) then
    alter table public.durable_executions
      add constraint durable_executions_lease_token_nonnegative check (lease_token >= 0);
  end if;
  if not exists (
    select 1 from pg_constraint
    where conname = 'durable_executions_lease_owner_length'
      and conrelid = 'public.durable_executions'::regclass
  ) then
    alter table public.durable_executions
      add constraint durable_executions_lease_owner_length
      check (lease_owner is null or char_length(lease_owner) between 1 and 200);
  end if;
end;
$$;

create index if not exists durable_executions_running_lease_expiry_idx
  on public.durable_executions(lease_expires_at asc, updated_at asc)
  where status = 'running' and lease_expires_at is not null;

create or replace function public.pantavion_claim_durable_execution_fenced(
  p_execution_id text,
  p_lease_owner text,
  p_lease_seconds integer default 120,
  p_expected_statuses text[] default array['queued','planned']::text[]
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_now timestamptz := clock_timestamp();
  v_owner text := btrim(coalesce(p_lease_owner, ''));
  v_result jsonb;
begin
  if v_owner = '' or char_length(v_owner) > 200 then raise exception 'lease_owner_invalid'; end if;
  if p_lease_seconds is null or p_lease_seconds < 5 or p_lease_seconds > 300 then raise exception 'lease_seconds_out_of_bounds'; end if;

  update public.durable_executions as d
  set status = 'running', attempt = d.attempt + 1, last_error = null,
      lease_owner = v_owner, lease_token = d.lease_token + 1,
      lease_expires_at = v_now + make_interval(secs => p_lease_seconds),
      lease_heartbeat_at = v_now, updated_at = v_now
  where d.execution_id = p_execution_id
    and d.attempt < d.max_attempts
    and ((d.status in ('queued','planned') and d.status = any(coalesce(p_expected_statuses,array['queued','planned']::text[])))
      or (d.status = 'running' and (d.lease_expires_at is null or d.lease_expires_at <= v_now)))
  returning jsonb_build_object(
    'executionId',d.execution_id,'ownerId',d.lease_owner,'fencingToken',d.lease_token,
    'leaseExpiresAt',d.lease_expires_at,'heartbeatAt',d.lease_heartbeat_at,'attempt',d.attempt
  ) into v_result;
  return v_result;
end;
$$;

create or replace function public.pantavion_heartbeat_durable_execution_fenced(
  p_execution_id text, p_lease_owner text, p_fencing_token bigint, p_lease_seconds integer default 120
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_now timestamptz := clock_timestamp(); v_owner text := btrim(coalesce(p_lease_owner,'')); v_touched integer;
begin
  if v_owner = '' or char_length(v_owner) > 200 then raise exception 'lease_owner_invalid'; end if;
  if p_fencing_token is null or p_fencing_token < 1 then raise exception 'fencing_token_invalid'; end if;
  if p_lease_seconds is null or p_lease_seconds < 5 or p_lease_seconds > 300 then raise exception 'lease_seconds_out_of_bounds'; end if;
  update public.durable_executions as d
  set lease_expires_at=v_now+make_interval(secs=>p_lease_seconds), lease_heartbeat_at=v_now, updated_at=v_now
  where d.execution_id=p_execution_id and d.status='running' and d.lease_owner=v_owner
    and d.lease_token=p_fencing_token and d.lease_expires_at is not null and d.lease_expires_at>v_now;
  get diagnostics v_touched = row_count; return v_touched=1;
end;
$$;

create or replace function public.pantavion_append_durable_checkpoint_fenced(
  p_execution_id text, p_lease_owner text, p_fencing_token bigint,
  p_label text, p_state jsonb default '{}'::jsonb
)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_now timestamptz:=clock_timestamp(); v_owner text:=btrim(coalesce(p_lease_owner,''));
  v_label text:=btrim(coalesce(p_label,'')); v_execution public.durable_executions%rowtype;
  v_next_sequence integer; v_checkpoint_id text;
begin
  if v_owner='' or char_length(v_owner)>200 then raise exception 'lease_owner_invalid'; end if;
  if p_fencing_token is null or p_fencing_token<1 then raise exception 'fencing_token_invalid'; end if;
  if v_label='' or char_length(v_label)>200 then raise exception 'checkpoint_label_invalid'; end if;
  select d.* into v_execution from public.durable_executions d
  where d.execution_id=p_execution_id and d.status='running' and d.lease_owner=v_owner
    and d.lease_token=p_fencing_token and d.lease_expires_at is not null and d.lease_expires_at>v_now for update;
  if not found then return null; end if;
  select coalesce(max(c.sequence),0)+1 into v_next_sequence from public.durable_execution_checkpoints c where c.execution_id=p_execution_id;
  v_checkpoint_id:=p_execution_id||':'||v_next_sequence::text;
  insert into public.durable_execution_checkpoints(checkpoint_id,execution_id,sequence,label,state,created_at)
  values(v_checkpoint_id,p_execution_id,v_next_sequence,v_label,coalesce(p_state,'{}'::jsonb),v_now);
  update public.durable_executions set updated_at=v_now where execution_id=p_execution_id;
  return v_checkpoint_id;
end;
$$;

create or replace function public.pantavion_finish_durable_execution_fenced(
  p_execution_id text, p_lease_owner text, p_fencing_token bigint, p_succeeded boolean,
  p_output jsonb default null, p_error text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_now timestamptz:=clock_timestamp(); v_owner text:=btrim(coalesce(p_lease_owner,''));
  v_execution public.durable_executions%rowtype; v_next_sequence integer; v_checkpoint_id text;
  v_status text; v_label text; v_state jsonb:='{}'::jsonb; v_error text:=nullif(btrim(coalesce(p_error,'')),'');
begin
  if v_owner='' or char_length(v_owner)>200 then raise exception 'lease_owner_invalid'; end if;
  if p_fencing_token is null or p_fencing_token<1 then raise exception 'fencing_token_invalid'; end if;
  if p_succeeded is null then raise exception 'finish_outcome_required'; end if;
  if not p_succeeded and v_error is null then raise exception 'finish_error_required'; end if;
  select d.* into v_execution from public.durable_executions d
  where d.execution_id=p_execution_id and d.status='running' and d.lease_owner=v_owner
    and d.lease_token=p_fencing_token and d.lease_expires_at is not null and d.lease_expires_at>v_now for update;
  if not found then return null; end if;
  if p_succeeded then v_status:='succeeded'; v_label:='succeeded';
  elsif v_execution.attempt>=v_execution.max_attempts then
    v_status:='failed'; v_label:='failed'; v_state:=jsonb_build_object('error',v_error,'attempt',v_execution.attempt,'maxAttempts',v_execution.max_attempts);
  else
    v_status:='queued'; v_label:='retry_scheduled'; v_state:=jsonb_build_object('error',v_error,'attempt',v_execution.attempt,'maxAttempts',v_execution.max_attempts);
  end if;
  select coalesce(max(c.sequence),0)+1 into v_next_sequence from public.durable_execution_checkpoints c where c.execution_id=p_execution_id;
  v_checkpoint_id:=p_execution_id||':'||v_next_sequence::text;
  insert into public.durable_execution_checkpoints(checkpoint_id,execution_id,sequence,label,state,created_at)
  values(v_checkpoint_id,p_execution_id,v_next_sequence,v_label,v_state,v_now);
  update public.durable_executions set status=v_status,
    output=case when p_succeeded then p_output else null end,
    last_error=case when p_succeeded then null else v_error end,
    lease_owner=null, lease_expires_at=null, lease_heartbeat_at=v_now, updated_at=v_now
  where execution_id=p_execution_id;
  return jsonb_build_object('executionId',p_execution_id,'status',v_status,'fencingToken',p_fencing_token,'checkpointId',v_checkpoint_id,'attempt',v_execution.attempt);
end;
$$;

revoke all on function public.pantavion_claim_durable_execution_fenced(text,text,integer,text[]) from public, anon, authenticated;
revoke all on function public.pantavion_heartbeat_durable_execution_fenced(text,text,bigint,integer) from public, anon, authenticated;
revoke all on function public.pantavion_append_durable_checkpoint_fenced(text,text,bigint,text,jsonb) from public, anon, authenticated;
revoke all on function public.pantavion_finish_durable_execution_fenced(text,text,bigint,boolean,jsonb,text) from public, anon, authenticated;
grant execute on function public.pantavion_claim_durable_execution_fenced(text,text,integer,text[]) to service_role;
grant execute on function public.pantavion_heartbeat_durable_execution_fenced(text,text,bigint,integer) to service_role;
grant execute on function public.pantavion_append_durable_checkpoint_fenced(text,text,bigint,text,jsonb) to service_role;
grant execute on function public.pantavion_finish_durable_execution_fenced(text,text,bigint,boolean,jsonb,text) to service_role;
