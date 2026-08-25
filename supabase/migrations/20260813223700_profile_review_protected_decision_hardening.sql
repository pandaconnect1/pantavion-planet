create or replace function public.pantavion_decide_profile_review(p_case_id uuid,p_decision text,p_note text default null)
returns text language plpgsql security definer set search_path='public','pg_temp' as $$
declare actor uuid:=auth.uid(); c public.profile_review_cases%rowtype; result_state text; sec public.profile_security_posture%rowtype; saf public.profile_safety_controls%rowtype;
begin
 if actor is null or not public.pantavion_is_active_founder() then raise exception 'Founder authorization required'; end if;
 if coalesce(auth.jwt()->>'aal','aal1')<>'aal2' then raise exception 'AAL2 multi-factor authentication required'; end if;
 if p_decision not in ('publish','reject') then raise exception 'Unsupported profile review decision'; end if;
 select * into c from public.profile_review_cases where id=p_case_id and case_state='under_review' for update;
 if not found then raise exception 'Profile review case is not available'; end if;
 if p_decision='publish' then
   select * into saf from public.profile_safety_controls where user_id=c.subject_user_id;
   if not found or saf.control_state<>'active' or not saf.discovery_allowed or saf.identity_review_required then raise exception 'Safety clearance required before publication'; end if;
   select * into sec from public.profile_security_posture where user_id=c.subject_user_id;
   if found and sec.emergency_lock then raise exception 'Emergency locked account cannot be published'; end if;
   if found and sec.account_class in ('public_figure','elite','protected','institutional') and not (sec.security_level in ('maximum','protected_maximum') and sec.phishing_resistant_auth_required and sec.hardware_key_required and sec.minimum_registered_hardware_keys>=2 and not sec.sms_recovery_allowed and sec.critical_change_review_required) then raise exception 'Protected account security requirements not satisfied'; end if;
 end if;
 result_state:=case when p_decision='publish' then 'published' else 'rejected' end;
 update public.profile_review_cases set case_state=result_state,reviewed_by=actor,reviewed_at=now(),decision_note=nullif(btrim(coalesce(p_note,'')),''),updated_at=now() where id=c.id;
 update public.profiles set publication_state=result_state,profile_published_at=case when result_state='published' then now() else null end,updated_at=now() where id=c.subject_user_id;
 insert into public.profile_governance_audit(subject_user_id,actor_id,action,case_id,details) values(c.subject_user_id,actor,result_state,c.id,jsonb_build_object('note_present',nullif(btrim(coalesce(p_note,'')),'') is not null,'aal','aal2','protected_checks',true));
 return result_state;
end $$;
revoke all on function public.pantavion_decide_profile_review(uuid,text,text) from public,anon;
grant execute on function public.pantavion_decide_profile_review(uuid,text,text) to authenticated;

revoke all on public.profile_review_cases from anon;
revoke all on public.profile_governance_audit from anon;
revoke insert,update,delete,truncate on public.profile_review_cases from authenticated;
revoke insert,update,delete,truncate on public.profile_governance_audit from authenticated;
