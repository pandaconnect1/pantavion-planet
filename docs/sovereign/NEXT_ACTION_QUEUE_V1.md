# Pantavion Sovereign Technology Factory — Next Action Queue v1

Updated: 2026-09-08
Canonical repository: `pandaconnect1/pantavion-planet`

## Purpose

This queue converts the recovered Pantavion doctrine and the current Sovereign Technology Factory boundaries into the next reviewable implementation actions. It is planning/control-plane documentation only. It does not authorize runtime activation, owner admission, external technology authorization, merge, deployment, production/Supabase mutation, public release, or agent activation.

## Truth boundary

Lifecycle remains strictly adjacent-only:

`IDEA -> CODED -> TESTED -> MERGED -> DEPLOYED -> VERIFIED_LIVE`

A workstream may advance only when the exact head, applicable gate results, and required evidence are recorded. Preview readiness is not production or live verification.

## Ordered queue

### 1. Intent-to-Outcome Fabric — contract tests first

- Add pure, deterministic tests for intent identity, normalized intent digest, outcome-plan invariants, bounded cost/duration, and fail-closed escalation.
- Prove that malformed, ambiguous, expired, replayed, or over-budget intents cannot produce an executable plan.
- Evidence required: exact commit, test command/results, negative-case matrix, no production writes.
- Next allowed state: `TESTED` only after exact-head CI success.

### 2. Intent Firewall — decision determinism

- Implement or test a pure decision function returning `ALLOW_REVIEW_ONLY`, `OWNER_APPROVAL_REQUIRED`, or `DENY`.
- Cover production, identity/access, external messaging, irreversible action, privacy, legal, consent, jurisdiction, and disconnected-mode gates.
- Evidence required: decision fixtures, replay checks, stable decision digest, explicit deny-path coverage.

### 3. Agent Capability/Budget Control — bounded authorization

- Add deterministic enforcement for capability scope, expiry, delegation, step/retry limits, duration, cost, and cumulative budget.
- Prove that child agents cannot escalate parent scope or budget.
- Evidence required: boundary tests, exhaustion tests, revocation/expiry tests, exact-head CI.

### 4. Ephemeral Agent Swarm — lifecycle without activation

- Test creation versus activation, fan-out limits, aggregate budget, duplicate-intent suppression, expiry, and revocation propagation.
- Keep activation behind explicit owner and safety gates.
- Evidence required: deterministic swarm envelopes, aggregate-limit tests, no live activation assertion.

### 5. Disconnected/edge execution — tamper and replay resistance

- Test canonical packet fields, payload limits, timestamps, digests, replay windows, offline-safe task classes, and sync conflict handling.
- Reject production writes, irreversible actions, and authority escalation while disconnected.
- Evidence required: tamper fixtures, replay fixtures, offline/online reconciliation results.

### 6. Owner Control integration — approval and revocation

- Test exact-scope approvals, expiry, revocation, revalidation after reconnect, and separation of proposal from execution.
- Any owner admission remains an explicit gate; documentation cannot imply approval.
- Evidence required: approval-state matrix, stale/revoked proof tests, audit trail fixtures.

### 7. Technology Library — provenance and readiness

- Add deterministic entry validation for source provenance, legal integration mode, evidence freshness, drift invalidation, and disconnected limits.
- Keep monitor-only and benchmark-only entries non-authorizing.
- Evidence required: schema/fixture tests, stale-evidence invalidation, duplicate/conflict handling.

### 8. Visible implementation-status surface — read-only projection

- Project each workstream with: current lifecycle state, exact head, evidence anchors, blockers, next transition, preview URL (if any), and live-verification status.
- Preserve `UNKNOWN`, `HOLD`, and `BLOCKED` rather than inferring completion.
- Evidence required: deterministic snapshot test and preview-vs-live separation check.

### 9. Canonical recovery/classification — loss-preserving batches

- Continue batch intake with raw preservation, normalized representation, provenance, deterministic IDs, duplicate linking, conflict quarantine, and explicit resolution evidence.
- Never delete or overwrite recovered material as part of classification.
- Evidence required: batch digest, artifact counts, quarantine counts, and classification report.

## Parallelization rule

Independent pure tests and documentation checks may run in parallel. Any change touching shared runtime, persistence, owner control, external providers, or production deployment must remain isolated in its own reviewable branch/PR and must not be merged or deployed without the applicable gates.

## Current blockers

- No authorization exists in this queue for merge, deployment, production/Supabase mutation, owner admission, external technology authorization, public release, or agent activation.
- `TESTED` evidence is valid only for the exact commit under review; later commits require a fresh run.
- Any contradictory, missing, stale, or ambiguous evidence forces `HOLD`/`BLOCKED`.

## Completion definition

A queue item is not complete because a document, route, preview, or workflow exists. Completion requires the full chain: implementation, tests, applicable approvals, deployment, and verified-live evidence recorded against the exact head.