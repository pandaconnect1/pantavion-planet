\set ON_ERROR_STOP on

-- Real PostgreSQL integration proof for Pantavion durable worker fencing.
-- The durable runtime + fencing migrations must already be applied to this ephemeral database.

do $$
declare
  v_claim_a jsonb;
  v_claim_b jsonb;
  v_finish jsonb;
  v_checkpoint text;
  v_status text;
  v_owner text;
  v_token bigint;
  v_attempt integer;
  v_idempotency text;
begin
  if to_regprocedure('public.pantavion_claim_durable_execution_fenced(text,text,integer,text[])') is null then
    raise exception 'fenced_claim_rpc_missing';
  end if;
  if to_regprocedure('public.pantavion_heartbeat_durable_execution_fenced(text,text,bigint,integer)') is null then
    raise exception 'fenced_heartbeat_rpc_missing';
  end if;
  if to_regprocedure('public.pantavion_append_durable_checkpoint_fenced(text,text,bigint,text,jsonb)') is null then
    raise exception 'fenced_checkpoint_rpc_missing';
  end if;
  if to_regprocedure('public.pantavion_finish_durable_execution_fenced(text,text,bigint,boolean,jsonb,text)') is null then
    raise exception 'fenced_finish_rpc_missing';
  end if;

  if has_function_privilege(
    'anon',
    'public.pantavion_claim_durable_execution_fenced(text,text,integer,text[])',
    'EXECUTE'
  ) then
    raise exception 'anon_can_execute_fenced_claim';
  end if;

  if has_function_privilege(
    'authenticated',
    'public.pantavion_finish_durable_execution_fenced(text,text,bigint,boolean,jsonb,text)',
    'EXECUTE'
  ) then
    raise exception 'authenticated_can_execute_fenced_finish';
  end if;

  if not has_function_privilege(
    'service_role',
    'public.pantavion_claim_durable_execution_fenced(text,text,integer,text[])',
    'EXECUTE'
  ) then
    raise exception 'service_role_cannot_execute_fenced_claim';
  end if;

  insert into public.durable_executions(
    execution_id,
    idempotency_key,
    task_name,
    status,
    max_attempts
  ) values (
    'fencing-race-1',
    'fencing-race-idempotency-1',
    'translation:process_message',
    'queued',
    3
  );

  v_claim_a := public.pantavion_claim_durable_execution_fenced(
    'fencing-race-1',
    'worker-a',
    120,
    array['queued','planned']::text[]
  );

  if v_claim_a is null then
    raise exception 'worker_a_failed_initial_claim';
  end if;
  if (v_claim_a->>'fencingToken')::bigint <> 1 then
    raise exception 'worker_a_wrong_initial_token:%', v_claim_a;
  end if;
  if (v_claim_a->>'attempt')::integer <> 1 then
    raise exception 'worker_a_wrong_initial_attempt:%', v_claim_a;
  end if;

  v_claim_b := public.pantavion_claim_durable_execution_fenced(
    'fencing-race-1',
    'worker-b',
    120,
    array['queued','planned']::text[]
  );
  if v_claim_b is not null then
    raise exception 'second_worker_won_unexpired_lease:%', v_claim_b;
  end if;

  if not public.pantavion_heartbeat_durable_execution_fenced(
    'fencing-race-1',
    'worker-a',
    1,
    120
  ) then
    raise exception 'worker_a_heartbeat_failed';
  end if;

  v_checkpoint := public.pantavion_append_durable_checkpoint_fenced(
    'fencing-race-1',
    'worker-a',
    1,
    'worker_a_checkpoint',
    '{"owner":"a"}'::jsonb
  );
  if v_checkpoint is null then
    raise exception 'worker_a_checkpoint_failed';
  end if;

  -- Test-only forced expiry: a new worker must receive a strictly newer token.
  update public.durable_executions
  set lease_expires_at = clock_timestamp() - interval '1 second'
  where execution_id = 'fencing-race-1';

  v_claim_b := public.pantavion_claim_durable_execution_fenced(
    'fencing-race-1',
    'worker-b',
    120,
    array['queued','planned']::text[]
  );
  if v_claim_b is null then
    raise exception 'worker_b_failed_expired_reclaim';
  end if;
  if (v_claim_b->>'fencingToken')::bigint <> 2 then
    raise exception 'worker_b_reclaim_token_not_monotonic:%', v_claim_b;
  end if;
  if (v_claim_b->>'attempt')::integer <> 2 then
    raise exception 'worker_b_reclaim_attempt_wrong:%', v_claim_b;
  end if;

  if public.pantavion_heartbeat_durable_execution_fenced(
    'fencing-race-1',
    'worker-a',
    1,
    120
  ) then
    raise exception 'stale_worker_heartbeat_accepted';
  end if;

  v_checkpoint := public.pantavion_append_durable_checkpoint_fenced(
    'fencing-race-1',
    'worker-a',
    1,
    'stale_checkpoint',
    '{}'::jsonb
  );
  if v_checkpoint is not null then
    raise exception 'stale_worker_checkpoint_accepted:%', v_checkpoint;
  end if;

  v_finish := public.pantavion_finish_durable_execution_fenced(
    'fencing-race-1',
    'worker-a',
    1,
    true,
    '{"stale":true}'::jsonb,
    null
  );
  if v_finish is not null then
    raise exception 'stale_worker_finish_accepted:%', v_finish;
  end if;

  v_checkpoint := public.pantavion_append_durable_checkpoint_fenced(
    'fencing-race-1',
    'worker-b',
    2,
    'worker_b_checkpoint',
    '{"owner":"b"}'::jsonb
  );
  if v_checkpoint is null then
    raise exception 'worker_b_checkpoint_failed';
  end if;

  v_finish := public.pantavion_finish_durable_execution_fenced(
    'fencing-race-1',
    'worker-b',
    2,
    true,
    '{"ok":true}'::jsonb,
    null
  );
  if v_finish is null or v_finish->>'status' <> 'succeeded' then
    raise exception 'worker_b_success_finish_failed:%', v_finish;
  end if;

  select status, lease_owner, lease_token, attempt, idempotency_key
    into v_status, v_owner, v_token, v_attempt, v_idempotency
  from public.durable_executions
  where execution_id = 'fencing-race-1';

  if v_status <> 'succeeded' or v_owner is not null or v_token <> 2 or v_attempt <> 2 then
    raise exception 'final_execution_state_invalid:status=%,owner=%,token=%,attempt=%',
      v_status, v_owner, v_token, v_attempt;
  end if;
  if v_idempotency <> 'fencing-race-idempotency-1' then
    raise exception 'idempotency_identity_changed_after_reclaim';
  end if;

  -- Retry must release ownership without resetting the monotonic token or identity.
  insert into public.durable_executions(
    execution_id,
    idempotency_key,
    task_name,
    status,
    max_attempts
  ) values (
    'fencing-retry-1',
    'fencing-retry-idempotency-1',
    'translation:process_message',
    'queued',
    3
  );

  v_claim_a := public.pantavion_claim_durable_execution_fenced(
    'fencing-retry-1',
    'worker-a',
    120,
    array['queued','planned']::text[]
  );
  if v_claim_a is null or (v_claim_a->>'fencingToken')::bigint <> 1 then
    raise exception 'retry_initial_claim_failed:%', v_claim_a;
  end if;

  v_finish := public.pantavion_finish_durable_execution_fenced(
    'fencing-retry-1',
    'worker-a',
    1,
    false,
    null,
    'provider_unavailable'
  );
  if v_finish is null or v_finish->>'status' <> 'queued' then
    raise exception 'retry_release_failed:%', v_finish;
  end if;

  select status, lease_owner, lease_token, idempotency_key
    into v_status, v_owner, v_token, v_idempotency
  from public.durable_executions
  where execution_id = 'fencing-retry-1';
  if v_status <> 'queued' or v_owner is not null or v_token <> 1 then
    raise exception 'retry_release_state_invalid:status=%,owner=%,token=%', v_status, v_owner, v_token;
  end if;
  if v_idempotency <> 'fencing-retry-idempotency-1' then
    raise exception 'retry_idempotency_identity_changed';
  end if;

  v_claim_b := public.pantavion_claim_durable_execution_fenced(
    'fencing-retry-1',
    'worker-b',
    120,
    array['queued','planned']::text[]
  );
  if v_claim_b is null or (v_claim_b->>'fencingToken')::bigint <> 2 then
    raise exception 'retry_reclaim_token_not_monotonic:%', v_claim_b;
  end if;
end;
$$;

select 'pantavion_durable_fencing_postgres_test: PASS' as result;
