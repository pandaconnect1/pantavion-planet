-- Canonical, service-controlled control plane for recovery-to-readiness.
-- This migration preserves existing registries and historical evidence; it creates no destructive path.

create extension if not exists pgcrypto;

create table if not exists public.control_plane_tenants (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete restrict,
  slug text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{1,62}$'),
  lifecycle_state text not null default 'active' check (lifecycle_state in ('active','archived','retained','purged')),
  retention_until timestamptz,
  provenance jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.control_plane_agents (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.control_plane_tenants(id) on delete restrict,
  owner_user_id uuid not null references auth.users(id) on delete restrict,
  agent_key text not null,
  display_name text not null,
  lifecycle_state text not null default 'active' check (lifecycle_state in ('active','suspended','retired')),
  provenance jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, agent_key)
);

create table if not exists public.control_plane_recovery_items (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.control_plane_tenants(id) on delete restrict,
  owner_user_id uuid not null references auth.users(id) on delete restrict,
  source_locator text not null,
  source_kind text not null,
  content_fingerprint text,
  state text not null default 'discovered' check (state in ('discovered','classified','mapped','superseded','archived')),
  consent_record_id uuid references public.consent_records(id) on delete set null,
  consent_basis text,
  authorization_boundary text not null default 'server-controlled',
  lifecycle_state text not null default 'active' check (lifecycle_state in ('active','archived','retained','purged')),
  retention_until timestamptz,
  provenance jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, source_locator)
);

create table if not exists public.control_plane_entities (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.control_plane_tenants(id) on delete restrict,
  owner_user_id uuid not null references auth.users(id) on delete restrict,
  entity_type text not null,
  canonical_key text not null check (canonical_key ~ '^[a-z0-9][a-z0-9._:-]{1,127}$'),
  display_name text not null,
  authorization_boundary text not null default 'server-controlled',
  lifecycle_state text not null default 'active' check (lifecycle_state in ('active','archived','retained','purged')),
  retention_until timestamptz,
  provenance jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, canonical_key)
);

