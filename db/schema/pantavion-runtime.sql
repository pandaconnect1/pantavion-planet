create table if not exists kernel_events (
  id text primary key,
  event_type text not null,
  source text not null,
  priority text not null,
  payload_json jsonb not null,
  created_at timestamptz not null default now(),
  processed_at timestamptz,
  status text not null
);

create table if not exists kernel_decisions (
  id text primary key,
  event_id text not null,
  classification_domain text not null,
  truth_zone text not null,
  sensitivity text not null,
  policy_result jsonb not null,
  decision_mode text not null,
  target_path text,
  rationale text not null,
  created_at timestamptz not null default now()
);

create table if not exists repo_findings (
  id text primary key,
  path text not null,
  finding_type text not null,
  severity text not null,
  summary text not null,
  details_json jsonb,
  resolved boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists build_runs (
  id text primary key,
  branch text not null,
  commit_sha text,
  build_status text not null,
  tsc_status text not null,
  test_status text,
  logs_ref text,
  created_at timestamptz not null default now()
);

create table if not exists approvals (
  id text primary key,
  approval_type text not null,
  subject_type text not null,
  subject_id text not null,
  requested_by text,
  requested_at timestamptz not null default now(),
  resolved_at timestamptz,
  decision text,
  notes text
);