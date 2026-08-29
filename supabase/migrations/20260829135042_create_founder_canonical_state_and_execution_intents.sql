create table if not exists public.pantavion_founder_canonical_states (
  state_id text primary key,
  state_kind text not null,
  title text not null,
  content text not null,
  content_sha256 text not null check (content_sha256 ~ '^[0-9a-f]{64}$'),
  source_ref text,
  truth_state text not null default 'canonical_internal' check (truth_state in ('canonical_internal','superseded_internal','archived_internal')),
  status text not null default 'active' check (status in ('active','superseded','archived')),
  supersedes_state_id text references public.pantavion_founder_canonical_states(state_id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists pantavion_founder_canonical_states_active_kind_idx
  on public.pantavion_founder_canonical_states(state_kind)
  where status = 'active';

create table if not exists public.pantavion_founder_execution_intents (
  intent_id text primary key,
  canonical_state_id text not null references public.pantavion_founder_canonical_states(state_id) on delete cascade,
  idempotency_key text not null unique,
  title text not null,
  founder_intent text not null,
  target text not null check (target in ('pantavion_internal','external_app','api_integration','admin_tool','safety_system','water_infrastructure','sos_elder','translation','marketplace','social_universe','pantaai_center')),
  capabilities text[] not null default '{}'::text[],
  target_files text[] not null default '{}'::text[],
  approval_scope text not null default 'proposal_only' check (approval_scope in ('proposal_only','scoped_draft_patch')),
  workload jsonb,
  status text not null default 'pending_materialization' check (status in ('pending_materialization','materializing','materialized','blocked','cancelled')),
  work_order_execution_id text unique references public.durable_executions(execution_id) on delete set null,
  last_error text,
  materialized_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists pantavion_founder_execution_intents_status_created_idx
  on public.pantavion_founder_execution_intents(status, created_at asc);
create index if not exists pantavion_founder_execution_intents_state_idx
  on public.pantavion_founder_execution_intents(canonical_state_id, created_at asc);

alter table public.pantavion_founder_canonical_states enable row level security;
alter table public.pantavion_founder_canonical_states force row level security;
alter table public.pantavion_founder_execution_intents enable row level security;
alter table public.pantavion_founder_execution_intents force row level security;

revoke all on table public.pantavion_founder_canonical_states from public, anon, authenticated;
revoke all on table public.pantavion_founder_execution_intents from public, anon, authenticated;

grant select, insert, update, delete on table public.pantavion_founder_canonical_states to service_role;
grant select, insert, update, delete on table public.pantavion_founder_execution_intents to service_role;