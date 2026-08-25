create or replace function public.pantavion_send_message(p_conversation_id uuid,p_body text,p_client_message_id text default null,p_original_language text default null)
returns uuid language plpgsql security definer set search_path='public','pg_temp' as $$
declare actor uuid:=auth.uid(); mid uuid; clean text:=btrim(coalesce(p_body,'')); recipient uuid; conversation_kind text;
begin
 if actor is null then raise exception 'authentication required'; end if;
 if clean='' or char_length(clean)>10000 then raise exception 'invalid message body'; end if;
 if not public.pantavion_can_send_to_conversation(p_conversation_id,actor) then raise exception 'not allowed to send'; end if;
 select c.kind into conversation_kind from public.conversations c where c.id=p_conversation_id;
 if conversation_kind='direct' then
   select m.user_id into recipient from public.conversation_members m where m.conversation_id=p_conversation_id and m.user_id<>actor and m.left_at is null limit 1;
   if recipient is null or not public.pantavion_privacy_allows_direct_message(actor,recipient) then raise exception 'recipient privacy or safety policy blocks messaging'; end if;
 end if;
 if p_client_message_id is not null then select id into mid from public.messages where sender_id=actor and client_message_id=p_client_message_id limit 1; if mid is not null then return mid; end if; end if;
 insert into public.messages(conversation_id,sender_id,client_message_id,body,original_language,message_type) values(p_conversation_id,actor,nullif(p_client_message_id,''),clean,nullif(p_original_language,''),'text') returning id into mid;
 insert into public.message_receipts(message_id,user_id,state) values(mid,actor,'accepted') on conflict do nothing;
 return mid;
end $$;
revoke all on function public.pantavion_send_message(uuid,text,text,text) from public,anon;
grant execute on function public.pantavion_send_message(uuid,text,text,text) to authenticated;
