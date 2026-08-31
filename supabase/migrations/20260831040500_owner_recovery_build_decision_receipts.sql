create table if not exists public.owner_recovery_build_decisions (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id),
  build_order_id text not null check (build_order_id ~ '^recovery_build_order_[0-9a-f]{64}$'),
  build_order_digest text not null check (build_order_digest ~ '^[0-9a-f]{64}$'),
  readiness_digest text not null check (readiness_digest ~ '^[0-9a-f]{64}$'),
  readiness_index_digest text not null check (readiness_index_digest ~ '^[0-9a-f]{64}$'),
  decision text not null check (decision in ('approve_scoped_implementation', 'reject')),
  decision_scope text not null check (decision_scope in ('isolated_code_preparation_only', 'remain_blocked')),
  note text check (note is null or char_length(note) between 1 and 2000),
  assurance_level text not null check (assurance_level = 'aal2'),
  source_implementation_state text not null check (source_implementation_state = 'IDEA'),
  next_permitted_lifecycle_state text not null check (next_permitted_lifecycle_state in ('IDEA', 'CODED')),
  decided_at timestamptz not null,
  receipt_digest text not null unique check (receipt_digest ~ '^[0-9a-f]{64}$'),
  receipt_payload jsonb not null,
  created_at timestamptz not null default now(),
  unique (owner_user_id, build_order_id, readiness_digest),
  constraint owner_recovery_build_decision_scope_matches check (
    (
      decision = 'approve_scoped_implementation'
      and decision_scope = 'isolated_code_preparation_only'
      and next_permitted_lifecycle_state = 'CODED'
    ) or (
      decision = 'reject'
      and decision_scope = 'remain_blocked'
      and next_permitted_lifecycle_state = 'IDEA'
    )
  ),
  constraint owner_recovery_build_decision_payload_matches check (
    receipt_payload #>> '{marker}' = 'pantavion_recovery_build_owner_decision_receipt_v1'
    and receipt_payload #>> '{ownerUserId}' = owner_user_id::text
    and receipt_payload #>> '{buildOrderId}' = build_order_id
    and receipt_payload #>> '{buildOrderDigest}' = build_order_digest
    and receipt_payload #>> '{readinessDigest}' = readiness_digest
    and receipt_payload #>> '{readinessIndexDigest}' = readiness_index_digest
    and receipt_payload #>> '{decision}' = decision
    and receipt_payload #>> '{decisionScope}' = decision_scope
    and receipt_payload #>> '{note}' is not distinct from note
    and receipt_payload #>> '{assuranceLevel}' = assurance_level
    and receipt_payload #>> '{sourceImplementationState}' = source_implementation_state
    and receipt_payload #>> '{nextPermittedLifecycleState}' = next_permitted_lifecycle_state
    and (receipt_payload #>> '{decidedAt}')::timestamptz = decided_at
    and receipt_payload #>> '{receiptDigest}' = receipt_digest
    and receipt_payload #>> '{separateCapabilityGrantRequired}' = 'true'
    and receipt_payload #>> '{separateBudgetGrantRequired}' = 'true'
    and receipt_payload #>> '{exactRevisionEvidenceRequired}' = 'true'
    and receipt_payload #>> '{scopeApprovalRecorded}' =
      case when decision = 'approve_scoped_implementation' then 'true' else 'false' end
  ),
  constraint owner_recovery_build_decision_authority_fail_closed check (
    receipt_payload #>> '{authority,codeMutation}' = 'false'
    and receipt_payload #>> '{authority,agentGrant}' = 'false'
    and receipt_payload #>> '{authority,execution}' = 'false'
    and receipt_payload #>> '{authority,productionWrite}' = 'false'
    and receipt_payload #>> '{authority,merge}' = 'false'
    and receipt_payload #>> '{authority,deployment}' = 'false'
    and receipt_payload #>> '{authority,publicExposure}' = 'false'
    and receipt_payload #>> '{authority,release}' = 'false'
    and receipt_payload #>> '{completion}' = 'false'
  )
);

create index if not exists owner_recovery_build_decisions_owner_created_idx
  on public.owner_recovery_build_decisions(owner_user_id, created_at desc);

alter table public.owner_recovery_build_decisions enable row level security;
revoke all on table public.owner_recovery_build_decisions from public, anon, authenticated;
grant select, insert on table public.owner_recovery_build_decisions to service_role;

create or replace function public.pantavion_reject_owner_build_decision_mutation()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  raise exception 'owner_recovery_build_decisions_are_append_only';
end;
$$;

revoke all on function public.pantavion_reject_owner_build_decision_mutation() from public, anon, authenticated;

drop trigger if exists owner_recovery_build_decisions_append_only
  on public.owner_recovery_build_decisions;
create trigger owner_recovery_build_decisions_append_only
  before update or delete on public.owner_recovery_build_decisions
  for each row execute function public.pantavion_reject_owner_build_decision_mutation();
