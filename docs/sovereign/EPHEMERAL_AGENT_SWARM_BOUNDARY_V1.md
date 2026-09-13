# Ephemeral Agent Swarm Boundary v1

## Purpose

Define a reviewable, fail-closed boundary for ephemeral agents operating under the Sovereign Technology Factory. This document is a contract and evidence surface; it is not an activation grant.

## Canonical lifecycle

All implementation work MUST progress one step at a time:

`IDEA -> CODED -> TESTED -> MERGED -> DEPLOYED -> VERIFIED_LIVE`

Missing, stale, contradictory, or unverifiable evidence forces `HOLD`.

## Agent envelope

Every ephemeral agent request MUST include:

- `agentId`, `swarmId`, `intentId`
- immutable parent request digest
- explicit capability identifiers and scopes
- `createdAt`, `expiresAt`, and maximum lifetime
- maximum steps, retries, duration, and cost budget
- execution mode: `connected` or `disconnected`
- owner/authority context and consent status
- rollback reference and evidence sink

The envelope is immutable after admission. Any mutation creates a new request and digest.

## Admission and execution rules

1. Creation is not activation.
2. No agent may execute before explicit activation evidence exists.
3. Each agent may use only the capabilities and scopes in its envelope.
4. Expired agents, expired grants, scope mismatches, replayed requests, and exhausted budgets fail closed.
5. A swarm may not widen authority by delegating, spawning, or chaining agents.
6. Network-required, irreversible, production-write, external-message, identity/access, regulated, or public-release work is denied or escalated to owner review.
7. Disconnected execution is limited to deterministic, bounded, reversible work with no production writes and no external side effects.
8. Parent cancellation or owner revocation propagates to all descendants.
9. Every decision MUST emit a deterministic disposition: `allow`, `owner_approval_required`, or `deny`.

## Swarm-specific invariants

- Maximum swarm fan-out is explicit and bounded.
- Child agents inherit a subset, never a superset, of parent capabilities.
- Aggregate cost and duration MUST remain within the parent budget.
- Child results MUST carry parent and child digests plus provenance.
- Duplicate intent execution MUST be detected before side effects.
- Partial completion MUST be resumable or safely discarded without hidden continuation.

## Evidence requirements

For every lifecycle transition, record:

- exact commit SHA
- branch and PR
- workflow/run identifiers and conclusions
- test scope and result
- security/privacy/legal/rollback gate results
- owner decision evidence where applicable
- timestamp in UTC
- deterministic snapshot digest
- blocker or explicit `null`
- next allowed transition

A preview deployment is not production deployment and does not prove `DEPLOYED` or `VERIFIED_LIVE`.

## Authority boundary

The following remain false unless separately authorized and evidenced:

- owner admission
- production mutation
- public release
- external technology authorization
- agent activation
- force-push

This contract cannot authorize any of the above. It only defines conditions for review and verification.

## Test plan for the next transition

The implementation must cover at minimum:

- creation without activation
- capability and scope inheritance
- expiry and revocation propagation
- fan-out and aggregate-budget limits
- replay and duplicate-intent rejection
- disconnected-mode restrictions
- deterministic digest/tamper detection
- fail-closed behavior for production writes and external side effects
- lifecycle and evidence-schema validation
