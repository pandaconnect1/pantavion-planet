revoke all on public.communities from anon;
revoke all on public.community_members from anon;
revoke all on public.social_notifications from anon;

drop policy if exists communities_read on public.communities;
drop policy if exists community_members_read on public.community_members;

revoke all on function public.pantavion_is_community_member(uuid, uuid) from public;
revoke all on function public.pantavion_is_community_member(uuid, uuid) from anon;
revoke all on function public.pantavion_is_community_member(uuid, uuid) from authenticated;
drop function if exists public.pantavion_is_community_member(uuid, uuid);

create or replace function public.pantavion_is_community_member(p_community_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select auth.uid() is not null and exists (
    select 1
    from public.community_members m
    where m.community_id = p_community_id
      and m.user_id = auth.uid()
      and m.status = 'active'
  );
$$;

revoke all on function public.pantavion_is_community_member(uuid) from public;
revoke all on function public.pantavion_is_community_member(uuid) from anon;
grant execute on function public.pantavion_is_community_member(uuid) to authenticated;

create policy communities_read on public.communities
for select to authenticated
using (
  visibility = 'public'
  or created_by = auth.uid()
  or public.pantavion_is_community_member(id)
);

create policy community_members_read on public.community_members
for select to authenticated
using (
  user_id = auth.uid()
  or public.pantavion_is_community_member(community_id)
);