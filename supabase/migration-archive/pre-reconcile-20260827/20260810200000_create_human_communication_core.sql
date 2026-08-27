-- Pantavion Human + Communication Core foundation
-- Canonical dependency order:
-- auth/profile -> privacy/consent -> contacts -> relationships -> conversations -> messages.
--
-- Design goals:
-- - Supabase/Postgres compatible
-- - RLS enabled everywhere
-- - no recursive conversation_members RLS
-- - no messaging across a block in either direction
-- - relationship transitions enforced server-side
-- - profile visibility no longer globally unconditional

create extension if not exists pgcrypto;

create table if not exists public.user_privacy_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  profile_visibility text not null default 'public'
    check (profile_visibility in ('public','connections','private')),
  discoverability_enabled boolean not null default true,
  contact_import_enabled boolean not null default false,
  messaging_policy text not null default 'requests'
    check (messaging_policy in ('connections','requests','nobody')),
  translation_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.consent_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  purpose text not null,
  status text not null check (status in ('granted','denied','revoked')),
  source text not null default 'pantavion',
  granted_at timestamptz,
  revoked_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (status = 'granted' and granted_at is not null and revoked_at is null)
    or (status = 'revoked' and revoked_at is not null)
    or status = 'denied'
  )
);
create index if not exists consent_records_user_purpose_idx
  on public.consent_records(user_id, purpose, created_at desc);

create table if not exists public.contact_sources (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  source_type text not null
    check (source_type in ('device','google','microsoft','apple','csv','vcard','manual','other')),
  external_account_hint text,
  consent_record_id uuid references public.consent_records(id) on delete set null,
  status text not null default 'active'
    check (status in ('active','paused','revoked','error')),
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists contact_sources_owner_idx
  on public.contact_sources(owner_id, status);

create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  source_id uuid references public.contact_sources(id) on delete set null,
  linked_user_id uuid references auth.users(id) on delete set null,
  display_name text,
  email text,
  phone text,
  source_external_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    linked_user_id is not null
    or nullif(btrim(coalesce(email, '')), '') is not null
    or nullif(btrim(coalesce(phone, '')), '') is not null
    or nullif(btrim(coalesce(display_name, '')), '') is not null
  )
);
create index if not exists contacts_owner_idx on public.contacts(owner_id);
create index if not exists contacts_linked_user_idx on public.contacts(linked_user_id);
create unique index if not exists contacts_owner_source_external_unique_idx
  on public.contacts(owner_id, source_id, source_external_id)
  where source_id is not null and source_external_id is not null;

create table if not exists public.relationships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references auth.users(id) on delete cascade,
  addressee_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending','accepted','declined','removed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (requester_id <> addressee_id)
);
create unique index if not exists relationships_pair_unique_idx
  on public.relationships(least(requester_id, addressee_id), greatest(requester_id, addressee_id));
create index if not exists relationships_addressee_status_idx
  on public.relationships(addressee_id, status);
create index if not exists relationships_requester_status_idx
  on public.relationships(requester_id, status);

create table if not exists public.user_blocks (
  blocker_id uuid not null references auth.users(id) on delete cascade,
  blocked_id uuid not null references auth.users(id) on delete cascade,
  reason text,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);
create index if not exists user_blocks_blocked_idx on public.user_blocks(blocked_id);

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  kind text not null default 'direct'
    check (kind in ('direct','group','channel','elite_private')),
  title text,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.conversation_members (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner','admin','member')),
  joined_at timestamptz not null default now(),
  left_at timestamptz,
  primary key (conversation_id, user_id),
  check (left_at is null or left_at >= joined_at)
);
create index if not exists conversation_members_user_idx
  on public.conversation_members(user_id, conversation_id)
  where left_at is null;

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  client_message_id text,
  body text,
  original_language text,
  message_type text not null default 'text'
    check (message_type in ('text','image','video','audio','file','system')),
  reply_to_message_id uuid references public.messages(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  edited_at timestamptz,
  deleted_at timestamptz,
  check (message_type <> 'text' or nullif(btrim(coalesce(body, '')), '') is not null)
);
create unique index if not exists messages_sender_client_id_unique_idx
  on public.messages(sender_id, client_message_id)
  where client_message_id is not null;
create index if not exists messages_conversation_created_idx
  on public.messages(conversation_id, created_at desc);

