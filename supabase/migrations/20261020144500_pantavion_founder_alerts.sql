create table if not exists public.pantavion_founder_alerts (
 id uuid primary key default gen_random_uuid(),
 source text not null check(length(source) between 2 and 80),
 source_message_id text,
 kernel_id text not null default 'operations' check(kernel_id ~ '^[a-z][a-z0-9_-]{1,79}$'),
 severity text not null check(severity in ('info','warning','critical')),
 status text not null default 'open' check(status in ('open','acknowledged','resolved')),
 title text not null check(length(title) between 1 and 240),
 summary text not null check(length(summary) between 1 and 4000),
 action_required text,
 deadline_at timestamptz,
 evidence jsonb not null default '[]'::jsonb check(jsonb_typeof(evidence)='array'),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(source,source_message_id)
);
create index if not exists pantavion_founder_alerts_status_idx on public.pantavion_founder_alerts(status,severity,created_at desc);
alter table public.pantavion_founder_alerts enable row level security;
revoke all on public.pantavion_founder_alerts from public,anon,authenticated;
grant select,insert,update on public.pantavion_founder_alerts to service_role;
comment on table public.pantavion_founder_alerts is 'Founder-only operational alert inbox. Never expose service_role credentials to browsers; founder access must be checked server-side with MFA.';