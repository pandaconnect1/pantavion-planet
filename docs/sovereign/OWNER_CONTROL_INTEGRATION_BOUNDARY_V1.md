# Pantavion Sovereign Technology Factory — Owner Control Integration Boundary v1

**Status:** `CODED` (documentation-only; isolated reviewable branch)

## Purpose

Define a fail-closed integration boundary between the Sovereign Technology Factory and founder/owner control. This contract describes how requests may be prepared for review without granting authority to admit, merge, deploy, publish, mutate production data, authorize external technologies, or activate agents.

## Canonical decision states

- `owner_approval_required` — the request is structurally valid but cannot proceed without an explicit owner decision.
- `owner_approved_for_review_only` — the owner approved examination or bounded preparation only; no execution authority is implied.
- `denied` — the request violates scope, policy, evidence, privacy, legal, security, rollback, or lifecycle gates.
- `expired` — approval window or referenced evidence is no longer valid.
- `revoked` — the owner approval or delegated scope was explicitly withdrawn.

## Immutable owner-control envelope

Every reviewable request MUST preserve an immutable envelope containing:

- request id and parent request id;
- canonical intent digest;
- requested lifecycle transition;
- repository, branch, commit SHA, and changed-surface digest;
- requested capabilities and explicit denied capabilities;
- risk, privacy, legal, security, rollback, and consent assessments;
- evidence references with timestamps and freshness limits;
- owner identity reference, decision, decision timestamp, expiry, and revocation pointer;
- execution mode (`review_only`, `connected`, or `disconnected_edge`);
- deterministic decision digest.

Any mismatch between the envelope and the current request MUST fail closed.

## Approval semantics

1. Approval is scoped to the exact request digest, repository, branch/commit, capabilities, and time window.
2. Approval does not authorize merge, deployment, production mutation, public release, external-provider authorization, or agent activation.
3. A request that changes material scope, code, evidence, destination, risk class, or capability set MUST return to `owner_approval_required`.
4. Missing, stale, contradictory, unverifiable, or tampered evidence MUST produce `denied` or `expired`.
5. Owner control cannot override legal, privacy, security, consent, rollback, or platform policy gates.
6. No delegated actor may widen owner-approved scope.

## Lifecycle integration

Allowed progression remains strictly:

`IDEA -> CODED -> TESTED -> MERGED -> DEPLOYED -> VERIFIED_LIVE`

Owner control may acknowledge evidence or authorize the next review step, but each transition still requires its own exact evidence. A successful review decision never collapses multiple lifecycle states.

## Safe handling of high-impact actions

The following remain blocked unless separately authorized by applicable gates and independently verified:

- production or Supabase writes;
- public release or user-visible activation;
- external technology or provider authorization;
- agent activation or swarm fan-out;
- security-sensitive identity/access changes;
- irreversible or difficult-to-rollback actions;
- force-push, destructive branch operations, or evidence deletion.

## Disconnected / edge mode

Disconnected or edge execution may only prepare deterministic, bounded, reversible review artifacts. It cannot consume a stale owner approval, mint new authority, bypass revocation, or perform network-required or production actions. Reconnection MUST revalidate the full envelope and all evidence before any further review.

## Exact evidence required for a later transition

A future transition beyond `CODED` requires, at minimum:

- exact head SHA;
- exact workflow/run identifiers and successful conclusions;
- test/build/type/security evidence applicable to the change;
- owner-control decision record with scope and expiry;
- gate snapshot showing production mutation, public release, external authorization, and agent activation remain closed unless separately authorized;
- timestamped deterministic digest of the reviewed state;
- blocker or next-transition record.

## Non-authorizing boundary

This document is a design and evidence contract only. It does not create owner authority, delegate authority, authorize execution, or permit any production or external side effect.

## Test plan

The next lifecycle stage should validate:

- exact-scope approval and scope-mismatch denial;
- stale, revoked, malformed, and tampered approval handling;
- one-step lifecycle enforcement;
- disconnected revalidation after reconnect;
- denial of production/public/external/agent actions;
- deterministic decision-digest equivalence for equivalent inputs;
- preservation of prior evidence and immutable audit records.
