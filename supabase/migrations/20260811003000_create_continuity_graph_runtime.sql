-- Pantavion Continuity Graph persistence

create table if not exists public.continuity_threads (
  thread_id text primary key,
  user_id text not null,
  project_id text,
  domain text,
  title text not null,
  status text not null check (status in ('active','paused','resolved','archived')),
  resolution_state text not null check (resolution_state in ('unresolved','in_progress','resolved')),
  summary text,
  tags text[] not null default '{}',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  last_recalled_at timestamptz,
  resolved_at timestamptz
);

create index if not exists continuity_threads_user_updated_idx on public.continuity_threads(user_id, updated_at desc);
create index if not exists continuity_threads_project_domain_idx on public.continuity_threads(project_id, domain, updated_at desc);

create table if not exists public.continuity_edges (
  edge_id text primary key,
  from_thread_id text not null references public.continuity_threads(thread_id) on delete cascade,
  to_thread_id text not null references public.continuity_threads(thread_id) on delete cascade,
  kind text not null check (kind in ('parent','continuation','merged_into','related')),
  created_at timestamptz not null,
  metadata jsonb not null default '{}'::jsonb,
  check (from_thread_id <> to_thread_id)
);
create index if not exists continuity_edges_from_idx on public.continuity_edges(from_thread_id, created_at);
create index if not exists continuity_edges_to_idx on public.continuity_edges(to_thread_id, created_at);

create table if not exists public.continuity_decisions (
  decision_id text primary key,
  thread_id text not null references public.continuity_threads(thread_id) on delete cascade,
  title text not null,
  decision text not null,
  rationale text,
  status text not null check (status in ('active','superseded','reversed')),
  supersedes_decision_id text references public.continuity_decisions(decision_id) on delete set null,
  created_at timestamptz not null,
  created_by text,
  metadata jsonb not null default '{}'::jsonb
);
create index if not exists continuity_decisions_thread_idx on public.continuity_decisions(thread_id, created_at);

create table if not exists public.continuity_artifacts (
  artifact_id text primary key,
  thread_id text not null references public.continuity_threads(thread_id) on delete cascade,
  kind text not null,
  title text not null,
  uri text,
  repository text,
  commit_sha text,
  path text,
  checksum text,
  created_at timestamptz not null,
  metadata jsonb not null default '{}'::jsonb
);
create index if not exists continuity_artifacts_thread_idx on public.continuity_artifacts(thread_id, created_at);

create table if not exists public.continuity_execution_links (
  link_id text primary key,
  thread_id text not null references public.continuity_threads(thread_id) on delete cascade,
  execution_id text not null references public.durable_executions(execution_id) on delete cascade,
  purpose text,
  created_at timestamptz not null,
  metadata jsonb not null default '{}'::jsonb,
  unique(thread_id, execution_id)
);
create index if not exists continuity_execution_links_thread_idx on public.continuity_execution_links(thread_id, created_at);

alter table public.continuity_threads enable row level security;
alter table public.continuity_edges enable row level security;
alter table public.continuity_decisions enable row level security;
alter table public.continuity_artifacts enable row level security;
alter table public.continuity_execution_links enable row level security;

revoke all on public.continuity_threads from anon, authenticated;
revoke all on public.continuity_edges from anon, authenticated;
revoke all on public.continuity_decisions from anon, authenticated;
revoke all on public.continuity_artifacts from anon, authenticated;
revoke all on public.continuity_execution_links from anon, authenticated;
