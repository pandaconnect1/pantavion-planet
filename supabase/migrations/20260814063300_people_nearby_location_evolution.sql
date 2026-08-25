alter table public.social_location_shares add column if not exists nearby_discovery_enabled boolean not null default false;
alter table public.social_location_shares add column if not exists precision_policy text not null default 'privacy_approximate';
do $$ begin
  alter table public.social_location_shares add constraint social_location_precision_policy_check check (precision_policy in ('privacy_approximate','emergency_precision'));
exception when duplicate_object then null; end $$;

create or replace function public.pantavion_update_location_presence(p_latitude double precision,p_longitude double precision,p_accuracy_meters double precision,p_nearby_enabled boolean default false,p_expires_minutes integer default 30)
returns boolean language plpgsql security definer set search_path='public','pg_temp' as $$
declare actor uuid:=auth.uid(); band text;
begin
 if actor is null then raise exception 'authentication required'; end if;
 if p_latitude is null or p_longitude is null or p_latitude < -90 or p_latitude > 90 or p_longitude < -180 or p_longitude > 180 then raise exception 'invalid coordinates'; end if;
 if p_accuracy_meters is null or p_accuracy_meters < 0 or p_accuracy_meters > 100000 then raise exception 'invalid accuracy'; end if;
 if p_expires_minutes < 1 or p_expires_minutes > 1440 then raise exception 'invalid expiry'; end if;
 select assessed_age_band into band from public.profile_age_assurance where user_id=actor;
 if band in ('child','teen') then p_nearby_enabled:=false; end if;
 insert into public.social_location_shares(user_id,enabled,audience,latitude,longitude,accuracy_meters,expires_at,updated_at,nearby_discovery_enabled,precision_policy)
 values(actor,true,'nobody',p_latitude,p_longitude,p_accuracy_meters,now()+make_interval(mins=>p_expires_minutes),now(),p_nearby_enabled,'privacy_approximate')
 on conflict(user_id) do update set enabled=true,audience='nobody',latitude=excluded.latitude,longitude=excluded.longitude,accuracy_meters=excluded.accuracy_meters,expires_at=excluded.expires_at,updated_at=now(),nearby_discovery_enabled=excluded.nearby_discovery_enabled,precision_policy='privacy_approximate';
 return true;
end $$;
revoke all on function public.pantavion_update_location_presence(double precision,double precision,double precision,boolean,integer) from public,anon;
grant execute on function public.pantavion_update_location_presence(double precision,double precision,double precision,boolean,integer) to authenticated;

create or replace function public.pantavion_disable_location_presence()
returns boolean language plpgsql security definer set search_path='public','pg_temp' as $$
declare actor uuid:=auth.uid();
begin
 if actor is null then raise exception 'authentication required'; end if;
 update public.social_location_shares set enabled=false,nearby_discovery_enabled=false,latitude=null,longitude=null,accuracy_meters=null,expires_at=null,updated_at=now() where user_id=actor;
 return true;
end $$;
revoke all on function public.pantavion_disable_location_presence() from public,anon;
grant execute on function public.pantavion_disable_location_presence() to authenticated;

create or replace function public.pantavion_find_nearby_people(p_radius_meters integer default 5000,p_limit integer default 50)
returns table(user_id uuid,display_name text,avatar_url text,country_code text,region text,city text,distance_bucket text)
language sql stable security definer set search_path='public','pg_temp' as $$
 with actor as (select auth.uid() id), me as (
   select s.latitude lat,s.longitude lon from public.social_location_shares s,actor a
   where s.user_id=a.id and s.enabled and s.expires_at>now()
 ), candidates as (
   select s.user_id,p.display_name,p.avatar_url,p.country_code,p.region,p.city,
     6371000 * 2 * asin(sqrt(power(sin(radians((s.latitude-me.lat)/2)),2)+cos(radians(me.lat))*cos(radians(s.latitude))*power(sin(radians((s.longitude-me.lon)/2)),2))) distance_m
   from public.social_location_shares s
   cross join me
   join public.profiles p on p.id=s.user_id
   join public.user_privacy_settings ups on ups.user_id=s.user_id
   cross join actor a
   where s.user_id<>a.id and s.enabled and s.nearby_discovery_enabled and s.expires_at>now()
     and s.precision_policy='privacy_approximate'
     and p.publication_state='published' and ups.discoverability_enabled and ups.profile_visibility<>'private'
     and not public.pantavion_has_block_between(a.id,s.user_id)
     and coalesce((select assessed_age_band from public.profile_age_assurance where user_id=s.user_id),'adult') not in ('child','teen')
     and public.pantavion_safety_allows_messages(s.user_id)
 )
 select c.user_id,c.display_name,c.avatar_url,c.country_code,c.region,c.city,
   case when c.distance_m<100 then '<100 m' when c.distance_m<500 then '<500 m' when c.distance_m<1000 then '<1 km' when c.distance_m<5000 then '<5 km' when c.distance_m<25000 then '<25 km' else '25+ km' end
 from candidates c
 where c.distance_m<=greatest(100,least(coalesce(p_radius_meters,5000),100000))
 order by c.distance_m
 limit greatest(1,least(coalesce(p_limit,50),100));
$$;
revoke all on function public.pantavion_find_nearby_people(integer,integer) from public,anon;
grant execute on function public.pantavion_find_nearby_people(integer,integer) to authenticated;

revoke insert,update,delete,truncate on public.social_location_shares from authenticated;