create table if not exists public.control_plane_classifications (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.control_plane_tenants(id) on delete restrict,
  owner_user_id uuid not null references auth.users(id) on delete restrict,
  recovery_item_id uuid not null references public.control_plane_recovery_items(id) on delete restrict,
  decision text not null check (decision in ('keep','merge','evolve','rebuild','archive','investigate')),
  canonical_target text not null,
  rationale text not null,
  consent_record_id uuid references public.consent_records(id) on delete set null,
  consent_basis text,
  authorization_boundary text not null default 'server-controlled',
  lifecycle_state text not null default 'active' check (lifecycle_state in ('active','archived','retained','purged')),
  retention_until timestamptz,
  provenance jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.control_plane_entity_mappings (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.control_plane_tenants(id) on delete restrict,
  owner_user_id uuid not null references auth.users(id) on delete restrict,
  classification_id uuid not null references public.control_plane_classifications(id) on delete restrict,
  entity_id uuid not null references public.control_plane_entities(id) on delete restrict,
  module_path text not null,
  mapping_kind text not null,
  authorization_boundary text not null default 'server-controlled',
  lifecycle_state text not null default 'active' check (lifecycle_state in ('active','archived','retained','purged')),
  retention_until timestamptz,
  provenance jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (classification_id, entity_id, module_path)
);

create table if not exists public.control_plane_gaps (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.control_plane_tenants(id) on delete restrict,
  owner_user_id uuid not null references auth.users(id) on delete restrict,
  mapping_id uuid not null references public.control_plane_entity_mappings(id) on delete restrict,
  title text not null,
  severity text not null check (severity in ('critical','high','medium','low')),
  state text not null default 'open' check (state in ('open','accepted','resolved','wont_fix')),
  authorization_boundary text not null default 'server-controlled',
  lifecycle_state text not null default 'active' check (lifecycle_state in ('active','archived','retained','purged')),
  retention_until timestamptz,
  provenance jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.control_plane_work_items (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.control_plane_tenants(id) on delete restrict,
  owner_user_id uuid not null references auth.users(id) on delete restrict,
  gap_id uuid references public.control_plane_gaps(id) on delete restrict,
  canonical_entity_id uuid not null references public.control_plane_entities(id) on delete restrict,
  title text not null,
  state text not null default 'planned' check (state in ('planned','in_progress','blocked','implemented','tested','completed','cancelled')),
  requires_human_approval boolean not null default true,
  authorization_boundary text not null default 'server-controlled',
  lifecycle_state text not null default 'active' check (lifecycle_state in ('active','archived','retained','purged')),
  retention_until timestamptz,
  provenance jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.control_plane_evidence (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.control_plane_tenants(id) on delete restrict,
  owner_user_id uuid not null references auth.users(id) on delete restrict,
  work_item_id uuid references public.control_plane_work_items(id) on delete restrict,
  canonical_entity_id uuid references public.control_plane_entities(id) on delete restrict,
  kind text not null check (kind in ('source','migration','test','deployment','runtime_verification','audit','other')),
  locator text not null,
  checksum text,
  observed_at timestamptz not null,
  consent_record_id uuid references public.consent_records(id) on delete set null,
  consent_basis text,
  authorization_boundary text not null default 'server-controlled',
  lifecycle_state text not null default 'active' check (lifecycle_state in ('active','archived','retained','purged')),
  retention_until timestamptz,
  provenance jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  check (work_item_id is not null or canonical_entity_id is not null)
);

create table if not exists public.control_plane_readiness_assessments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.control_plane_tenants(id) on delete restrict,
  owner_user_id uuid not null references auth.users(id) on delete restrict,
  canonical_entity_id uuid not null references public.control_plane_entities(id) on delete restrict,
  state text not null default 'unassessed' check (state in ('unassessed','canonicalized','implemented','secured','tested','deployed','verified','blocked')),
  evaluated_by text not null,
  reason text not null,
  evidence_ids uuid[] not null default '{}',
  authorization_boundary text not null default 'server-controlled',
  lifecycle_state text not null default 'active' check (lifecycle_state in ('active','archived','retained','purged')),
  retention_until timestamptz,
  provenance jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.control_plane_capability_grants (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.control_plane_tenants(id) on delete restrict,
  user_id uuid not null references auth.users(id) on delete restrict,
  capability_key text not null,
  authorization_boundary text not null,
  state text not null default 'active' check (state in ('active','suspended','revoked','expired')),
  granted_by uuid references auth.users(id) on delete set null,
  expires_at timestamptz,
  provenance jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, user_id, capability_key, authorization_boundary)
);

create table if not exists public.control_plane_ai_authority_grants (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.control_plane_tenants(id) on delete restrict,
  user_id uuid not null references auth.users(id) on delete restrict,
  agent_id uuid not null references public.control_plane_agents(id) on delete restrict,
  capability_key text not null,
  authorization_boundary text not null,
  consent_record_id uuid references public.consent_records(id) on delete restrict,
  requires_human_approval boolean not null default true,
  state text not null default 'active' check (state in ('active','suspended','revoked','expired')),
  expires_at timestamptz,
  provenance jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, user_id, agent_id, capability_key, authorization_boundary)
);

create table if not exists public.control_plane_policy_evaluations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.control_plane_tenants(id) on delete restrict,
  user_id uuid not null references auth.users(id) on delete restrict,
  agent_id uuid not null references public.control_plane_agents(id) on delete restrict,
  capability_key text not null,
  resource_type text not null,
  resource_id text not null,
  authorization_boundary text not null,
  consent_record_id uuid references public.consent_records(id) on delete set null,
  policy_version text not null,
  decision text not null check (decision in ('allow','deny','require_human_approval')),
  reason text not null,
  input_fingerprint text not null,
  evaluated_at timestamptz not null default now(),
  provenance jsonb not null default '{}'::jsonb
);

create table if not exists public.control_plane_agent_audit_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.control_plane_tenants(id) on delete restrict,
  agent_id uuid references public.control_plane_agents(id) on delete restrict,
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  subject_type text not null,
  subject_id text not null,
  decision text,
  provenance jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);

