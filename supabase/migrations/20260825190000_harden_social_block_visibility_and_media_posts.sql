-- Keep Social mutations behind the authenticated command boundary while
-- supporting media-only posts and enforcing blocks consistently.

create or replace function public.pantavion_can_view_social_post(
  p_post_id uuid,
  p_viewer uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.social_posts p
    where p.id = p_post_id
      and p.deleted_at is null
      and not public.pantavion_has_block_between(p.author_id, p_viewer)
      and (
        p.author_id = p_viewer
        or p.visibility = 'public'
        or (
          p.visibility = 'connections'
          and p_viewer is not null
          and public.pantavion_are_connections(p.author_id, p_viewer)
        )
      )
  );
$$;

drop policy if exists social_posts_select_visible on public.social_posts;
create policy social_posts_select_visible on public.social_posts
for select using (public.pantavion_can_view_social_post(id, auth.uid()));

create or replace function public.pantavion_create_social_post(
  p_body text,
  p_visibility text default 'public',
  p_context text default 'social',
  p_location_label text default null
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  actor uuid := auth.uid();
  pid uuid;
  clean text := nullif(btrim(coalesce(p_body, '')), '');
begin
  if actor is null then raise exception 'authentication required'; end if;
  if p_visibility not in ('public', 'connections', 'private') then raise exception 'invalid visibility'; end if;
  if p_context not in ('social', 'professional', 'romantic', 'community') then raise exception 'invalid context'; end if;
  if clean is not null and char_length(clean) > 10000 then raise exception 'invalid post body'; end if;
  if not public.pantavion_internal.safety_allows_public_activity(actor) then raise exception 'public activity restricted'; end if;
  if exists (
    select 1 from public.profile_safety_controls s
    where s.user_id = actor
      and (s.control_state <> 'active' or s.identity_review_required)
  ) then raise exception 'safety review required'; end if;

  insert into public.social_posts(author_id, body, visibility, context, location_label)
  values(actor, clean, p_visibility, p_context, nullif(btrim(coalesce(p_location_label, '')), ''))
  returning id into pid;
  return pid;
end;
$$;

create or replace function public.pantavion_add_social_comment(
  p_post_id uuid,
  p_body text,
  p_parent_comment_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  actor uuid := auth.uid();
  cid uuid;
  clean text := nullif(btrim(coalesce(p_body, '')), '');
begin
  if actor is null then raise exception 'authentication required'; end if;
  if clean is null or char_length(clean) > 5000 then raise exception 'invalid comment body'; end if;
  if not public.pantavion_internal.safety_allows_public_activity(actor) then raise exception 'public activity restricted'; end if;
  if not public.pantavion_can_view_social_post(p_post_id, actor) then raise exception 'post not accessible'; end if;
  if p_parent_comment_id is not null and not exists (
    select 1 from public.social_comments c
    where c.id = p_parent_comment_id and c.post_id = p_post_id and c.deleted_at is null
  ) then raise exception 'invalid parent comment'; end if;

  insert into public.social_comments(post_id, author_id, body, parent_comment_id)
  values(p_post_id, actor, clean, p_parent_comment_id)
  returning id into cid;
  return cid;
end;
$$;

create or replace function public.pantavion_set_social_reaction(
  p_post_id uuid,
  p_reaction text default 'like'
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare actor uuid := auth.uid();
begin
  if actor is null then raise exception 'authentication required'; end if;
  if p_reaction not in ('like', 'love', 'laugh', 'wow', 'support', 'celebrate') then raise exception 'invalid reaction'; end if;
  if not public.pantavion_can_view_social_post(p_post_id, actor) then raise exception 'post not accessible'; end if;
  insert into public.social_reactions(post_id, user_id, reaction)
  values(p_post_id, actor, p_reaction)
  on conflict (post_id, user_id)
  do update set reaction = excluded.reaction, created_at = now();
end;
$$;

revoke all on function public.pantavion_can_view_social_post(uuid, uuid) from public, anon;
revoke all on function public.pantavion_create_social_post(text, text, text, text) from public, anon;
revoke all on function public.pantavion_add_social_comment(uuid, text, uuid) from public, anon;
revoke all on function public.pantavion_set_social_reaction(uuid, text) from public, anon;

grant execute on function public.pantavion_can_view_social_post(uuid, uuid) to authenticated;
grant execute on function public.pantavion_create_social_post(text, text, text, text) to authenticated;
grant execute on function public.pantavion_add_social_comment(uuid, text, uuid) to authenticated;
grant execute on function public.pantavion_set_social_reaction(uuid, text) to authenticated;
