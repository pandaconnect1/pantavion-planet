create table public.personal_ai_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  personal_ai_id uuid not null default gen_random_uuid() unique,
  preferred_locale text,
  timezone text not null default 'UTC',
  assistance_level text not null default 'balanced' check (assistance_level in ('minimal','balanced','proactive','guided')),
  memory_enabled boolean not null default true,
  cross_thread_enabled boolean not null default true,
  voice_enabled boolean not null default true,
  communication_preferences jsonb not null default '{}'::jsonb,
  language_profile jsonb not null default '{}'::jsonb,
  privacy_settings jsonb not null default '{"cross_thread":true}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.personal_ai_threads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  conversation_id uuid references public.conversations(id) on delete set null,
  parent_thread_id uuid,
  title text,
  continuity_summary text not null default '',
  state jsonb not null default '{}'::jsonb,
  status text not null default 'active' check (status in ('active','handoff','archived')),
  last_activity_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id)
);

create unique index personal_ai_threads_user_conversation_uidx
  on public.personal_ai_threads(user_id, conversation_id)
  where conversation_id is not null;
create index personal_ai_threads_user_activity_idx
  on public.personal_ai_threads(user_id, last_activity_at desc);

create table public.personal_ai_turns (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  thread_id uuid not null,
  role text not null check (role in ('user','assistant','system','tool')),
  content text not null,
  original_language text,
  normalized_language text,
  input_mode text not null default 'text' check (input_mode in ('text','voice','image','video','file','mixed')),
  intent text,
  attachments jsonb not null default '[]'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  truth_state text not null default 'KNOWN' check (truth_state in ('KNOWN','INFERRED','UNVERIFIED','PARTIAL','BLOCKED','VERIFIED','VERIFIED_LIVE')),
  created_at timestamptz not null default now(),
  unique (id, user_id),
  constraint personal_ai_turns_thread_owner_fk
    foreign key (thread_id, user_id)
    references public.personal_ai_threads(id, user_id)
    on delete cascade
);

create index personal_ai_turns_user_thread_created_idx
  on public.personal_ai_turns(user_id, thread_id, created_at desc);
create index personal_ai_turns_search_idx
  on public.personal_ai_turns using gin (to_tsvector('simple', content));

create table public.personal_ai_memories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  thread_id uuid,
  memory_type text not null check (memory_type in ('working','thread','episodic','semantic','task','artifact','relationship','preference')),
  scope text not null default 'private' check (scope in ('private','thread','project','shared_space','organization','public')),
  content text not null,
  normalized_content text,
  source_type text,
  source_ref text,
  confidence numeric(4,3) not null default 1.000 check (confidence >= 0 and confidence <= 1),
  truth_state text not null default 'KNOWN' check (truth_state in ('KNOWN','INFERRED','UNVERIFIED','PARTIAL','BLOCKED','VERIFIED','VERIFIED_LIVE')),
  metadata jsonb not null default '{}'::jsonb,
  valid_from timestamptz,
  valid_until timestamptz,
  supersedes_memory_id uuid references public.personal_ai_memories(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint personal_ai_memories_thread_owner_fk
    foreign key (thread_id, user_id)
    references public.personal_ai_threads(id, user_id)
    on delete cascade
);

create index personal_ai_memories_user_scope_updated_idx
  on public.personal_ai_memories(user_id, scope, updated_at desc)
  where deleted_at is null;
create index personal_ai_memories_user_type_updated_idx
  on public.personal_ai_memories(user_id, memory_type, updated_at desc)
  where deleted_at is null;
create index personal_ai_memories_search_idx
  on public.personal_ai_memories using gin (to_tsvector('simple', content));

create table public.personal_ai_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  thread_id uuid,
  kind text not null check (kind in ('note','birthday','appointment','reminder','task','follow_up','important_date')),
  title text,
  body text not null default '',
  subject_label text,
  due_at timestamptz,
  recurrence text,
  status text not null default 'open' check (status in ('open','completed','cancelled','archived')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint personal_ai_items_thread_owner_fk
    foreign key (thread_id, user_id)
    references public.personal_ai_threads(id, user_id)
    on delete cascade
);

create index personal_ai_items_user_due_idx
  on public.personal_ai_items(user_id, due_at)
  where status = 'open';

create table public.personal_ai_relationship_contexts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject_key text not null,
  display_name text not null,
  relationship_type text not null,
  aliases text[] not null default '{}'::text[],
  notes text not null default '',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, subject_key)
);

create index personal_ai_relationship_contexts_user_type_idx
  on public.personal_ai_relationship_contexts(user_id, relationship_type);

create table public.personal_ai_action_audit (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  thread_id uuid,
  action_type text not null,
  status text not null check (status in ('queued','running','completed','failed','blocked')),
  truth_state text not null check (truth_state in ('KNOWN','INFERRED','UNVERIFIED','PARTIAL','BLOCKED','VERIFIED','VERIFIED_LIVE')),
  provider text,
  input_summary text,
  output_summary text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint personal_ai_action_audit_thread_owner_fk
    foreign key (thread_id, user_id)
    references public.personal_ai_threads(id, user_id)
    on delete cascade
);

create index personal_ai_action_audit_user_created_idx
  on public.personal_ai_action_audit(user_id, created_at desc);

create or replace function public.pantavion_personal_ai_touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function public.pantavion_personal_ai_touch_updated_at() from public;

