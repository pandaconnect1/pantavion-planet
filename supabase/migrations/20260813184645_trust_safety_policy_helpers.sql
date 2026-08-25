-- Internalize safety-state decisions used by RLS. These checks must work in
-- policies, but must not be callable as public RPC probes by signed-in users.

create schema if not exists pantavion_internal;
revoke all on schema pantavion_internal from public;
grant usage on schema pantavion_internal to anon, authenticated;

create or replace function pantavion_internal.safety_allows_discovery(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce((select discovery_allowed from public.profile_safety_controls where user_id = p_user_id), true);
$$;

create or replace function pantavion_internal.safety_allows_new_contacts(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce((select new_contacts_allowed from public.profile_safety_controls where user_id = p_user_id), true);
$$;

create or replace function pantavion_internal.safety_allows_public_activity(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce((select public_activity_allowed from public.profile_safety_controls where user_id = p_user_id), true);
$$;

revoke all on function pantavion_internal.safety_allows_discovery(uuid) from public, anon, authenticated;
revoke all on function pantavion_internal.safety_allows_new_contacts(uuid) from public, anon, authenticated;
revoke all on function pantavion_internal.safety_allows_public_activity(uuid) from public, anon, authenticated;
grant execute on function pantavion_internal.safety_allows_discovery(uuid) to authenticated;
grant execute on function pantavion_internal.safety_allows_new_contacts(uuid) to authenticated;
grant execute on function pantavion_internal.safety_allows_public_activity(uuid) to authenticated;

revoke all on function public.pantavion_is_active_trust_safety_operator() from public, anon, authenticated;
revoke all on function public.pantavion_safety_allows_discovery(uuid) from public, anon, authenticated;
revoke all on function public.pantavion_safety_allows_new_contacts(uuid) from public, anon, authenticated;
revoke all on function public.pantavion_safety_allows_messages(uuid) from public, anon, authenticated;
revoke all on function public.pantavion_safety_allows_public_activity(uuid) from public, anon, authenticated;

drop policy if exists profiles_privacy_read on public.profiles;
create policy profiles_privacy_read
  on public.profiles
  for select to authenticated
  using (
    (select auth.uid()) = id
    or (
      publication_state = 'published'
      and (select pantavion_internal.safety_allows_discovery(profiles.id))
      and exists (
        select 1
        from public.user_privacy_settings ps
        where ps.user_id = profiles.id
          and ps.profile_visibility = 'public'
          and ps.discoverability_enabled
      )
    )
  );

drop policy if exists relationships_insert on public.relationships;
create policy relationships_insert
  on public.relationships
  for insert to authenticated
  with check (
    (select auth.uid()) = requester_id
    and requester_id <> addressee_id
    and (select pantavion_internal.safety_allows_new_contacts(requester_id))
    and (select pantavion_internal.safety_allows_new_contacts(addressee_id))
    and not public.pantavion_has_block_between(requester_id, addressee_id)
  );

drop policy if exists social_posts_safety_read on public.social_posts;
create policy social_posts_safety_read
  on public.social_posts
  as restrictive
  for select to authenticated
  using (
    author_id = (select auth.uid())
    or (select pantavion_internal.safety_allows_public_activity(author_id))
  );

drop policy if exists social_posts_safety_write on public.social_posts;
create policy social_posts_safety_write
  on public.social_posts
  as restrictive
  for insert to authenticated
  with check ((select pantavion_internal.safety_allows_public_activity(author_id)));

drop policy if exists social_posts_safety_update on public.social_posts;
create policy social_posts_safety_update
  on public.social_posts
  as restrictive
  for update to authenticated
  using ((select pantavion_internal.safety_allows_public_activity(author_id)))
  with check ((select pantavion_internal.safety_allows_public_activity(author_id)));

drop policy if exists public_listings_safety_write on public.public_listings;
create policy public_listings_safety_write
  on public.public_listings
  as restrictive
  for insert to authenticated
  with check ((select pantavion_internal.safety_allows_public_activity(owner_id)));

drop policy if exists public_listings_safety_update on public.public_listings;
create policy public_listings_safety_update
  on public.public_listings
  as restrictive
  for update to authenticated
  using ((select pantavion_internal.safety_allows_public_activity(owner_id)))
  with check ((select pantavion_internal.safety_allows_public_activity(owner_id)));
