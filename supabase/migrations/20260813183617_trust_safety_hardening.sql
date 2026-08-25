-- Follow-up hardening for live Pantavion Trust & Safety controls.
-- Keep public listings readable while ensuring no safety hold can be bypassed
-- through the self-service registration completion RPC.

grant execute on function public.pantavion_safety_allows_public_activity(uuid) to anon;

create or replace function public.pantavion_complete_own_profile()
returns table (registration_state text, protected_by_default boolean)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_first_name text;
  v_last_name text;
  v_country_code text;
  v_age_group text;
  v_next_state text;
begin
  if v_user_id is null then
    raise exception 'pantavion_identity_not_authenticated' using errcode = '28000';
  end if;

  if exists (
    select 1
    from public.profile_registration_states
    where user_id = v_user_id
      and state in ('manual_review', 'suspended')
  ) or exists (
    select 1
    from public.profile_safety_controls
    where user_id = v_user_id
      and control_state in ('verification_required', 'suspended')
  ) then
    raise exception 'pantavion_identity_profile_under_safety_review' using errcode = '42501';
  end if;

  select legal_first_name, legal_last_name, country_code, declared_age_group
  into v_first_name, v_last_name, v_country_code, v_age_group
  from public.profile_private_details
  where user_id = v_user_id;

  if not found
    or nullif(btrim(v_first_name), '') is null
    or nullif(btrim(v_last_name), '') is null
    or v_country_code is null
    or not exists (
      select 1
      from public.profiles
      where id = v_user_id
        and nullif(btrim(display_name), '') is not null
    ) then
    raise exception 'pantavion_identity_profile_incomplete' using errcode = '22023';
  end if;

  v_next_state := case
    when v_age_group = 'minor' then 'minor_protected'
    else 'active'
  end;

  update public.profile_registration_states
  set state = v_next_state,
      profile_completed_at = coalesce(profile_completed_at, now())
  where user_id = v_user_id;

  if v_age_group = 'minor' then
    update public.user_privacy_settings
    set profile_visibility = 'private',
        discoverability_enabled = false,
        contact_import_enabled = false,
        messaging_policy = 'nobody'
    where user_id = v_user_id;
  end if;

  return query select v_next_state, v_age_group = 'minor';
end;
$$;

revoke all on function public.pantavion_complete_own_profile() from public, anon;
grant execute on function public.pantavion_complete_own_profile() to authenticated;