create trigger personal_ai_profiles_touch_updated_at
before update on public.personal_ai_profiles
for each row execute function public.pantavion_personal_ai_touch_updated_at();
create trigger personal_ai_threads_touch_updated_at
before update on public.personal_ai_threads
for each row execute function public.pantavion_personal_ai_touch_updated_at();
create trigger personal_ai_memories_touch_updated_at
before update on public.personal_ai_memories
for each row execute function public.pantavion_personal_ai_touch_updated_at();
create trigger personal_ai_items_touch_updated_at
before update on public.personal_ai_items
for each row execute function public.pantavion_personal_ai_touch_updated_at();
create trigger personal_ai_relationship_contexts_touch_updated_at
before update on public.personal_ai_relationship_contexts
for each row execute function public.pantavion_personal_ai_touch_updated_at();

alter table public.personal_ai_profiles enable row level security;
alter table public.personal_ai_threads enable row level security;
alter table public.personal_ai_turns enable row level security;
alter table public.personal_ai_memories enable row level security;
alter table public.personal_ai_items enable row level security;
alter table public.personal_ai_relationship_contexts enable row level security;
alter table public.personal_ai_action_audit enable row level security;

alter table public.personal_ai_profiles force row level security;
alter table public.personal_ai_threads force row level security;
alter table public.personal_ai_turns force row level security;
alter table public.personal_ai_memories force row level security;
alter table public.personal_ai_items force row level security;
alter table public.personal_ai_relationship_contexts force row level security;
alter table public.personal_ai_action_audit force row level security;

create policy personal_ai_profiles_select_self on public.personal_ai_profiles for select to authenticated using ((select auth.uid()) = user_id);
create policy personal_ai_profiles_insert_self on public.personal_ai_profiles for insert to authenticated with check ((select auth.uid()) = user_id);
create policy personal_ai_profiles_update_self on public.personal_ai_profiles for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy personal_ai_profiles_delete_self on public.personal_ai_profiles for delete to authenticated using ((select auth.uid()) = user_id);

create policy personal_ai_threads_select_self on public.personal_ai_threads for select to authenticated using ((select auth.uid()) = user_id);
create policy personal_ai_threads_insert_self on public.personal_ai_threads for insert to authenticated with check ((select auth.uid()) = user_id);
create policy personal_ai_threads_update_self on public.personal_ai_threads for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy personal_ai_threads_delete_self on public.personal_ai_threads for delete to authenticated using ((select auth.uid()) = user_id);

create policy personal_ai_turns_select_self on public.personal_ai_turns for select to authenticated using ((select auth.uid()) = user_id);
create policy personal_ai_turns_insert_self on public.personal_ai_turns for insert to authenticated with check ((select auth.uid()) = user_id);
create policy personal_ai_turns_delete_self on public.personal_ai_turns for delete to authenticated using ((select auth.uid()) = user_id);

create policy personal_ai_memories_select_self on public.personal_ai_memories for select to authenticated using ((select auth.uid()) = user_id);
create policy personal_ai_memories_insert_self on public.personal_ai_memories for insert to authenticated with check ((select auth.uid()) = user_id);
create policy personal_ai_memories_update_self on public.personal_ai_memories for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy personal_ai_memories_delete_self on public.personal_ai_memories for delete to authenticated using ((select auth.uid()) = user_id);

create policy personal_ai_items_select_self on public.personal_ai_items for select to authenticated using ((select auth.uid()) = user_id);
create policy personal_ai_items_insert_self on public.personal_ai_items for insert to authenticated with check ((select auth.uid()) = user_id);
create policy personal_ai_items_update_self on public.personal_ai_items for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy personal_ai_items_delete_self on public.personal_ai_items for delete to authenticated using ((select auth.uid()) = user_id);

create policy personal_ai_relationship_contexts_select_self on public.personal_ai_relationship_contexts for select to authenticated using ((select auth.uid()) = user_id);
create policy personal_ai_relationship_contexts_insert_self on public.personal_ai_relationship_contexts for insert to authenticated with check ((select auth.uid()) = user_id);
create policy personal_ai_relationship_contexts_update_self on public.personal_ai_relationship_contexts for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy personal_ai_relationship_contexts_delete_self on public.personal_ai_relationship_contexts for delete to authenticated using ((select auth.uid()) = user_id);

create policy personal_ai_action_audit_select_self on public.personal_ai_action_audit for select to authenticated using ((select auth.uid()) = user_id);
create policy personal_ai_action_audit_insert_self on public.personal_ai_action_audit for insert to authenticated with check ((select auth.uid()) = user_id);

revoke all on table public.personal_ai_profiles from anon;
revoke all on table public.personal_ai_threads from anon;
revoke all on table public.personal_ai_turns from anon;
revoke all on table public.personal_ai_memories from anon;
revoke all on table public.personal_ai_items from anon;
revoke all on table public.personal_ai_relationship_contexts from anon;
revoke all on table public.personal_ai_action_audit from anon;

grant select, insert, update, delete on table public.personal_ai_profiles to authenticated;
grant select, insert, update, delete on table public.personal_ai_threads to authenticated;
grant select, insert, delete on table public.personal_ai_turns to authenticated;
grant select, insert, update, delete on table public.personal_ai_memories to authenticated;
grant select, insert, update, delete on table public.personal_ai_items to authenticated;
grant select, insert, update, delete on table public.personal_ai_relationship_contexts to authenticated;
grant select, insert on table public.personal_ai_action_audit to authenticated;
