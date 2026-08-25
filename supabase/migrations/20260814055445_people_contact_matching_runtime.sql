create or replace function public.pantavion_find_people_from_my_contacts()
returns table(user_id uuid,display_name text,avatar_url text,country_code text,region text,city text,matched_by text)
language sql stable security definer set search_path='public','pg_temp' as $$
 with actor as (select auth.uid() id),
 eligible as (
   select c.email,c.phone
   from public.contacts c,actor a
   where a.id is not null and c.owner_id=a.id
 ), matches as (
   select distinct cp.user_id,
     case when cp.kind='email' then 'email' else 'phone' end matched_by
   from public.user_contact_points cp
   join eligible e on (cp.kind='email' and lower(btrim(coalesce(e.email,'')))=cp.normalized_value)
      or (cp.kind='phone' and regexp_replace(coalesce(e.phone,''),'[^0-9+]','','g')=cp.normalized_value)
   cross join actor a
   where cp.user_id<>a.id
     and cp.verification_state='verified'
     and cp.contact_matching_enabled
 )
 select p.id,p.display_name,p.avatar_url,p.country_code,p.region,p.city,m.matched_by
 from matches m
 join public.profiles p on p.id=m.user_id
 join public.user_privacy_settings ups on ups.user_id=p.id
 where p.publication_state='published'
   and ups.discoverability_enabled=true
   and ups.profile_visibility<>'private'
   and not public.pantavion_has_block_between((select id from actor),p.id)
   and public.pantavion_safety_allows_messages(p.id);
$$;
revoke all on function public.pantavion_find_people_from_my_contacts() from public,anon;
grant execute on function public.pantavion_find_people_from_my_contacts() to authenticated;