create index if not exists control_plane_recovery_tenant_state_idx on public.control_plane_recovery_items(tenant_id, state, updated_at desc);
create index if not exists control_plane_work_items_tenant_state_idx on public.control_plane_work_items(tenant_id, state, updated_at desc);
create index if not exists control_plane_evidence_entity_idx on public.control_plane_evidence(canonical_entity_id, observed_at desc);
create index if not exists control_plane_readiness_entity_idx on public.control_plane_readiness_assessments(canonical_entity_id, created_at desc);
create index if not exists control_plane_policy_evaluations_lookup_idx on public.control_plane_policy_evaluations(tenant_id, user_id, agent_id, capability_key, evaluated_at desc);
create index if not exists control_plane_agent_audit_subject_idx on public.control_plane_agent_audit_events(tenant_id, subject_type, subject_id, occurred_at desc);

-- Deterministic authorization gate for delegated AI actions. The caller records
-- its result in the append-only evaluation ledger before performing the action.
create or replace function public.pantavion_evaluate_ai_authority(
  p_tenant_id uuid,
  p_user_id uuid,
  p_agent_id uuid,
  p_capability_key text,
  p_authorization_boundary text,
  p_consent_record_id uuid default null
)
returns table(decision text, reason text, policy_version text)
language sql
stable
security definer
set search_path = public
as $$
  select
    case
      when not exists (
        select 1 from public.control_plane_agents a
        where a.id = p_agent_id and a.tenant_id = p_tenant_id and a.owner_user_id = p_user_id and a.lifecycle_state = 'active'
      ) then 'deny'
      when not exists (
        select 1 from public.control_plane_capability_grants g
        where g.tenant_id = p_tenant_id and g.user_id = p_user_id and g.capability_key = p_capability_key
          and g.authorization_boundary = p_authorization_boundary and g.state = 'active'
          and (g.expires_at is null or g.expires_at > now())
      ) then 'deny'
      when not exists (
        select 1 from public.control_plane_ai_authority_grants ag
        where ag.tenant_id = p_tenant_id and ag.user_id = p_user_id and ag.agent_id = p_agent_id
          and ag.capability_key = p_capability_key and ag.authorization_boundary = p_authorization_boundary
          and ag.state = 'active' and (ag.expires_at is null or ag.expires_at > now())
          and (
            ag.consent_record_id is null
            or (
              ag.consent_record_id = p_consent_record_id
              and exists (
                select 1 from public.consent_records c
                where c.id = ag.consent_record_id and c.user_id = p_user_id
                  and c.status = 'granted' and c.revoked_at is null
              )
            )
          )
      ) then 'deny'
      when exists (
        select 1 from public.control_plane_ai_authority_grants ag
        where ag.tenant_id = p_tenant_id and ag.user_id = p_user_id and ag.agent_id = p_agent_id
          and ag.capability_key = p_capability_key and ag.authorization_boundary = p_authorization_boundary
          and ag.state = 'active' and (ag.expires_at is null or ag.expires_at > now()) and ag.requires_human_approval
      ) then 'require_human_approval'
      else 'allow'
    end as decision,
    'control-plane-grant-evaluation' as reason,
    'v1' as policy_version;
$$;

