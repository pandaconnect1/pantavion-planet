-- Pantavion durable Foundry fencing: terminal failure finalization.
--
-- The existing fenced failure RPC intentionally retries while attempts remain.
-- Foundry also has non-retryable validation failures that must terminate
-- immediately while still enforcing the same lease owner + fencing token.

create or replace function public.pantavion_finish_durable_execution_terminal_failure_fenced(
  p_execution_id text,
  p_lease_owner text,
  p_fencing_token bigint,
  p_error text,
  p_checkpoint_label text default 'failed',
  p_checkpoint_state jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_now timestamptz := clock_timestamp();
  v_owner text := btrim(coalesce(p_lease_owner, ''));
  v_error text := nullif(btrim(coalesce(p_error, '')), '');
  v_label text := btrim(coalesce(p_checkpoint_label, ''));
  v_execution public.durable_executions%rowtype;
  v_next_sequence integer;
  v_checkpoint_id text;
  v_state jsonb := coalesce(p_checkpoint_state, '{}'::jsonb);
begin
  if p_execution_id is null or btrim(p_execution_id) = '' then
    raise exception 'execution_id_required';
  end if;

  if v_owner = '' or char_length(v_owner) > 200 then
    raise exception 'lease_owner_invalid';
  end if;

  if p_fencing_token is null or p_fencing_token < 1 then
    raise exception 'fencing_token_invalid';
  end if;

  if v_error is null then
    raise exception 'finish_error_required';
  end if;

  if v_label = '' or char_length(v_label) > 200 then
    raise exception 'checkpoint_label_invalid';
  end if;

  select d.*
    into v_execution
  from public.durable_executions as d
  where d.execution_id = p_execution_id
    and d.status = 'running'
    and d.lease_owner = v_owner
    and d.lease_token = p_fencing_token
    and d.lease_expires_at is not null
    and d.lease_expires_at > v_now
  for update;

  if not found then
    return null;
  end if;

  select coalesce(max(c.sequence), 0) + 1
    into v_next_sequence
  from public.durable_execution_checkpoints as c
  where c.execution_id = p_execution_id;

  v_checkpoint_id := p_execution_id || ':' || v_next_sequence::text;
  v_state := v_state || jsonb_build_object(
    'error', v_error,
    'attempt', v_execution.attempt,
    'maxAttempts', v_execution.max_attempts,
    'terminal', true
  );

  insert into public.durable_execution_checkpoints(
    checkpoint_id,
    execution_id,
    sequence,
    label,
    state,
    created_at
  )
  values (
    v_checkpoint_id,
    p_execution_id,
    v_next_sequence,
    v_label,
    v_state,
    v_now
  );

  update public.durable_executions
  set status = 'failed',
      output = null,
      last_error = v_error,
      lease_owner = null,
      lease_expires_at = null,
      lease_heartbeat_at = v_now,
      updated_at = v_now
  where execution_id = p_execution_id;

  return jsonb_build_object(
    'executionId', p_execution_id,
    'status', 'failed',
    'fencingToken', p_fencing_token,
    'checkpointId', v_checkpoint_id,
    'attempt', v_execution.attempt,
    'terminal', true
  );
end;
$$;

revoke all on function public.pantavion_finish_durable_execution_terminal_failure_fenced(text, text, bigint, text, text, jsonb)
  from public, anon, authenticated;

grant execute on function public.pantavion_finish_durable_execution_terminal_failure_fenced(text, text, bigint, text, text, jsonb)
  to service_role;
