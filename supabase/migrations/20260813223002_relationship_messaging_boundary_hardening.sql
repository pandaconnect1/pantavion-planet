-- Harden relationship acceptance and hide internal authorization helpers from API callers.

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
  ns text;
begin
  if actor is null then
    raise exception 'authentication required' using errcode = '28000';
  end if;

  if p_action not in ('accept','decline') then
    raise exception 'invalid action' using errcode = '22023';
  end if;

  select * into rel
  from public.relationships
  where id = p_relationship_id
  for update;

  if not found or rel.addressee_id <> actor or rel.status <> 'pending' then
    raise exception 'not allowed' using errcode = '42501';
  end if;

  if p_action = 'accept' then
    if public.pantavion_has_block_between(rel.requester_id, rel.addressee_id) then
      raise exception 'relationship blocked' using errcode = '42501';
    end if;

    if not public.pantavion_safety_allows_new_contacts(rel.requester_id)
       or not public.pantavion_safety_allows_new_contacts(rel.addressee_id) then
      raise exception 'new contact activity is restricted' using errcode = '42501';
    end if;
  end if;

  ns := case when p_action = 'accept' then 'accepted' else 'declined' end;

  update public.relationships
  set status = ns,
      updated_at = now()
  where id = p_relationship_id;

  return ns;
end;
$$;

-- These are implementation-detail authorization predicates. SECURITY DEFINER callers
-- can still use them, but they should not be exposed as arbitrary RPC probes.
revoke all on function public.pantavion_are_connections(uuid, uuid) from public, anon, authenticated;
revoke all on function public.pantavion_has_block_between(uuid, uuid) from public, anon, authenticated;
revoke all on function public.pantavion_safety_allows_messages(uuid) from public, anon, authenticated;
revoke all on function public.pantavion_safety_allows_new_contacts(uuid) from public, anon, authenticated;
revoke all on function public.pantavion_can_access_message(uuid, uuid) from public, anon, authenticated;
revoke all on function public.pantavion_can_send_to_conversation(uuid, uuid) from public, anon, authenticated;

-- Explicitly preserve only the intended authenticated API surface.
revoke all on function public.pantavion_request_relationship(uuid) from public, anon;
grant execute on function public.pantavion_request_relationship(uuid) to authenticated;
revoke all on function public.pantavion_respond_relationship(uuid, text) from public, anon;
grant execute on function public.pantavion_respond_relationship(uuid, text) to authenticated;
revoke all on function public.pantavion_create_direct_conversation(uuid) from public, anon;
grant execute on function public.pantavion_create_direct_conversation(uuid) to authenticated;
revoke all on function public.pantavion_send_message(uuid, text, text, text) from public, anon;
grant execute on function public.pantavion_send_message(uuid, text, text, text) to authenticated;
revoke all on function public.pantavion_mark_message_receipt(uuid, text) from public, anon;
grant execute on function public.pantavion_mark_message_receipt(uuid, text) to authenticated;
