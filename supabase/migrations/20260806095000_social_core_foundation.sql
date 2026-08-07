-- Pantavion Social Core foundation
-- Idempotent migration for posts, comments, reactions, relationships and notifications.

create extension if not exists pgcrypto;

create table if not exists public.social_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 5000),
  visibility text not null default 'public' check (visibility in ('public','followers','friends','private')),
  language_code text not null default 'und',
  country_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.social_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.social_posts(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.social_reactions (
  post_id uuid not null references public.social_posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  reaction text not null default 'like' check (reaction in ('like','love','support','celebrate','insightful')),
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create table if not exists public.social_relationships (
  requester_id uuid not null references auth.users(id) on delete cascade,
  addressee_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('follow','friend','family','professional','blocked')),
  status text not null default 'pending' check (status in ('pending','accepted','rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (requester_id, addressee_id, kind),
  check (requester_id <> addressee_id)
);

create table if not exists public.social_notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references auth.users(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  type text not null,
  entity_id uuid,
  payload jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists social_posts_created_at_idx on public.social_posts(created_at desc);
create index if not exists social_posts_author_idx on public.social_posts(author_id, created_at desc);
create index if not exists social_comments_post_idx on public.social_comments(post_id, created_at asc);
create index if not exists social_notifications_recipient_idx on public.social_notifications(recipient_id, created_at desc);

alter table public.social_posts enable row level security;
alter table public.social_comments enable row level security;
alter table public.social_reactions enable row level security;
alter table public.social_relationships enable row level security;
alter table public.social_notifications enable row level security;

drop policy if exists "social_posts_select" on public.social_posts;
create policy "social_posts_select" on public.social_posts for select using (
  visibility = 'public'
  or author_id = auth.uid()
  or (
    visibility in ('followers','friends') and exists (
      select 1 from public.social_relationships r
      where r.requester_id = auth.uid()
        and r.addressee_id = author_id
        and r.status = 'accepted'
        and ((visibility = 'followers' and r.kind = 'follow') or (visibility = 'friends' and r.kind = 'friend'))
    )
  )
);

drop policy if exists "social_posts_insert_own" on public.social_posts;
create policy "social_posts_insert_own" on public.social_posts for insert with check (author_id = auth.uid());

drop policy if exists "social_posts_update_own" on public.social_posts;
create policy "social_posts_update_own" on public.social_posts for update using (author_id = auth.uid()) with check (author_id = auth.uid());

drop policy if exists "social_posts_delete_own" on public.social_posts;
create policy "social_posts_delete_own" on public.social_posts for delete using (author_id = auth.uid());

drop policy if exists "social_comments_select_visible_post" on public.social_comments;
create policy "social_comments_select_visible_post" on public.social_comments for select using (
  exists (select 1 from public.social_posts p where p.id = post_id)
);

drop policy if exists "social_comments_insert_own" on public.social_comments;
create policy "social_comments_insert_own" on public.social_comments for insert with check (author_id = auth.uid());

drop policy if exists "social_comments_modify_own" on public.social_comments;
create policy "social_comments_modify_own" on public.social_comments for update using (author_id = auth.uid()) with check (author_id = auth.uid());

drop policy if exists "social_comments_delete_own" on public.social_comments;
create policy "social_comments_delete_own" on public.social_comments for delete using (author_id = auth.uid());

drop policy if exists "social_reactions_select" on public.social_reactions;
create policy "social_reactions_select" on public.social_reactions for select using (true);

drop policy if exists "social_reactions_own" on public.social_reactions;
create policy "social_reactions_own" on public.social_reactions for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "social_relationships_participants" on public.social_relationships;
create policy "social_relationships_participants" on public.social_relationships for select using (requester_id = auth.uid() or addressee_id = auth.uid());

drop policy if exists "social_relationships_create_own" on public.social_relationships;
create policy "social_relationships_create_own" on public.social_relationships for insert with check (requester_id = auth.uid());

drop policy if exists "social_relationships_update_participants" on public.social_relationships;
create policy "social_relationships_update_participants" on public.social_relationships for update using (requester_id = auth.uid() or addressee_id = auth.uid());

drop policy if exists "social_notifications_recipient" on public.social_notifications;
create policy "social_notifications_recipient" on public.social_notifications for select using (recipient_id = auth.uid());

drop policy if exists "social_notifications_mark_read" on public.social_notifications;
create policy "social_notifications_mark_read" on public.social_notifications for update using (recipient_id = auth.uid()) with check (recipient_id = auth.uid());

-- Realtime publication is optional and safe to rerun.
do $$ begin
  alter publication supabase_realtime add table public.social_posts;
exception when duplicate_object then null;
end $$;

do $$ begin
  alter publication supabase_realtime add table public.social_comments;
exception when duplicate_object then null;
end $$;
