-- Pantavion atomic recovery partition materialization
-- Production-applied evidence artifact: 2026-09-15
-- This file records the exact production RPC definition applied to Supabase.
-- It is intentionally not placed under supabase/migrations because the migration CLI
-- was not used to generate a canonical migration filename during the emergency live fix.
-- A formal generated migration may later reference this exact definition.

create or replace function public.pantavion_materialize_recovery_partitions_atomic(p_limit integer default 25)
returns jsonb
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_partition_count constant integer := 165;
  v_batch_size constant integer := 500;
  v_source_record_count constant integer := 82413;
  v_intent_id constant text := 'total_ingest_004';
  v_task_name constant text := 'pantavion:recovery_partition:v1';
  v_source_fingerprint constant text := '99ff942f154e3dac6298488923e15436c9ebf652b64bc14bcfb72efc82b22d2d';
  v_ordered_id_fingerprint constant text := 'd796a55c548655fda8b1014f4db810a7cf7b5f1aef8c7441b985faa8baa00b51';
  v_limit integer;
  v_ordinal integer;
  v_start_unit integer;
  v_end_unit integer;
  v_unit_count integer;
  v_execution_id text;
  v_idempotency_key text;
  v_checkpoint_id text;
  v_now timestamptz;
  v_input jsonb;
  v_checkpoint_state jsonb;
  v_match_count integer;
  v_checkpoint_match_count integer;
  v_created integer := 0;
  v_existing integer := 0;
  v_repaired_checkpoints integer := 0;
  v_row public.durable_executions%rowtype;
  v_checkpoint public.durable_execution_checkpoints%rowtype;
