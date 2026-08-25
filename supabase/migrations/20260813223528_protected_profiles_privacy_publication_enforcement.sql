create or replace function public.pantavion_enforce_security_posture()
returns trigger language plpgsql set search_path='public','pg_temp' as $$
begin
  if new.account_class in ('public_figure','elite','protected','institutional') then
    new.security_level := case when new.account_class='protected' then 'protected_maximum' else 'maximum' end;
    new.phishing_resistant_auth_required := true;
    new.hardware_key_required := true;
    new.minimum_registered_hardware_keys := greatest(coalesce(new.minimum_registered_hardware_keys,0),2);
    new.sms_recovery_allowed := false;
    new.critical_change_review_required := true;
  end if;
  if new.security_level in ('maximum','protected_maximum') then
    new.phishing_resistant_auth_required := true;
    new.sms_recovery_allowed := false;
    new.critical_change_review_required := true;
  end if;
  return new;
end $$;
drop trigger if exists pantavion_enforce_security_posture on public.profile_security_posture;
create trigger pantavion_enforce_security_posture before insert or update on public.profile_security_posture for each row execute function public.pantavion_enforce_security_posture();

create or replace function public.pantavion_submit_own_profile_for_review()
returns text language plpgsql security definer set search_path='public','pg_temp' as $$
declare actor uuid:=auth.uid(); sec public.profile_security_posture%rowtype; p public.profiles%rowtype; reg text;
begin
 if actor is null then raise exception 'authentication required' using errcode='28000'; end if;
 select * into p from public.profiles where id=actor for update;
 if not found then raise exception 'profile missing'; end if;
 select state into reg from public.profile_registration_states where user_id=actor;
 if reg not in ('active','minor_protected') then raise exception 'registration not active'; end if;
 if p.publication_state not in ('draft','rejected') then raise exception 'profile not submittable'; end if;
 if nullif(btrim(p.display_name),'') is null or p.country_code is null then raise exception 'profile incomplete'; end if;
 if exists(select 1 from public.profile_safety_controls s where s.user_id=actor and (s.control_state<>'active' or s.identity_review_required)) then raise exception 'safety review required'; end if;
 select * into sec from public.profile_security_posture where user_id=actor;
 if found and sec.emergency_lock then raise exception 'account emergency locked'; end if;
 update public.profiles set publication_state='submitted', updated_at=now() where id=actor;
 perform public.pantavion_open_profile_review_case();
 return 'submitted';
end $$;
revoke all on function public.pantavion_submit_own_profile_for_review() from public, anon;
grant execute on function public.pantavion_submit_own_profile_for_review() to authenticated;

create or replace function public.pantavion_enforce_profile_publication_transition()
returns trigger language plpgsql set search_path='public','pg_temp' as $$
declare cls text; locked boolean; safety_ok boolean;
begin
 if new.publication_state is distinct from old.publication_state and new.publication_state='published' then
   select account_class, emergency_lock into cls, locked from public.profile_security_posture where user_id=new.id;
   select coalesce(control_state='active' and discovery_allowed and not identity_review_required,false) into safety_ok from public.profile_safety_controls where user_id=new.id;
   if coalesce(locked,false) then raise exception 'cannot publish emergency locked profile'; end if;
   if not coalesce(safety_ok,false) then raise exception 'cannot publish profile without active safety clearance'; end if;
   if cls in ('public_figure','elite','protected','institutional') and not exists(select 1 from public.profile_security_posture s where s.user_id=new.id and s.security_level in ('maximum','protected_maximum') and s.phishing_resistant_auth_required and s.hardware_key_required and s.minimum_registered_hardware_keys>=2 and not s.sms_recovery_allowed and s.critical_change_review_required) then raise exception 'protected profile security posture incomplete'; end if;
   new.profile_published_at:=coalesce(new.profile_published_at,now());
 end if;
 if new.publication_state is distinct from old.publication_state and new.publication_state<>'published' then new.profile_published_at:=null; end if;
 return new;
end $$;
drop trigger if exists pantavion_enforce_profile_publication_transition on public.profiles;
create trigger pantavion_enforce_profile_publication_transition before update of publication_state on public.profiles for each row execute function public.pantavion_enforce_profile_publication_transition();

revoke insert,update,delete,truncate on public.profile_security_posture from authenticated;
revoke update,delete,truncate on public.profile_safety_controls from authenticated;
