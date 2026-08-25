create or replace function public.pantavion_privacy_allows_direct_message(p_sender uuid,p_recipient uuid)
returns boolean language sql stable security definer set search_path='public','pg_temp' as $$
 select case
   when p_sender is null or p_recipient is null or p_sender=p_recipient then false
   when not public.pantavion_safety_allows_messages(p_sender) or not public.pantavion_safety_allows_messages(p_recipient) then false
   when public.pantavion_has_block_between(p_sender,p_recipient) then false
   when not public.pantavion_minor_contact_allowed(p_sender,p_recipient) then false
   when coalesce((select messaging_policy from public.user_privacy_settings where user_id=p_recipient),'requests')='nobody' then false
   when coalesce((select messaging_policy from public.user_privacy_settings where user_id=p_recipient),'requests')='connections' then public.pantavion_are_connections(p_sender,p_recipient)
   else true end;
$$;
revoke all on function public.pantavion_privacy_allows_direct_message(uuid,uuid) from public,anon,authenticated;