-- Enforce tenant and owner alignment across the lifecycle so service-side writes
-- cannot cross-link records from different tenants.
create or replace function public.pantavion_assert_control_plane_tenant_integrity()
returns trigger language plpgsql set search_path = public as $$
begin
  if tg_table_name in ('control_plane_capability_grants','control_plane_ai_authority_grants','control_plane_policy_evaluations')
     and not exists (select 1 from public.control_plane_tenants t where t.id = new.tenant_id and t.owner_user_id = new.user_id) then
    raise exception 'control_plane_tenant_owner_mismatch';
  end if;
  if tg_table_name in ('control_plane_agents','control_plane_recovery_items','control_plane_entities','control_plane_classifications','control_plane_entity_mappings','control_plane_gaps','control_plane_work_items','control_plane_evidence','control_plane_readiness_assessments')
     and not exists (select 1 from public.control_plane_tenants t where t.id = new.tenant_id and t.owner_user_id = new.owner_user_id) then
    raise exception 'control_plane_tenant_owner_mismatch';
  end if;

  if tg_table_name = 'control_plane_classifications' and not exists (select 1 from public.control_plane_recovery_items r where r.id = new.recovery_item_id and r.tenant_id = new.tenant_id) then raise exception 'control_plane_recovery_tenant_mismatch'; end if;
  if tg_table_name = 'control_plane_entity_mappings' and (not exists (select 1 from public.control_plane_classifications c where c.id = new.classification_id and c.tenant_id = new.tenant_id) or not exists (select 1 from public.control_plane_entities e where e.id = new.entity_id and e.tenant_id = new.tenant_id)) then raise exception 'control_plane_mapping_tenant_mismatch'; end if;
  if tg_table_name = 'control_plane_gaps' and not exists (select 1 from public.control_plane_entity_mappings m where m.id = new.mapping_id and m.tenant_id = new.tenant_id) then raise exception 'control_plane_gap_tenant_mismatch'; end if;
  if tg_table_name = 'control_plane_work_items' and (not exists (select 1 from public.control_plane_entities e where e.id = new.canonical_entity_id and e.tenant_id = new.tenant_id) or (new.gap_id is not null and not exists (select 1 from public.control_plane_gaps g where g.id = new.gap_id and g.tenant_id = new.tenant_id))) then raise exception 'control_plane_work_item_tenant_mismatch'; end if;
  if tg_table_name = 'control_plane_evidence' and ((new.work_item_id is not null and not exists (select 1 from public.control_plane_work_items w where w.id = new.work_item_id and w.tenant_id = new.tenant_id)) or (new.canonical_entity_id is not null and not exists (select 1 from public.control_plane_entities e where e.id = new.canonical_entity_id and e.tenant_id = new.tenant_id))) then raise exception 'control_plane_evidence_tenant_mismatch'; end if;
  if tg_table_name = 'control_plane_readiness_assessments' and not exists (select 1 from public.control_plane_entities e where e.id = new.canonical_entity_id and e.tenant_id = new.tenant_id) then raise exception 'control_plane_readiness_tenant_mismatch'; end if;
  if tg_table_name in ('control_plane_ai_authority_grants','control_plane_policy_evaluations') and not exists (select 1 from public.control_plane_agents a where a.id = new.agent_id and a.tenant_id = new.tenant_id and a.owner_user_id = new.user_id) then raise exception 'control_plane_agent_tenant_mismatch'; end if;
  if tg_table_name = 'control_plane_agent_audit_events' and new.agent_id is not null and not exists (select 1 from public.control_plane_agents a where a.id = new.agent_id and a.tenant_id = new.tenant_id) then raise exception 'control_plane_audit_agent_tenant_mismatch'; end if;
  return new;
end;
$$;

do $$
declare table_name text;
begin
  foreach table_name in array array[
    'control_plane_agents','control_plane_recovery_items','control_plane_entities','control_plane_classifications',
    'control_plane_entity_mappings','control_plane_gaps','control_plane_work_items','control_plane_evidence',
    'control_plane_readiness_assessments','control_plane_capability_grants','control_plane_ai_authority_grants',
    'control_plane_policy_evaluations','control_plane_agent_audit_events'
  ] loop
    execute format('create trigger %I before insert or update on public.%I for each row execute function public.pantavion_assert_control_plane_tenant_integrity()', table_name || '_tenant_integrity', table_name);
  end loop;
end $$;

-- Audits and policy decisions are immutable evidence, including to service-role code.
create or replace function public.pantavion_reject_control_plane_immutable_mutation()
returns trigger language plpgsql set search_path = public as $$
begin
  raise exception 'control_plane_immutable_evidence';
end;
$$;

create trigger control_plane_policy_evaluations_immutable
before update or delete on public.control_plane_policy_evaluations
for each row execute function public.pantavion_reject_control_plane_immutable_mutation();
create trigger control_plane_agent_audit_events_immutable
before update or delete on public.control_plane_agent_audit_events
for each row execute function public.pantavion_reject_control_plane_immutable_mutation();

