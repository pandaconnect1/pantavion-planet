# Pantavion Kernel — unified execution contract (draft, non-production)

## Single source of truth
All founder directives, recurring jobs, detected incidents, research findings and improvements must enter one durable Pantavion task ledger. Chat conversations, reminders, GitHub issues and CI reports are *inputs*, not independent sources of completion truth. Never imply that an unconnected source has been ingested.

## Required record fields
- task_id (immutable), source_type, source_locator, source_revision, captured_at
- exact_directive, acceptance_criteria, module, priority, dependencies, assigned_core
- state, attempt_count, next_run_at, lease_owner, lease_expires_at
- requires_founder_approval, approval_reference, risk_class
- artifact_references, test_evidence, deployment_revision, live_verification_evidence
- last_error, blocked_reason, updated_at, audit_events

## State machine
CAPTURED -> DEDUPLICATED -> CLASSIFIED -> READY -> LEASED -> RUNNING -> TESTED -> AWAITING_APPROVAL -> DEPLOYED -> VERIFIED_LIVE.
Alternative states: BLOCKED, RETRY_SCHEDULED, FAILED_SAFE, ROLLED_BACK. State changes are append-only audited events. A job may not be marked VERIFIED_LIVE based only on a passing CI check, a generated report, or a successful GitHub commit.

## Safety and liveness invariants
1. Idempotent ingestion keyed by source locator + revision; never silently discard a changed directive.
2. Durable database-backed queue, bounded retries with backoff, dead-letter recovery, expiring worker leases, and explicit dependency tracking.
3. Health checks and a watchdog with evidence of the last successful execution; a schedule definition alone does not prove 24/7 operation.
4. Critical water-network geometry/topology, access controls, billing, credentials and production changes require human authorization and fail closed.
5. Preserve original water assets and provenance; ZERO DELETE, with backups and rollback plans.
6. Never auto-merge, deploy or report DONE without passing the appropriate risk gate and production checks.
7. Existing kernel/recovery/guardian modules must be integrated by adapters, not replaced by a parallel competing kernel.

## Evidence required to call this complete
- Migration and RLS policies for the task ledger verified on the intended database.
- Real ingestion tests for founder directives, issues, reminders and incident signals.
- End-to-end worker lease, retry, deduplication, restart recovery and approval tests.
- Verified deployment SHA, scheduled executions, telemetry and a production task processed to VERIFIED_LIVE.

**Current status:** architectural integration contract only; not a deployed ledger or running autonomous multi-core orchestrator. Do not claim otherwise.
