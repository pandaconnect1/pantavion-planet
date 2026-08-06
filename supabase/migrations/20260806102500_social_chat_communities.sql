-- Pantavion Social Core: conversations, messages, communities and memberships
create extension if not exists pgcrypto;

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  kind text not null default 'direct' check (kind in ('direct','group','community','elite')),
  title text,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.conversation_members (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner','admin','member','guest')),
  joined_at timestamptz not null default now(),
  last_read_at timestamptz,
  primary key (conversation_id, user_id)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 10000),
  source_language text,
  created_at timestamptz not null default now(),
  edited_at timestamptz
);

create table if not exists public.communities (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]{3,60}$'),
  name text not null check (char_length(name) between 2 and 100),
  description text not null default '',
  visibility text not null default 'public' check (visibility in ('public','private','secret')),
  age_scope text not null default 'adult' check (age_scope in ('child','teen','adult','all')),
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.community_members (
  community_id uuid not null references public.communities(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner','admin','moderator','member')),
  status text not null default 'active' check (status in ('pending','active','blocked')),
  joined_at timestamptz not null default now(),
  primary key (community_id, user_id)
);

alter table public.conversations enable row level security;
alter table public.conversation_members enable row level security;
alter table public.messages enable row level security;
alter table public.communities enable row level security;
alter table public.community_members enable row level security;

create policy "members read conversations" on public.conversations
for select using (exists (
  select 1 from public.conversation_members cm
  where cm.conversation_id = id and cm.user_id = auth.uid()
));

create policy "authenticated create conversations" on public.conversations
for insert with check (auth.uid() = created_by);

create policy "members read membership" on public.conversation_members
for select using (user_id = auth.uid() or exists (
  select 1 from public.conversation_members cm
  where cm.conversation_id = conversation_id and cm.user_id = auth.uid()
));

create policy "creator adds members" on public.conversation_members
for insert with check (auth.uid() = user_id or exists (
  select 1 from public.conversations c where c.id = conversation_id and c.created_by = auth.uid()
));

create policy "members read messages" on public.messages
for select using (exists (
  select 1 from public.conversation_members cm
  where cm.conversation_id = conversation_id and cm.user_id = auth.uid()
));

create policy "members send messages" on public.messages
for insert with check (sender_id = auth.uid() and exists (
  select 1 from public.conversation_members cm
  where cm.conversation_id = conversation_id and cm.user_id = auth.uid()
));

create policy "public communities visible" on public.communities
for select using (visibility = 'public' or exists (
  select 1 from public.community_members m
  where m.community_id = id and m.user_id = auth.uid() and m.status = 'active'
));

create policy "authenticated create communities" on public.communities
for insert with check (created_by = auth.uid());

create policy "community memberships visible to member" on public.community_members
for select using (user_id = auth.uid() or exists (
  select 1 from public.community_members m
  where m.community_id = community_id and m.user_id = auth.uid() and m.status = 'active'
));

create policy "users join public communities" on public.community_members
for insert with check (user_id = auth.uid() and exists (
  select 1 from public.communities c where c.id = community_id and c.visibility = 'public'
));

create index if not exists messages_conversation_created_idx on public.messages(conversation_id, created_at desc);
create index if not exists community_members_user_idx on public.community_members(user_id, joined_at desc);

alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.community_members;