create table if not exists public.message_receipts (
  message_id uuid not null references public.messages(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  state text not null
    check (state in ('queued','accepted','delivered','read','failed')),
  occurred_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  primary key (message_id, user_id, state)
);
create index if not exists message_receipts_user_idx
  on public.message_receipts(user_id, occurred_at desc);

-- Generic updated_at trigger used only by Pantavion-owned tables in this migration.
create or replace function public.pantavion_touch_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger user_privacy_settings_touch_updated_at
before update on public.user_privacy_settings
for each row execute function public.pantavion_touch_updated_at();

create trigger consent_records_touch_updated_at
before update on public.consent_records
for each row execute function public.pantavion_touch_updated_at();

create trigger contact_sources_touch_updated_at
before update on public.contact_sources
for each row execute function public.pantavion_touch_updated_at();

create trigger contacts_touch_updated_at
before update on public.contacts
for each row execute function public.pantavion_touch_updated_at();

create trigger relationships_touch_updated_at
before update on public.relationships
for each row execute function public.pantavion_touch_updated_at();

create trigger conversations_touch_updated_at
before update on public.conversations
for each row execute function public.pantavion_touch_updated_at();

-- SECURITY DEFINER predicates avoid RLS self-recursion while still exposing only booleans.
create or replace function public.pantavion_is_conversation_member(
  p_conversation_id uuid,
  p_user_id uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.conversation_members cm
    where cm.conversation_id = p_conversation_id
      and cm.user_id = p_user_id
      and cm.left_at is null
  );
$$;

create or replace function public.pantavion_is_conversation_creator(
  p_conversation_id uuid,
  p_user_id uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.conversations c
    where c.id = p_conversation_id
      and c.created_by = p_user_id
  );
$$;

create or replace function public.pantavion_has_block_between(
  p_user_a uuid,
  p_user_b uuid
)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.user_blocks b
    where (b.blocker_id = p_user_a and b.blocked_id = p_user_b)
       or (b.blocker_id = p_user_b and b.blocked_id = p_user_a)
  );
$$;

create or replace function public.pantavion_can_send_to_conversation(
  p_conversation_id uuid,
  p_sender_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select
    public.pantavion_is_conversation_member(p_conversation_id, p_sender_id)
    and not exists (
      select 1
      from public.conversation_members other
      where other.conversation_id = p_conversation_id
        and other.user_id <> p_sender_id
        and other.left_at is null
        and public.pantavion_has_block_between(p_sender_id, other.user_id)
    );
$$;

create or replace function public.pantavion_can_access_message(
  p_message_id uuid,
  p_user_id uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.messages m
    where m.id = p_message_id
      and public.pantavion_is_conversation_member(m.conversation_id, p_user_id)
  );
$$;

revoke all on function public.pantavion_is_conversation_member(uuid, uuid) from public;
revoke all on function public.pantavion_is_conversation_creator(uuid, uuid) from public;
revoke all on function public.pantavion_has_block_between(uuid, uuid) from public;
revoke all on function public.pantavion_can_send_to_conversation(uuid, uuid) from public;
revoke all on function public.pantavion_can_access_message(uuid, uuid) from public;
grant execute on function public.pantavion_is_conversation_member(uuid, uuid) to authenticated;
grant execute on function public.pantavion_is_conversation_creator(uuid, uuid) to authenticated;
grant execute on function public.pantavion_has_block_between(uuid, uuid) to authenticated;
grant execute on function public.pantavion_can_send_to_conversation(uuid, uuid) to authenticated;
grant execute on function public.pantavion_can_access_message(uuid, uuid) to authenticated;

-- Enforce relationship transitions with OLD/NEW state, which RLS alone cannot express safely.
create or replace function public.pantavion_enforce_relationship_transition()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  actor uuid := auth.uid();
begin
  if actor is null then
    raise exception 'authentication required';
  end if;

  if new.requester_id <> old.requester_id or new.addressee_id <> old.addressee_id then
    raise exception 'relationship participants are immutable';
  end if;

  if new.status = old.status then
    return new;
  end if;

  if old.status = 'pending' then
    if actor = old.addressee_id and new.status in ('accepted','declined') then
      return new;
    end if;
    if actor = old.requester_id and new.status = 'removed' then
      return new;
    end if;
  elsif old.status = 'accepted' then
    if actor in (old.requester_id, old.addressee_id) and new.status = 'removed' then
      return new;
    end if;
  end if;

  raise exception 'invalid relationship transition';
end;
$$;

create trigger relationships_enforce_transition
before update on public.relationships
for each row execute function public.pantavion_enforce_relationship_transition();

alter table public.user_privacy_settings enable row level security;
alter table public.consent_records enable row level security;
alter table public.contact_sources enable row level security;
alter table public.contacts enable row level security;
alter table public.relationships enable row level security;
alter table public.user_blocks enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_members enable row level security;
alter table public.messages enable row level security;
alter table public.message_receipts enable row level security;

create policy "privacy owner read"
on public.user_privacy_settings for select
using (auth.uid() = user_id);

create policy "privacy owner insert"
on public.user_privacy_settings for insert
with check (auth.uid() = user_id);

create policy "privacy owner update"
on public.user_privacy_settings for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "consent owner read"
on public.consent_records for select
using (auth.uid() = user_id);

create policy "consent owner insert"
on public.consent_records for insert
with check (auth.uid() = user_id);

create policy "consent owner update"
on public.consent_records for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "contact sources owner all"
on public.contact_sources for all
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);

