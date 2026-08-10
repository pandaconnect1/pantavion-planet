-- Pantavion Human + Communication Core runtime RPCs
-- Atomic, authenticated operations for the first end-to-end People -> Requests -> Messages flow.

create or replace function public.pantavion_request_relationship(p_addressee_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  actor uuid := auth.uid();
  existing public.relationships%rowtype;
  relationship_id uuid;
begin
  if actor is null then raise exception 'authentication required'; end if;
  if p_addressee_id is null or p_addressee_id = actor then raise exception 'invalid addressee'; end if;
  if public.pantavion_has_block_between(actor, p_addressee_id) then raise exception 'relationship blocked'; end if;

  if exists (
    select 1 from public.user_privacy_settings ps
    where ps.user_id = p_addressee_id and ps.discoverability_enabled = false
  ) then
    raise exception 'user not discoverable';
  end if;

  select * into existing
  from public.relationships r
  where least(r.requester_id, r.addressee_id) = least(actor, p_addressee_id)
    and greatest(r.requester_id, r.addressee_id) = greatest(actor, p_addressee_id)
  limit 1;

  if found then
    if existing.status in ('pending','accepted') then
      return existing.id;
    end if;
    delete from public.relationships where id = existing.id;
  end if;

  insert into public.relationships (requester_id, addressee_id, status)
  values (actor, p_addressee_id, 'pending')
  returning id into relationship_id;

  return relationship_id;
end;
$$;

create or replace function public.pantavion_respond_relationship(
  p_relationship_id uuid,
  p_action text
)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  actor uuid := auth.uid();
  rel public.relationships%rowtype;
  next_status text;
begin
  if actor is null then raise exception 'authentication required'; end if;
  if p_action not in ('accept','decline') then raise exception 'invalid action'; end if;

  select * into rel from public.relationships where id = p_relationship_id for update;
  if not found then raise exception 'relationship not found'; end if;
  if rel.addressee_id <> actor or rel.status <> 'pending' then raise exception 'not allowed'; end if;
  if public.pantavion_has_block_between(rel.requester_id, rel.addressee_id) then raise exception 'relationship blocked'; end if;

  next_status := case when p_action = 'accept' then 'accepted' else 'declined' end;
  update public.relationships set status = next_status where id = p_relationship_id;
  return next_status;
end;
$$;

create or replace function public.pantavion_create_direct_conversation(p_other_user_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  actor uuid := auth.uid();
  conversation_id uuid;
begin
  if actor is null then raise exception 'authentication required'; end if;
  if p_other_user_id is null or p_other_user_id = actor then raise exception 'invalid participant'; end if;
  if public.pantavion_has_block_between(actor, p_other_user_id) then raise exception 'conversation blocked'; end if;

  if not exists (
    select 1 from public.relationships r
    where r.status = 'accepted'
      and ((r.requester_id = actor and r.addressee_id = p_other_user_id)
        or (r.requester_id = p_other_user_id and r.addressee_id = actor))
  ) then
    raise exception 'accepted relationship required';
  end if;

  if exists (
    select 1 from public.user_privacy_settings ps
    where ps.user_id = p_other_user_id and ps.messaging_policy = 'nobody'
  ) then
    raise exception 'recipient does not accept messages';
  end if;

  select c.id into conversation_id
  from public.conversations c
  where c.kind = 'direct'
    and exists (select 1 from public.conversation_members a where a.conversation_id = c.id and a.user_id = actor and a.left_at is null)
    and exists (select 1 from public.conversation_members b where b.conversation_id = c.id and b.user_id = p_other_user_id and b.left_at is null)
    and 2 = (select count(*) from public.conversation_members m where m.conversation_id = c.id and m.left_at is null)
  order by c.created_at asc
  limit 1;

  if conversation_id is not null then return conversation_id; end if;

  insert into public.conversations (kind, created_by)
  values ('direct', actor)
  returning id into conversation_id;

  insert into public.conversation_members (conversation_id, user_id, role)
  values
    (conversation_id, actor, 'owner'),
    (conversation_id, p_other_user_id, 'member');

  return conversation_id;
end;
$$;

create or replace function public.pantavion_send_message(
  p_conversation_id uuid,
  p_body text,
  p_client_message_id text default null,
  p_original_language text default null
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  actor uuid := auth.uid();
  message_id uuid;
  clean_body text := btrim(coalesce(p_body, ''));
begin
  if actor is null then raise exception 'authentication required'; end if;
  if clean_body = '' then raise exception 'message body required'; end if;
  if char_length(clean_body) > 10000 then raise exception 'message too long'; end if;
  if not public.pantavion_can_send_to_conversation(p_conversation_id, actor) then raise exception 'not allowed to send'; end if;

  if p_client_message_id is not null then
    select id into message_id
    from public.messages
    where sender_id = actor and client_message_id = p_client_message_id
    limit 1;
    if message_id is not null then return message_id; end if;
  end if;

  insert into public.messages (conversation_id, sender_id, client_message_id, body, original_language, message_type)
  values (p_conversation_id, actor, nullif(p_client_message_id, ''), clean_body, nullif(p_original_language, ''), 'text')
  returning id into message_id;

  insert into public.message_receipts (message_id, user_id, state)
  values (message_id, actor, 'accepted')
  on conflict do nothing;

  return message_id;
end;
$$;

create or replace function public.pantavion_mark_message_receipt(
  p_message_id uuid,
  p_state text
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  actor uuid := auth.uid();
begin
  if actor is null then raise exception 'authentication required'; end if;
  if p_state not in ('delivered','read') then raise exception 'invalid receipt state'; end if;
  if not public.pantavion_can_access_message(p_message_id, actor) then raise exception 'message not accessible'; end if;

  insert into public.message_receipts (message_id, user_id, state)
  values (p_message_id, actor, p_state)
  on conflict do nothing;
end;
$$;

revoke all on function public.pantavion_request_relationship(uuid) from public;
revoke all on function public.pantavion_respond_relationship(uuid, text) from public;
revoke all on function public.pantavion_create_direct_conversation(uuid) from public;
revoke all on function public.pantavion_send_message(uuid, text, text, text) from public;
revoke all on function public.pantavion_mark_message_receipt(uuid, text) from public;

grant execute on function public.pantavion_request_relationship(uuid) to authenticated;
grant execute on function public.pantavion_respond_relationship(uuid, text) to authenticated;
grant execute on function public.pantavion_create_direct_conversation(uuid) to authenticated;
grant execute on function public.pantavion_send_message(uuid, text, text, text) to authenticated;
grant execute on function public.pantavion_mark_message_receipt(uuid, text) to authenticated;
