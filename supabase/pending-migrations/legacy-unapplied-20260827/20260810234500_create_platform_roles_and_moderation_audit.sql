-- Pantavion governed platform roles + moderation audit
-- Server/admin control plane for listings/media review and publishing.

create table if not exists public.platform_roles (
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('founder','admin','moderator','editor','finance','support','institutional_operator')),
  scope text not null default 'global',
  active boolean not null default true,
  granted_by uuid references auth.users(id) on delete set null,
  granted_at timestamptz not null default now(),
  expires_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  primary key (user_id, role, scope)
);

create index if not exists platform_roles_active_idx
  on public.platform_roles(user_id, active, expires_at);

create table if not exists public.moderation_actions (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid not null references auth.users(id) on delete restrict,
  target_type text not null check (target_type in ('listing','media_item','media_source','account','other')),
  target_id uuid not null,
  action text not null check (action in ('submit_review','approve','reject','publish','unpublish','remove','expire','archive','restore','suspend_source','enable_source','disable_source','correct')),
  previous_state text,
  next_state text,
  reason text,
  evidence jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists moderation_actions_target_idx
  on public.moderation_actions(target_type, target_id, created_at desc);
create index if not exists moderation_actions_actor_idx
  on public.moderation_actions(actor_user_id, created_at desc);

alter table public.platform_roles enable row level security;
alter table public.moderation_actions enable row level security;

-- Ordinary clients can only inspect their own active role assignments.
create policy "users read own platform roles"
on public.platform_roles for select
to authenticated
using (auth.uid() = user_id);

-- Moderation audit is intentionally not directly readable/writable by ordinary clients.
-- Governed server routes use the Supabase service role after independently authenticating the actor.

revoke all on public.platform_roles from anon, authenticated;
revoke all on public.moderation_actions from anon, authenticated;
grant select on public.platform_roles to authenticated;

create or replace function public.pantavion_has_platform_role(
  p_user_id uuid,
  p_roles text[],
  p_scope text default 'global'
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.platform_roles r
    where r.user_id = p_user_id
      and r.role = any(p_roles)
      and r.active = true
      and (r.expires_at is null or r.expires_at > now())
      and (r.scope = p_scope or r.scope = 'global')
  );
$$;

revoke all on function public.pantavion_has_platform_role(uuid, text[], text) from public;
grant execute on function public.pantavion_has_platform_role(uuid, text[], text) to authenticated;