create policy "contacts owner all"
on public.contacts for all
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);

create policy "relationships participants read"
on public.relationships for select
using (auth.uid() in (requester_id, addressee_id));

create policy "relationships requester insert"
on public.relationships for insert
with check (
  auth.uid() = requester_id
  and requester_id <> addressee_id
  and not public.pantavion_has_block_between(requester_id, addressee_id)
);

create policy "relationships participants update"
on public.relationships for update
using (auth.uid() in (requester_id, addressee_id))
with check (auth.uid() in (requester_id, addressee_id));

create policy "blocks owner all"
on public.user_blocks for all
using (auth.uid() = blocker_id)
with check (auth.uid() = blocker_id);

create policy "conversations members read"
on public.conversations for select
using (public.pantavion_is_conversation_member(id, auth.uid()));

create policy "conversations creator insert"
on public.conversations for insert
with check (auth.uid() = created_by);

create policy "conversation members participant read"
on public.conversation_members for select
using (public.pantavion_is_conversation_member(conversation_id, auth.uid()));

create policy "conversation creator adds members"
on public.conversation_members for insert
with check (
  public.pantavion_is_conversation_creator(conversation_id, auth.uid())
  and not public.pantavion_has_block_between(auth.uid(), user_id)
);

create policy "messages members read"
on public.messages for select
using (public.pantavion_is_conversation_member(conversation_id, auth.uid()));

create policy "messages sender insert"
on public.messages for insert
with check (
  sender_id = auth.uid()
  and public.pantavion_can_send_to_conversation(conversation_id, auth.uid())
);

create policy "receipts participants read"
on public.message_receipts for select
using (public.pantavion_can_access_message(message_id, auth.uid()));

create policy "receipts self insert"
on public.message_receipts for insert
with check (
  auth.uid() = user_id
  and public.pantavion_can_access_message(message_id, auth.uid())
);

-- Replace the historical unconditional public profile-read policy with privacy-aware visibility.
drop policy if exists "Public profiles are readable" on public.profiles;
create policy "Profiles respect privacy and relationship visibility"
on public.profiles for select
using (
  auth.uid() = id
  or exists (
    select 1
    from public.user_privacy_settings ps
    where ps.user_id = id
      and ps.profile_visibility = 'public'
      and ps.discoverability_enabled = true
  )
  or exists (
    select 1
    from public.user_privacy_settings ps
    where ps.user_id = id
      and ps.profile_visibility = 'connections'
      and exists (
        select 1
        from public.relationships r
        where r.status = 'accepted'
          and (
            (r.requester_id = auth.uid() and r.addressee_id = id)
            or (r.addressee_id = auth.uid() and r.requester_id = id)
          )
      )
  )
);

-- Initialize privacy settings for every new and existing auth user.
create or replace function public.initialize_pantavion_user_settings()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_privacy_settings (user_id)
  values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_initialize_pantavion_settings on auth.users;
create trigger on_auth_user_initialize_pantavion_settings
after insert on auth.users
for each row execute function public.initialize_pantavion_user_settings();

insert into public.user_privacy_settings (user_id)
select id from auth.users
on conflict (user_id) do nothing;
