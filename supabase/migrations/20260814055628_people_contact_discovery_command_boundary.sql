create or replace function public.pantavion_enable_contact_discovery()
returns boolean language plpgsql security definer set search_path='public','pg_temp' as $$
declare actor uuid:=auth.uid(); now_at timestamptz:=now();
begin
 if actor is null then raise exception 'authentication required'; end if;
 if exists(select 1 from public.profile_age_assurance a where a.user_id=actor and a.assessed_age_band='child') then raise exception 'contact discovery unavailable for child account'; end if;
 insert into public.consent_records(user_id,purpose,status,source,granted_at,revoked_at,metadata,created_at,updated_at)
 values(actor,'contact_discovery','granted','find_my_people',now_at,null,jsonb_build_object('initiated_by','user'),now_at,now_at);
 update public.user_privacy_settings set contact_import_enabled=true,updated_at=now_at where user_id=actor;
 return true;
end $$;
revoke all on function public.pantavion_enable_contact_discovery() from public,anon;
grant execute on function public.pantavion_enable_contact_discovery() to authenticated;

create or replace function public.pantavion_disable_contact_discovery()
returns boolean language plpgsql security definer set search_path='public','pg_temp' as $$
declare actor uuid:=auth.uid(); now_at timestamptz:=now();
begin
 if actor is null then raise exception 'authentication required'; end if;
 update public.consent_records set status='revoked',revoked_at=now_at,updated_at=now_at where user_id=actor and purpose='contact_discovery' and status='granted';
 update public.user_privacy_settings set contact_import_enabled=false,updated_at=now_at where user_id=actor;
 update public.user_contact_points set contact_matching_enabled=false,discoverability_enabled=false,updated_at=now_at where user_id=actor;
 return true;
end $$;
revoke all on function public.pantavion_disable_contact_discovery() from public,anon;
grant execute on function public.pantavion_disable_contact_discovery() to authenticated;
