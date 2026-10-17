# Sovereign Technology Library Boundary v1

**Lifecycle state:** `CODED` at branch creation. This document is a documentation-only, fail-closed boundary. It does not authorize runtime activation, external technology approval, production mutation, merge, deployment, public release, or agent execution.

## Purpose

Define the minimum deterministic contract for cataloguing, evaluating, and selecting technologies used by the Sovereign Technology Factory without turning a library record into an authorization or deployment decision.

## Canonical entry

Each technology entry MUST contain:

- stable `technology_id` and immutable `entry_version`;
- name, provider, category, supported interfaces, and declared data flows;
- provenance, licensing/terms reference, jurisdiction and residency constraints;
- capability declarations, required permissions, network needs, and edge/disconnected limits;
- cost model, rate/usage ceilings, operational dependencies, and rollback path;
- security, privacy, legal, consent, accessibility, and safety review references;
- evidence set with exact artifact IDs, commit/run references, timestamps, and digests;
- deterministic readiness status: `hold`, `review_required`, `eligible_for_owner_review`, or `retired`.

## Readiness rules

1. Missing, stale, contradictory, or unverifiable evidence forces `hold`.
2. A technology entry is never an approval, credential, capability grant, or deployment instruction.
3. Selection for an experiment MUST be separated from owner admission and production authorization.
4. External service calls, secret handling, data export, and durable writes require independent gates.
5. Disconnected/edge use is permitted only for pre-declared, reversible, bounded operations with replay-safe evidence.
6. Changes to provider, version, scope, jurisdiction, data flow, or terms create a new entry version and invalidate prior readiness.
7. Deterministic comparison MUST use a normalized field order and digest; nondeterministic metadata is excluded from the digest.

## Decision outcomes

The library may return only:

- `hold`: insufficient or invalid evidence;
- `review_required`: evidence is present but a required review is open;
- `eligible_for_owner_review`: deterministic checks pass, but owner/legal/privacy/security gates remain external;
- `retired`: entry must not be selected.

No library result may return `approved_for_production`, `authorized`, `activated`, or equivalent authority-bearing outcomes.

## Evidence requirements

Every readiness transition MUST record the exact entry version, normalized digest, source artifact references, evaluator version, timestamp, and blocker/next-transition field. Evidence must be reproducible from repository-visible or otherwise explicitly retained artifacts.

## Test plan for `TESTED`

- reject missing provenance, licensing, security, privacy, or evidence fields;
- reject digest changes caused by field reordering or unsupported fields;
- detect stale evidence and version/provider drift;
- enforce non-authorizing outcome vocabulary;
- verify disconnected-mode restrictions and replay safety;
- verify retired entries cannot be selected;
- verify deterministic equal inputs produce equal readiness and digest outputs.

## Lifecycle boundary

Allowed progression is strictly `IDEA -> CODED -> TESTED -> MERGED -> DEPLOYED -> VERIFIED_LIVE`. This PR records `CODED` only until exact-head CI/build/type/test/security evidence is available. Later transitions require their own evidence and applicable owner, legal, privacy, and security gates.
