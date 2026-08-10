-- Follow-up hardening for the Human + Communication Core migration.
-- The profile policy must not depend on caller-visible rows from privacy/relationship tables,
-- otherwise nested RLS can hide records that are intentionally public.

create or replace function public.pantavion_can_view_profile(
  p_profile_user_id uuid,
  p_viewer_user_id uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select
    p_viewer_user_id = p_profile_user_id
    or exists (
      select 1
      from public.user_privacy_settings ps
      where ps.user_id = p_profile_user_id
        and ps.profile_visibility = 'public'
        and ps.discoverability_enabled = true
    )
    or (
      p_viewer_user_id is not null
      and exists (
        select 1
        from public.user_privacy_settings ps
        where ps.user_id = p_profile_user_id
          and ps.profile_visibility = 'connections'
      )
      and exists (
        select 1
        from public.relationships r
        where r.status = 'accepted'
          and (
            (r.requester_id = p_viewer_user_id and r.addressee_id = p_profile_user_id)
            or (r.addressee_id = p_viewer_user_id and r.requester_id = p_profile_user_id)
          )
      )
      and not public.pantavion_has_block_between(p_viewer_user_id, p_profile_user_id)
    );
$$;

revoke all on function public.pantavion_can_view_profile(uuid, uuid) from public;
grant execute on function public.pantavion_can_view_profile(uuid, uuid) to anon, authenticated;

drop policy if exists "Profiles respect privacy and relationship visibility" on public.profiles;
create policy "Profiles respect privacy and relationship visibility"
on public.profiles for select
using (public.pantavion_can_view_profile(id, auth.uid()));
