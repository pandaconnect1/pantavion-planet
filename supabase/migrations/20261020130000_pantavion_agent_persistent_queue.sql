create table if not exists public.pantavion_agent_jobs (
 id uuid primary key default gen_random_uuid(),
 kernel_id text not null check (kernel_id ~ '^[a-z][a-z0-9_-]{1,79}$'),
 role text not null check (role in ('research','planner','builder','reviewer','tester','integration','operations')),
 objective text not null check (length(objective) between 1 and 8000),
 risk text not null default 'read_only' check (risk in ('read_only','sandbox_code','protected_change')),
 status text not null default 'queued' check (status in ('queued','leased','running','awaiting_approval','succeeded','failed','cancelled')),
 attempts integer not null default 0 check (attempts >= 0),
 max_attempts integer not null default 3 check (max_attempts between 1 and 10),
 lease_owner text, lease_expires_at timestamptz,
 artifact_refs jsonb not null default '[]'::jsonb,
 evidence_refs jsonb not null default '[]'::jsonb,
 last_error text,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 constraint pantavion_agent_jobs_artifact_array check (jsonb_typeof(artifact_refs)='array'),
 constraint pantavion_agent_jobs_evidence_array check (jsonb_typeof(evidence_refs)='array')
);
create index if not exists pantavion_agent_jobs_claim_idx on public.pantavion_agent_jobs(status,created_at) where status in ('queued','leased');
alter table public.pantavion_agent_jobs enable row level security;
revoke all on public.pantavion_agent_jobs from anon,authenticated;
create or replace function public.pantavion_agent_claim(p_worker text,p_kernel text,p_lease_seconds integer default 120)
returns setof public.pantavion_agent_jobs language plpgsql security invoker set search_path=public,pg_temp as $$
begin
 if current_user <> 'service_role' or length(coalesce(p_worker,'')) < 3 or p_lease_seconds not between 30 and 600 then raise exception 'not_authorized'; end if;
 return query with candidate as (
 select j.id from public.pantavion_agent_jobs j
 where j.kernel_id=p_kernel and j.risk <> 'protected_change' and j.attempts < j.max_attempts
 and (j.status='queued' or (j.status='leased' and j.lease_expires_at < now()))
 order by j.created_at for update skip locked limit 1
 )
 update public.pantavion_agent_jobs j set status='leased',lease_owner=p_worker,lease_expires_at=now()+make_interval(secs=>p_lease_seconds),attempts=j.attempts+1,updated_at=now()
 from candidate where j.id=candidate.id returning j.*;
end $$;
revoke all on function public.pantavion_agent_claim(text,text,integer) from public,anon,authenticated;
grant execute on function public.pantavion_agent_claim(text,text,integer) to service_role;
grant select,insert,update on public.pantavion_agent_jobs to service_role;