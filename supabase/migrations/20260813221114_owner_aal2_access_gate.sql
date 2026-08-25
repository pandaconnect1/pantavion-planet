-- A user may query only their own Owner/Safety authority state. This reveals
-- no case information and does not weaken the existing AAL2 checks.

create or replace function public.pantavion_get_my_trust_safety_access()
returns table(is_founder boolean, is_safety_operator boolean)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select
    exists (
      select 1 from public.pantavion_operator_roles
      where user_id = auth.uid() and role = 'founder' and active = true
    ) as is_founder,
    exists (
      select 1 from public.pantavion_operator_roles
      where user_id = auth.uid()
        and role in ('founder', 'safety_reviewer')
        and active = true
    ) as is_safety_operator;
$$;

revoke all on function public.pantavion_get_my_trust_safety_access() from public, anon;
grant execute on function public.pantavion_get_my_trust_safety_access() to authenticated;
