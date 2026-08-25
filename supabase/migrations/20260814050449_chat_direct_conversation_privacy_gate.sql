create or replace function public.pantavion_create_direct_conversation(p_other_user_id uuid)
returns uuid language plpgsql security definer set search_path='public','pg_temp' as $$
declare actor uuid:=auth.uid(); cid uuid;
begin
 if actor is null then raise exception 'authentication required'; end if;
 if p_other_user_id is null or p_other_user_id=actor then raise exception 'invalid participant'; end if;
 if not public.pantavion_privacy_allows_direct_message(actor,p_other_user_id) then raise exception 'recipient privacy or safety policy blocks direct messaging'; end if;
 if not public.pantavion_are_connections(actor,p_other_user_id) then raise exception 'accepted relationship required'; end if;
 select c.id into cid from public.conversations c where c.kind='direct'
 and exists(select 1 from public.conversation_members m where m.conversation_id=c.id and m.user_id=actor and m.left_at is null)
 and exists(select 1 from public.conversation_members m where m.conversation_id=c.id and m.user_id=p_other_user_id and m.left_at is null)
 and 2=(select count(*) from public.conversation_members m where m.conversation_id=c.id and m.left_at is null) limit 1;
 if cid is not null then return cid; end if;
 insert into public.conversations(kind,created_by) values('direct',actor) returning id into cid;
 insert into public.conversation_members(conversation_id,user_id,role) values(cid,actor,'owner'),(cid,p_other_user_id,'member');
 return cid;
end $$;
revoke all on function public.pantavion_create_direct_conversation(uuid) from public,anon;
grant execute on function public.pantavion_create_direct_conversation(uuid) to authenticated;
