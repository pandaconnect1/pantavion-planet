begin;

-- Sensitive control-plane tables are read-only to authenticated users.
-- Writes remain available only through privileged SECURITY DEFINER / service-role workflows
-- and continue to be constrained by the existing RLS policies.

revoke all on table public.profile_age_assurance from authenticated;
grant select on table public.profile_age_assurance to authenticated;

revoke all on table public.profile_security_posture from authenticated;
grant select on table public.profile_security_posture to authenticated;

revoke all on table public.profile_governance_audit from authenticated;
grant select on table public.profile_governance_audit to authenticated;

revoke all on table public.profile_review_cases from authenticated;
grant select on table public.profile_review_cases to authenticated;

revoke all on table public.pantavion_operator_roles from authenticated;
grant select on table public.pantavion_operator_roles to authenticated;

-- Anonymous callers should have no direct table privileges on these control-plane objects.
revoke all on table public.profile_age_assurance from anon;
revoke all on table public.profile_security_posture from anon;
revoke all on table public.profile_governance_audit from anon;
revoke all on table public.profile_review_cases from anon;
revoke all on table public.pantavion_operator_roles from anon;

commit;
