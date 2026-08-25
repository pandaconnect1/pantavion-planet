-- The browser never receives direct table access to internal Trust & Safety
-- data. Founder queue access is a bounded, audited-gate-compatible RPC.

revoke all on table public.profile_safety_controls from authenticated;
revoke all on table public.trust_safety_cases from authenticated;
revoke all on table public.trust_safety_signals from authenticated;
revoke all on table public.trust_safety_actions from authenticated;
revoke all on table public.trust_safety_appeals from authenticated;
revoke all on table public.trust_safety_access_audit from authenticated;

create or replace function public.pantavion_list_trust_safety_cases(p_limit integer default 100)
returns table(
  id uuid,
  subject_user_id uuid,
  case_kind text,
  severity text,
  sensitivity text,
  case_state text,
  reason_summary text,
  opened_at timestamptz
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_limit integer := greatest(1, least(coalesce(p_limit, 100), 100));
begin
  if auth.uid() is null
    or not public.pantavion_is_active_trust_safety_operator()
    or not public.pantavion_has_aal2() then
    raise exception 'Trust & Safety operator with AAL2 is required';
  end if;

  return query
  select c.id, c.subject_user_id, c.case_kind, c.severity, c.sensitivity,
         c.case_state, c.reason_summary, c.opened_at
  from public.trust_safety_cases c
  where c.case_state in ('open', 'assessing', 'verification_requested', 'restricted', 'suspended', 'appealed')
    and (c.sensitivity = 'standard' or public.pantavion_is_active_founder())
  order by c.opened_at asc
  limit v_limit;
end;
$$;

revoke all on function public.pantavion_list_trust_safety_cases(integer) from public, anon;
grant execute on function public.pantavion_list_trust_safety_cases(integer) to authenticated;