begin
  v_limit := greatest(1, least(coalesce(p_limit, 25), 25));

  perform pg_advisory_xact_lock(hashtextextended('pantavion_recovery_partition_materialization_v1', 0));

  for v_ordinal in 1..v_partition_count loop
    v_start_unit := ((v_ordinal - 1) * v_batch_size) + 1;
    v_end_unit := least(v_ordinal * v_batch_size, v_source_record_count);
    v_unit_count := v_end_unit - v_start_unit + 1;
    v_execution_id := 'recovery:' || v_intent_id || ':partition:' || lpad(v_ordinal::text, 3, '0');
    v_idempotency_key := 'pantavion_recovery_partition_v1:' || v_source_fingerprint || ':' || v_ordinal::text;
    v_checkpoint_id := v_execution_id || ':1';

    v_input := jsonb_build_object(
      'marker', 'pantavion_recovery_execution_partition_v1',
      'intentId', v_intent_id,
      'sourceFingerprint', v_source_fingerprint,
      'orderedIdFingerprint', v_ordered_id_fingerprint,
      'sourceRecordCount', v_source_record_count,
      'partitionOrdinal', v_ordinal,
      'partitionCount', v_partition_count,
      'batchSize', v_batch_size,
      'startUnit', v_start_unit,
      'endUnit', v_end_unit,
      'unitCount', v_unit_count,
      'sourceOrdinalBinding', 'canonical_corpus_ordered_record_id',
      'authority', jsonb_build_object(
        'internalAnalysis', true,
        'internalPlanning', true,
        'codeMutation', false,
        'productionWrite', false,
        'merge', false,
        'deployment', false,
        'publicExposure', false,
        'release', false
      )
    );

    v_checkpoint_state := jsonb_build_object(
      'marker', 'pantavion_recovery_partition_materialized_v1',
      'intentId', v_intent_id,
      'partitionOrdinal', v_ordinal,
      'startUnit', v_start_unit,
      'endUnit', v_end_unit,
      'unitCount', v_unit_count,
      'immutableCorpusBinding', true,
      'readyFor', 'pantavion_in_process_recovery_executor',
      'externalWorkerAllowed', false,
      'productionWriteAllowed', false,
      'mergeAllowed', false,
      'deploymentAllowed', false,
      'publicExposureAllowed', false,
      'releaseAllowed', false
    );

    select count(*)
      into v_match_count
    from public.durable_executions
    where execution_id = v_execution_id
       or idempotency_key = v_idempotency_key;

    if v_match_count > 1 then
      raise exception 'recovery_partition_identity_conflict:%', v_ordinal;
    elsif v_match_count = 1 then
      select *
        into v_row
      from public.durable_executions
      where execution_id = v_execution_id
         or idempotency_key = v_idempotency_key
      for update;

      if v_row.execution_id <> v_execution_id
         or v_row.idempotency_key <> v_idempotency_key
         or v_row.task_name is distinct from v_task_name
         or v_row.input is distinct from v_input then
        raise exception 'recovery_partition_identity_mismatch:%', v_ordinal;
      end if;

      v_existing := v_existing + 1;
    else
      if v_created >= v_limit then
        continue;
      end if;

      v_now := clock_timestamp();
      insert into public.durable_executions(
        execution_id,
        idempotency_key,
        task_name,
        status,
        attempt,
        max_attempts,
        input,
        output,
        last_error,
        created_at,
        updated_at,
        lease_owner,
        lease_token,
        lease_expires_at,
        lease_heartbeat_at
      ) values (
        v_execution_id,
        v_idempotency_key,
        v_task_name,
        'planned',
        0,
        5,
        v_input,
        null,
        null,
        v_now,
        v_now,
        null,
        0,
        null,
        null
      );

      v_created := v_created + 1;
    end if;

    select count(*)
      into v_checkpoint_match_count
    from public.durable_execution_checkpoints
    where checkpoint_id = v_checkpoint_id
       or (execution_id = v_execution_id and sequence = 1);

    if v_checkpoint_match_count > 1 then
      raise exception 'recovery_partition_checkpoint_conflict:%', v_ordinal;
    elsif v_checkpoint_match_count = 1 then
      select *
        into v_checkpoint
      from public.durable_execution_checkpoints
      where checkpoint_id = v_checkpoint_id
         or (execution_id = v_execution_id and sequence = 1)
      for update;

      if v_checkpoint.checkpoint_id <> v_checkpoint_id
         or v_checkpoint.execution_id <> v_execution_id
         or v_checkpoint.sequence <> 1
         or v_checkpoint.label <> 'pantavion_recovery_partition_materialized'
         or v_checkpoint.state is distinct from v_checkpoint_state then
        raise exception 'recovery_partition_checkpoint_mismatch:%', v_ordinal;
      end if;
    else
      v_now := clock_timestamp();
      insert into public.durable_execution_checkpoints(
        checkpoint_id,
        execution_id,
        sequence,
        label,
        state,
        created_at
      ) values (
        v_checkpoint_id,
        v_execution_id,
        1,
        'pantavion_recovery_partition_materialized',
        v_checkpoint_state,
        v_now
      );

      if v_match_count = 1 then
        v_repaired_checkpoints := v_repaired_checkpoints + 1;
      end if;
    end if;
  end loop;

  return jsonb_build_object(
    'ok', true,
    'marker', 'pantavion_recovery_partition_atomic_materialization_v1',
    'sourceRecordCount', v_source_record_count,
    'partitionCount', v_partition_count,
    'existingPartitions', v_existing,
    'createdPartitions', v_created,
    'repairedCheckpoints', v_repaired_checkpoints,
    'remainingPartitions', greatest(0, v_partition_count - v_existing - v_created),
    'limit', v_limit,
    'productionWriteAuthority', false,
    'releaseAuthority', false
  );
end;
$$;

revoke all on function public.pantavion_materialize_recovery_partitions_atomic(integer) from public;
revoke all on function public.pantavion_materialize_recovery_partitions_atomic(integer) from anon;
revoke all on function public.pantavion_materialize_recovery_partitions_atomic(integer) from authenticated;
grant execute on function public.pantavion_materialize_recovery_partitions_atomic(integer) to service_role;

comment on function public.pantavion_materialize_recovery_partitions_atomic(integer) is
'Atomically materializes bounded Pantavion recovery planning partitions and initial checkpoints from the immutable 82,413-record corpus contract. Service-role only; no production/release authority.';
