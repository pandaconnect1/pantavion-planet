-- Production hardening for Pantavion Social + Personal Space.
-- Makes Data API access explicit and removes default PUBLIC EXECUTE
-- from security-definer helpers that are intended only for authenticated users.

-- Profiles: authenticated users can read visible profiles through RLS and manage only their own row.
grant select, insert, update on table public.profiles to authenticated;

-- Personal media: owner-only access is enforced by RLS.
grant select, insert, update, delete on table public.personal_media to authenticated;

-- Social core: authenticated operations are still filtered by table RLS policies.
grant select, insert, update, delete on table public.social_posts to authenticated;
grant select, insert, update, delete on table public.social_post_media to authenticated;
grant select, insert, update, delete on table public.social_reactions to authenticated;
grant select, insert, update, delete on table public.social_comments to authenticated;
grant select, insert, update, delete on table public.social_location_shares to authenticated;
grant select, insert, update, delete on table public.social_location_share_members to authenticated;

-- These helpers use SECURITY DEFINER to avoid recursive RLS lookups. They are not public APIs.
revoke all on function public.pantavion_are_connections(uuid, uuid) from public;
grant execute on function public.pantavion_are_connections(uuid, uuid) to authenticated;

revoke all on function public.pantavion_can_view_social_post(uuid, uuid) from public;
grant execute on function public.pantavion_can_view_social_post(uuid, uuid) to authenticated;

-- Trigger-only SECURITY DEFINER functions should not retain default PUBLIC execute privileges.
revoke all on function public.initialize_pantavion_user_settings() from public;
revoke all on function public.pantavion_sync_auth_discovery_identifiers() from public;

-- Contact discovery data remains intentionally inaccessible directly to authenticated clients.
revoke all on table public.user_discovery_identifiers from anon, authenticated;