-- Authenticated users may inspect records only within tenants they own. Mutations
-- remain server-controlled, matching the durable-execution control-plane pattern.
do $$
declare table_name text;
begin
  foreach table_name in array array[
    'control_plane_tenants','control_plane_agents','control_plane_recovery_items','control_plane_entities',
    'control_plane_classifications','control_plane_entity_mappings','control_plane_gaps','control_plane_work_items',
    'control_plane_evidence','control_plane_readiness_assessments','control_plane_capability_grants',
    'control_plane_ai_authority_grants','control_plane_policy_evaluations','control_plane_agent_audit_events'
  ] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('revoke all on public.%I from anon, authenticated', table_name);
  end loop;
end $$;

create policy "control-plane tenant owner read" on public.control_plane_tenants for select to authenticated using (owner_user_id = auth.uid());
create policy "control-plane agents tenant owner read" on public.control_plane_agents for select to authenticated using (exists (select 1 from public.control_plane_tenants t where t.id = tenant_id and t.owner_user_id = auth.uid()));
create policy "control-plane recovery tenant owner read" on public.control_plane_recovery_items for select to authenticated using (exists (select 1 from public.control_plane_tenants t where t.id = tenant_id and t.owner_user_id = auth.uid()));
create policy "control-plane entities tenant owner read" on public.control_plane_entities for select to authenticated using (exists (select 1 from public.control_plane_tenants t where t.id = tenant_id and t.owner_user_id = auth.uid()));
create policy "control-plane classifications tenant owner read" on public.control_plane_classifications for select to authenticated using (exists (select 1 from public.control_plane_tenants t where t.id = tenant_id and t.owner_user_id = auth.uid()));
create policy "control-plane mappings tenant owner read" on public.control_plane_entity_mappings for select to authenticated using (exists (select 1 from public.control_plane_tenants t where t.id = tenant_id and t.owner_user_id = auth.uid()));
create policy "control-plane gaps tenant owner read" on public.control_plane_gaps for select to authenticated using (exists (select 1 from public.control_plane_tenants t where t.id = tenant_id and t.owner_user_id = auth.uid()));
create policy "control-plane work items tenant owner read" on public.control_plane_work_items for select to authenticated using (exists (select 1 from public.control_plane_tenants t where t.id = tenant_id and t.owner_user_id = auth.uid()));
create policy "control-plane evidence tenant owner read" on public.control_plane_evidence for select to authenticated using (exists (select 1 from public.control_plane_tenants t where t.id = tenant_id and t.owner_user_id = auth.uid()));
create policy "control-plane readiness tenant owner read" on public.control_plane_readiness_assessments for select to authenticated using (exists (select 1 from public.control_plane_tenants t where t.id = tenant_id and t.owner_user_id = auth.uid()));
create policy "control-plane capability grants owner read" on public.control_plane_capability_grants for select to authenticated using (user_id = auth.uid());
create policy "control-plane ai authority owner read" on public.control_plane_ai_authority_grants for select to authenticated using (user_id = auth.uid());
create policy "control-plane policy evaluations owner read" on public.control_plane_policy_evaluations for select to authenticated using (user_id = auth.uid());
create policy "control-plane agent audit tenant owner read" on public.control_plane_agent_audit_events for select to authenticated using (exists (select 1 from public.control_plane_tenants t where t.id = tenant_id and t.owner_user_id = auth.uid()));

grant select on public.control_plane_tenants, public.control_plane_agents, public.control_plane_recovery_items,
  public.control_plane_entities, public.control_plane_classifications, public.control_plane_entity_mappings,
  public.control_plane_gaps, public.control_plane_work_items, public.control_plane_evidence,
  public.control_plane_readiness_assessments, public.control_plane_capability_grants,
  public.control_plane_ai_authority_grants, public.control_plane_policy_evaluations,
  public.control_plane_agent_audit_events to authenticated;
revoke all on function public.pantavion_evaluate_ai_authority(uuid, uuid, uuid, text, text, uuid) from public, anon, authenticated;
