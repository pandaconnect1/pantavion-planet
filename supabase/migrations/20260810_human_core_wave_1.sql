-- Pantavion Human Core — Live Wave 1
-- Canonical path: Identity/Profile -> Consent -> Relationships -> Messaging
-- Safe additive migration. Existing Water/Maps assets are untouched.

create extension if not exists pgcrypto;

create table if not exists public.user_consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  consent_key text not null,
  granted boolean not null default false,
  source text not null default 'pantavion',
  metadata jsonb not null default '{}'::jsonb,
  granted_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, consent_key)
);

create table if not exists public.relationships (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null references auth.users(id) on delete cascade,
  target_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('follow','connect','block','mute')),
  status text not null default 'active' check (status in ('pending','active','declined','revoked')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (actor_id <> target_id),
  unique (actor_id, target_id, kind)
);

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  kind text not null default 'direct' check (kind in ('direct','group','channel')),
  created_by uuid not null references auth.users(id) on delete restrict,
  title text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.conversation_members (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner','admin','member')),
  joined_at timestamptz not null default now(),
  left_at timestamptz,
  primary key (conversation_id, user_id)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete restrict,
  body text not null check (char_length(body) between 1 and 10000),
  original_language text,
  reply_to_id uuid references public.messages(id) on delete set null,
  created_at timestamptz not null default now(),
  edited_at timestamptz,
  deleted_at timestamptz
);

create index if not exists relationships_target_idx on public.relationships(target_id, kind, status);
create index if not exists conversation_members_user_idx on public.conversation_members(user_id, conversation_id);
create index if not exists messages_conversation_created_idx on public.messages(conversation_id, created_at desc);

alter table public.user_consents enable row level security;
alter table public.relationships enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_members enable row level security;
alter table public.messages enable row level security;

create policy "consents_owner_read" on public.user_consents for select using (auth.uid() = user_id);
create policy "consents_owner_insert" on public.user_consents for insert with check (auth.uid() = user_id);
create policy "consents_owner_update" on public.user_consents for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "relationships_participant_read" on public.relationships for select using (auth.uid() = actor_id or auth.uid() = target_id);
create policy "relationships_actor_insert" on public.relationships for insert with check (auth.uid() = actor_id);
create policy "relationships_actor_update" on public.relationships for update using (auth.uid() = actor_id) with check (auth.uid() = actor_id);
create policy "relationships_actor_delete" on public.relationships for delete using (auth.uid() = actor_id);

create policy "conversations_member_read" on public.conversations for select using (
  exists (select 1 from public.conversation_members cm where cm.conversation_id = id and cm.user_id = auth.uid() and cm.left_at is null)
);
create policy "conversations_creator_insert" on public.conversations for insert with check (auth.uid() = created_by);

create policy "conversation_members_member_read" on public.conversation_members for select using (
  exists (select 1 from public.conversation_members self where self.conversation_id = conversation_id and self.user_id = auth.uid() and self.left_at is null)
);
create policy "conversation_members_owner_insert" on public.conversation_members for insert with check (
  user_id = auth.uid() or exists (
    select 1 from public.conversation_members owner_member
    where owner_member.conversation_id = conversation_id and owner_member.user_id = auth.uid() and owner_member.role in ('owner','admin') and owner_member.left_at is null
  )
);

create policy "messages_member_read" on public.messages for select using (
  exists (select 1 from public.conversation_members cm where cm.conversation_id = messages.conversation_id and cm.user_id = auth.uid() and cm.left_at is null)
);
create policy "messages_member_insert" on public.messages for insert with check (
  auth.uid() = sender_id and exists (
    select 1 from public.conversation_members cm where cm.conversation_id = messages.conversation_id and cm.user_id = auth.uid() and cm.left_at is null
  )
);

-- Realtime publication is intentionally not modified here. Enable only after deployment audit.
