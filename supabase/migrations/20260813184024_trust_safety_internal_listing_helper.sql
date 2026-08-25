-- Keep the anonymous listing policy functional without exposing a public RPC
-- that can be used to probe an account's Trust & Safety restriction state.

create schema if not exists pantavion_internal;
revoke all on schema pantavion_internal from public;
grant usage on schema pantavion_internal to anon, authenticated;

create or replace function pantavion_internal.safety_allows_public_listing(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce((select public_activity_allowed from public.profile_safety_controls where user_id = p_user_id), true);
$$;

revoke all on function pantavion_internal.safety_allows_public_listing(uuid) from public, anon, authenticated;
grant execute on function pantavion_internal.safety_allows_public_listing(uuid) to anon, authenticated;
revoke execute on function public.pantavion_safety_allows_public_activity(uuid) from anon;

drop policy if exists public_listings_safety_public_read on public.public_listings;
create policy public_listings_safety_public_read
  on public.public_listings
  as restrictive
  for select to anon, authenticated
  using ((select pantavion_internal.safety_allows_public_listing(owner_id)));
