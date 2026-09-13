-- Harden the canonical control plane after bounded review.
-- This migration is additive and non-destructive.

-- Make the service-side execution contract explicit instead of relying on
-- project default privileges. Authenticated/anon roles remain read-only or
-- fully denied according to the previous migration's RLS/grant posture.
grant usage on schema public to service_role;

grant select, insert, update, delete on
  public.control_plane_tenants,
  public.control_plane_agents,
  public.control_plane_recovery_items,
  public.control_plane_entities,
  public.control_plane_classifications,
  public.control_plane_entity_mappings,
  public.control_plane_gaps,
  public.control_plane_work_items,
  public.control_plane_evidence,
  public.control_plane_readiness_assessments,
  public.control_plane_capability_grants,
  public.control_plane_ai_authority_grants
  to service_role;

grant select, insert on
  public.control_plane_policy_evaluations,
  public.control_plane_agent_audit_events
  to service_role;

revoke all on function public.pantavion_evaluate_ai_authority(uuid, uuid, uuid, text, text, uuid)
  from public, anon, authenticated;
grant execute on function public.pantavion_evaluate_ai_authority(uuid, uuid, uuid, text, text, uuid)
  to service_role;

-- Evidence-backed readiness must not be able to reference missing evidence.
-- Unassessed is the only state allowed without evidence; every claimed state
-- after that requires at least one evidence record from the same tenant.
create or replace function public.pantavion_assert_readiness_evidence_integrity()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.state <> 'unassessed' and coalesce(cardinality(new.evidence_ids), 0) = 0 then
    raise exception 'control_plane_readiness_requires_evidence';
  end if;

  if exists (
    select 1
    from unnest(coalesce(new.evidence_ids, '{}'::uuid[])) as evidence_id
    left join public.control_plane_evidence e
      on e.id = evidence_id
     and e.tenant_id = new.tenant_id
    where e.id is null
  ) then
    raise exception 'control_plane_readiness_evidence_mismatch';
  end if;

  return new;
end;
$$;

drop trigger if exists control_plane_readiness_evidence_integrity
  on public.control_plane_readiness_assessments;
create trigger control_plane_readiness_evidence_integrity
before insert or update on public.control_plane_readiness_assessments
for each row execute function public.pantavion_assert_readiness_evidence_integrity();

-- Consent references are part of the authorization boundary. Enforce ownership
-- when a consent record is attached to a grant or lifecycle record.
create or replace function public.pantavion_assert_control_plane_consent_integrity()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  subject_user_id uuid;
begin
  if new.consent_record_id is null then
    return new;
  end if;

  if tg_table_name in ('control_plane_ai_authority_grants','control_plane_policy_evaluations') then
    subject_user_id := new.user_id;
  else
    subject_user_id := new.owner_user_id;
  end if;

  if not exists (
    select 1
    from public.consent_records c
    where c.id = new.consent_record_id
      and c.user_id = subject_user_id
  ) then
    raise exception 'control_plane_consent_owner_mismatch';
  end if;

  return new;
end;
$$;

do $$
declare table_name text;
begin
  foreach table_name in array array[
    'control_plane_recovery_items',
    'control_plane_classifications',
    'control_plane_evidence',
    'control_plane_ai_authority_grants',
    'control_plane_policy_evaluations'
  ] loop
    execute format('drop trigger if exists %I on public.%I', table_name || '_consent_integrity', table_name);
    execute format(
      'create trigger %I before insert or update on public.%I for each row execute function public.pantavion_assert_control_plane_consent_integrity()',
      table_name || '_consent_integrity',
      table_name
    );
  end loop;
end $$;

-- Keep append-only audit actor identity tenant-aligned under the current
-- single-owner tenant model. Future multi-member tenants can replace this with
-- an explicit tenant membership table without weakening today's boundary.
create or replace function public.pantavion_assert_control_plane_audit_actor_integrity()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.actor_user_id is not null and not exists (
    select 1
    from public.control_plane_tenants t
    where t.id = new.tenant_id
      and t.owner_user_id = new.actor_user_id
  ) then
    raise exception 'control_plane_audit_actor_tenant_mismatch';
  end if;
  return new;
end;
$$;

drop trigger if exists control_plane_agent_audit_actor_integrity
  on public.control_plane_agent_audit_events;
create trigger control_plane_agent_audit_actor_integrity
before insert on public.control_plane_agent_audit_events
for each row execute function public.pantavion_assert_control_plane_audit_actor_integrity();
