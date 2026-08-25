create or replace function public.pantavion_enforce_minor_privacy()
returns trigger language plpgsql set search_path='public','pg_temp' as $$
declare band text; guardian_ok boolean;
begin
 select assessed_age_band,guardian_verified into band,guardian_ok from public.profile_age_assurance where user_id=new.user_id;
 if band='child' then
   new.profile_visibility:='private'; new.discoverability_enabled:=false; new.contact_import_enabled:=false; new.messaging_policy:='connections';
 elsif band='teen' then
   new.profile_visibility:=case when new.profile_visibility='public' then 'connections' else new.profile_visibility end;
   new.discoverability_enabled:=false; new.messaging_policy:='connections';
 end if;
 return new;
end $$;
drop trigger if exists pantavion_enforce_minor_privacy on public.user_privacy_settings;
create trigger pantavion_enforce_minor_privacy before insert or update on public.user_privacy_settings for each row execute function public.pantavion_enforce_minor_privacy();

create or replace function public.pantavion_minor_contact_allowed(p_actor uuid,p_target uuid)
returns boolean language sql stable security definer set search_path='public','pg_temp' as $$
 select case
   when exists(select 1 from public.profile_age_assurance a where a.user_id in (p_actor,p_target) and a.assessed_age_band='child') then false
   when exists(select 1 from public.profile_age_assurance a where a.user_id in (p_actor,p_target) and a.assessed_age_band='teen') then
     exists(select 1 from public.relationships r where r.status='accepted' and ((r.requester_id=p_actor and r.addressee_id=p_target) or (r.requester_id=p_target and r.addressee_id=p_actor)))
   else true end;
$$;
revoke all on function public.pantavion_minor_contact_allowed(uuid,uuid) from public,anon,authenticated;

create or replace function public.pantavion_enforce_minor_relationship()
returns trigger language plpgsql set search_path='public','pg_temp' as $$
begin
 if new.status='pending' and not public.pantavion_minor_contact_allowed(new.requester_id,new.addressee_id) then raise exception 'age safety policy blocks this contact request'; end if;
 return new;
end $$;
drop trigger if exists pantavion_enforce_minor_relationship on public.relationships;
create trigger pantavion_enforce_minor_relationship before insert or update on public.relationships for each row execute function public.pantavion_enforce_minor_relationship();

create or replace function public.pantavion_enforce_minor_direct_conversation()
returns trigger language plpgsql set search_path='public','pg_temp' as $$
declare other_user uuid;
begin
 if new.kind='direct' then
   select cm.user_id into other_user from public.conversation_members cm where cm.conversation_id=new.id and cm.user_id<>new.created_by and cm.left_at is null limit 1;
   if other_user is not null and not public.pantavion_minor_contact_allowed(new.created_by,other_user) then raise exception 'age safety policy blocks direct messaging'; end if;
 end if;
 return new;
end $$;
-- conversation membership is created after conversation row, so enforce on membership too
create or replace function public.pantavion_enforce_minor_conversation_member()
returns trigger language plpgsql set search_path='public','pg_temp' as $$
declare creator uuid; kind text;
begin
 select c.created_by,c.kind into creator,kind from public.conversations c where c.id=new.conversation_id;
 if kind='direct' and creator is not null and new.user_id<>creator and not public.pantavion_minor_contact_allowed(creator,new.user_id) then raise exception 'age safety policy blocks direct messaging'; end if;
 return new;
end $$;
drop trigger if exists pantavion_enforce_minor_conversation_member on public.conversation_members;
create trigger pantavion_enforce_minor_conversation_member before insert or update on public.conversation_members for each row execute function public.pantavion_enforce_minor_conversation_member();

create or replace function public.pantavion_enforce_minor_public_post()
returns trigger language plpgsql set search_path='public','pg_temp' as $$
declare band text;
begin
 select assessed_age_band into band from public.profile_age_assurance where user_id=new.author_id;
 if band in ('child','teen') and new.visibility='public' then raise exception 'minor accounts cannot publish public posts'; end if;
 return new;
end $$;
drop trigger if exists pantavion_enforce_minor_public_post on public.social_posts;
create trigger pantavion_enforce_minor_public_post before insert or update of visibility,author_id on public.social_posts for each row execute function public.pantavion_enforce_minor_public_post();
