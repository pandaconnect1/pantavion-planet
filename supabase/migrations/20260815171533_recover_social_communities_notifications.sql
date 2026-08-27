create extension if not exists pgcrypto;

create table if not exists public.communities (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]{3,60}$'),
  name text not null check (char_length(name) between 2 and 100),
  description text not null default '' check (char_length(description) <= 1000),
  visibility text not null default 'public' check (visibility in ('public','private','secret')),
  age_scope text not null default 'adult' check (age_scope in ('child','teen','adult','all')),
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.community_members (
  community_id uuid not null references public.communities(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner','admin','moderator','member')),
  status text not null default 'active' check (status in ('pending','active','blocked')),
  joined_at timestamptz not null default now(),
  primary key (community_id, user_id)
);

create table if not exists public.social_notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references auth.users(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  type text not null check (char_length(type) between 1 and 80),
  entity_id uuid,
  payload jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists communities_created_at_idx on public.communities(created_at desc);
create index if not exists community_members_user_idx on public.community_members(user_id, joined_at desc);
create index if not exists social_notifications_recipient_idx on public.social_notifications(recipient_id, created_at desc);

alter table public.communities enable row level security;
alter table public.community_members enable row level security;
alter table public.social_notifications enable row level security;

create or replace function public.pantavion_is_community_member(p_community_id uuid, p_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.community_members m
    where m.community_id = p_community_id
      and m.user_id = p_user_id
      and m.status = 'active'
  );
$$;

revoke all on function public.pantavion_is_community_member(uuid, uuid) from public;
grant execute on function public.pantavion_is_community_member(uuid, uuid) to authenticated;

drop policy if exists communities_read on public.communities;
create policy communities_read on public.communities
for select to authenticated
using (visibility = 'public' or created_by = auth.uid() or public.pantavion_is_community_member(id));

drop policy if exists communities_create on public.communities;
create policy communities_create on public.communities
for insert to authenticated
with check (created_by = auth.uid());

drop policy if exists communities_owner_update on public.communities;
create policy communities_owner_update on public.communities
for update to authenticated
using (created_by = auth.uid())
with check (created_by = auth.uid());

drop policy if exists community_members_read on public.community_members;
create policy community_members_read on public.community_members
for select to authenticated
using (user_id = auth.uid() or public.pantavion_is_community_member(community_id));

drop policy if exists community_members_join_public on public.community_members;
create policy community_members_join_public on public.community_members
for insert to authenticated
with check (
  user_id = auth.uid()
  and (
    role = 'member'
    or exists (select 1 from public.communities c where c.id = community_id and c.created_by = auth.uid() and role = 'owner')
  )
  and (
    exists (select 1 from public.communities c where c.id = community_id and c.visibility = 'public')
    or exists (select 1 from public.communities c where c.id = community_id and c.created_by = auth.uid())
  )
);

drop policy if exists community_members_leave on public.community_members;
create policy community_members_leave on public.community_members
for delete to authenticated
using (user_id = auth.uid() and role <> 'owner');

drop policy if exists social_notifications_recipient_read on public.social_notifications;
create policy social_notifications_recipient_read on public.social_notifications
for select to authenticated
using (recipient_id = auth.uid());

drop policy if exists social_notifications_recipient_update on public.social_notifications;
create policy social_notifications_recipient_update on public.social_notifications
for update to authenticated
using (recipient_id = auth.uid())
with check (recipient_id = auth.uid());

grant select, insert, update on public.communities to authenticated;
grant select, insert, delete on public.community_members to authenticated;
grant select, update on public.social_notifications to authenticated;

do $$ begin
  alter publication supabase_realtime add table public.community_members;
exception when duplicate_object then null;
end $$;

do $$ begin
  alter publication supabase_realtime add table public.social_notifications;
exception when duplicate_object then null;
end $$;