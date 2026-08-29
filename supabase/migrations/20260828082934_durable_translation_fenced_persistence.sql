-- Pantavion durable translation side-effect fencing
-- The worker lease check and the translation message dedupe/insert happen in one PostgreSQL transaction.
-- A stale/reclaimed worker therefore cannot persist the user-visible translation side effect.

create or replace function public.pantavion_persist_translation_message_fenced(
  p_execution_id text,
  p_lease_owner text,
  p_fencing_token bigint,
  p_conversation_id uuid,
  p_sender_id uuid,
  p_client_message_id text,
  p_body text,
  p_original_language text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_now timestamptz := clock_timestamp();
  v_owner text := btrim(coalesce(p_lease_owner, ''));
  v_client_message_id text := btrim(coalesce(p_client_message_id, ''));
  v_body text := btrim(coalesce(p_body, ''));
  v_execution public.durable_executions%rowtype;
  v_existing public.messages%rowtype;
  v_inserted public.messages%rowtype;
begin
  if v_owner = '' or char_length(v_owner) > 200 then
    raise exception 'lease_owner_invalid';
  end if;

  if p_fencing_token is null or p_fencing_token < 1 then
    raise exception 'fencing_token_invalid';
  end if;

  if p_conversation_id is null then
    raise exception 'translation_conversation_id_required';
  end if;

  if p_sender_id is null then
    raise exception 'translation_sender_id_required';
  end if;

  if v_client_message_id = '' or char_length(v_client_message_id) > 300 then
    raise exception 'translation_client_message_id_invalid';
  end if;

  if v_body = '' then
    raise exception 'translation_body_required';
  end if;

  if p_metadata is not null and jsonb_typeof(p_metadata) <> 'object' then
    raise exception 'translation_metadata_object_required';
  end if;

  select d.*
    into v_execution
  from public.durable_executions as d
  where d.execution_id = p_execution_id
    and d.task_name = 'translation:process_message'
    and d.status = 'running'
    and d.lease_owner = v_owner
    and d.lease_token = p_fencing_token
    and d.lease_expires_at is not null
    and d.lease_expires_at > v_now
  for update;

  if not found then
    return null;
  end if;

  -- Bind the side effect to the canonical execution input so a service worker cannot
  -- redirect a valid lease to another conversation or system sender.
  if coalesce(v_execution.input->>'conversationId', '') <> p_conversation_id::text then
    return null;
  end if;

  if coalesce(v_execution.input->>'systemSenderId', '') <> p_sender_id::text then
    return null;
  end if;

  if v_client_message_id <> 'translation:' || p_execution_id then
    return null;
  end if;

  select m.*
    into v_existing
  from public.messages as m
  where m.sender_id = p_sender_id
    and m.client_message_id = v_client_message_id
  limit 1;

  if found then
    if v_existing.conversation_id <> p_conversation_id then
      raise exception 'translation_idempotency_identity_conflict';
    end if;

    return jsonb_build_object(
      'messageId', v_existing.id,
      'clientMessageId', v_existing.client_message_id,
      'translatedText', v_existing.body,
      'deduplicated', true
    );
  end if;

  insert into public.messages(
    conversation_id,
    sender_id,
    client_message_id,
    body,
    original_language,
    message_type,
    metadata,
    created_at,
    updated_at
  )
  values (
    p_conversation_id,
    p_sender_id,
    v_client_message_id,
    v_body,
    nullif(btrim(coalesce(p_original_language, '')), ''),
    'system',
    coalesce(p_metadata, '{}'::jsonb) || jsonb_build_object('kind', 'translation'),
    v_now,
    v_now
  )
  returning * into v_inserted;

  return jsonb_build_object(
    'messageId', v_inserted.id,
    'clientMessageId', v_inserted.client_message_id,
    'translatedText', v_inserted.body,
    'deduplicated', false
  );
end;
$$;

revoke all on function public.pantavion_persist_translation_message_fenced(
  text, text, bigint, uuid, uuid, text, text, text, jsonb
) from public, anon, authenticated;

grant execute on function public.pantavion_persist_translation_message_fenced(
  text, text, bigint, uuid, uuid, text, text, text, jsonb
) to service_role;
