-- Pantavion Social Flagship Core
-- Extends the existing Human + Communication Core. No duplicate identity or relationship graph.

create table if not exists public.social_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users(id) on delete cascade,
  body text,
  visibility text not null default 'public'
    check (visibility in ('public','connections','private')),
  context text not null default 'social'
    check (context in ('social','professional','romantic','community')),
  location_label text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  check (nullif(btrim(coalesce(body,'')), '') is not null)
);
create index if not exists social_posts_author_created_idx on public.social_posts(author_id, created_at desc);
create index if not exists social_posts_feed_idx on public.social_posts(visibility, created_at desc) where deleted_at is null;

create table if not exists public.social_post_media (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.social_posts(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  storage_path text not null,
  media_kind text not null check (media_kind in ('photo','video','audio','file')),
  mime_type text,
  created_at timestamptz not null default now()
);
create index if not exists social_post_media_post_idx on public.social_post_media(post_id);

create table if not exists public.social_reactions (
  post_id uuid not null references public.social_posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  reaction text not null default 'like'
    check (reaction in ('like','love','laugh','wow','support','celebrate')),
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);
create index if not exists social_reactions_user_idx on public.social_reactions(user_id, created_at desc);

create table if not exists public.social_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.social_posts(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (nullif(btrim(body),'') is not null),
  parent_comment_id uuid references public.social_comments(id) on delete cascade,
  created_at timestamptz not null default now(),
  edited_at timestamptz,
  deleted_at timestamptz
);
create index if not exists social_comments_post_created_idx on public.social_comments(post_id, created_at);

create table if not exists public.social_location_shares (
  user_id uuid primary key references auth.users(id) on delete cascade,
  enabled boolean not null default false,
  audience text not null default 'selected'
    check (audience in ('connections','selected','nobody')),
  latitude double precision,
  longitude double precision,
  accuracy_meters double precision,
  expires_at timestamptz,
  updated_at timestamptz not null default now(),
  check (enabled = false or (latitude is not null and longitude is not null))
);

alter table public.social_posts enable row level security;
alter table public.social_post_media enable row level security;
alter table public.social_reactions enable row level security;
alter table public.social_comments enable row level security;
alter table public.social_location_shares enable row level security;

create or replace function public.pantavion_are_connections(p_a uuid, p_b uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.relationships r
    where r.status = 'accepted'
      and ((r.requester_id = p_a and r.addressee_id = p_b)
        or (r.requester_id = p_b and r.addressee_id = p_a))
  );
$$;

create or replace function public.pantavion_can_view_social_post(p_post_id uuid, p_viewer uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.social_posts p
    where p.id = p_post_id
      and p.deleted_at is null
      and (
        p.author_id = p_viewer
        or p.visibility = 'public'
        or (p.visibility = 'connections' and p_viewer is not null and public.pantavion_are_connections(p.author_id, p_viewer))
      )
  );
$$;

create policy social_posts_select_visible on public.social_posts
for select using (
  deleted_at is null and (
    author_id = auth.uid()
    or visibility = 'public'
    or (visibility = 'connections' and public.pantavion_are_connections(author_id, auth.uid()))
  )
);
create policy social_posts_insert_own on public.social_posts for insert with check (author_id = auth.uid());
create policy social_posts_update_own on public.social_posts for update using (author_id = auth.uid()) with check (author_id = auth.uid());
create policy social_posts_delete_own on public.social_posts for delete using (author_id = auth.uid());

create policy social_media_select_visible on public.social_post_media
for select using (public.pantavion_can_view_social_post(post_id));
create policy social_media_insert_own on public.social_post_media for insert with check (owner_id = auth.uid());
create policy social_media_delete_own on public.social_post_media for delete using (owner_id = auth.uid());

create policy social_reactions_select_visible on public.social_reactions
for select using (public.pantavion_can_view_social_post(post_id));
create policy social_reactions_insert_self on public.social_reactions for insert with check (user_id = auth.uid() and public.pantavion_can_view_social_post(post_id));
create policy social_reactions_update_self on public.social_reactions for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy social_reactions_delete_self on public.social_reactions for delete using (user_id = auth.uid());

create policy social_comments_select_visible on public.social_comments
for select using (deleted_at is null and public.pantavion_can_view_social_post(post_id));
create policy social_comments_insert_self on public.social_comments for insert with check (author_id = auth.uid() and public.pantavion_can_view_social_post(post_id));
create policy social_comments_update_self on public.social_comments for update using (author_id = auth.uid()) with check (author_id = auth.uid());
create policy social_comments_delete_self on public.social_comments for delete using (author_id = auth.uid());

create policy social_location_select_self on public.social_location_shares for select using (user_id = auth.uid());
create policy social_location_insert_self on public.social_location_shares for insert with check (user_id = auth.uid());
create policy social_location_update_self on public.social_location_shares for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy social_location_delete_self on public.social_location_shares for delete using (user_id = auth.uid());

create trigger social_posts_touch_updated_at
before update on public.social_posts
for each row execute function public.pantavion_touch_updated_at();

grant execute on function public.pantavion_are_connections(uuid, uuid) to authenticated;
grant execute on function public.pantavion_can_view_social_post(uuid, uuid) to authenticated;
