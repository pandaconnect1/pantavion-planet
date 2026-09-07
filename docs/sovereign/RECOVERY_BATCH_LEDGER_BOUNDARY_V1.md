# Pantavion Sovereign Recovery Batch Ledger Boundary v1

**Lifecycle state:** `CODED`

## Purpose

Define a loss-preserving, deterministic ledger for recovery/classification batches so every recovered artifact remains traceable from intake through canonical placement without conflating evidence with authorization.

## Batch identity

Each batch MUST include:

- `batch_id`
- `source_locator`
- `source_digest`
- `captured_at`
- `collector_version`
- `artifact_count`
- `batch_digest`
- `parent_batch_id` when derived from an earlier batch

`batch_digest` MUST be calculated over a canonical, sorted representation of the batch manifest. Any digest mismatch places the batch in `quarantined` state.

## Artifact preservation

Recovery is additive and non-destructive. The ledger MUST preserve:

- raw source payload or an immutable pointer to it;
- normalized representation;
- provenance and source locator;
- classification labels and confidence;
- duplicate links without destructive deletion;
- conflict records and quarantine reasons;
- reviewer/evidence references.

Inferred metadata MUST be marked as inferred and MUST NOT overwrite source material.

## Allowed states

`raw -> normalized -> classified -> deduplicated -> verified`

`raw|normalized|classified|deduplicated -> quarantined`

Only adjacent transitions are valid. `verified` MUST NOT imply merge, deployment, publication, owner admission, or production authorization.

## Deterministic conflict handling

Conflicting artifacts MUST remain separately addressable. Resolution requires an explicit evidence record containing:

- conflicting artifact IDs;
- comparison method;
- selected canonical reference, if any;
- unresolved remainder;
- reviewer and timestamp.

Absent sufficient evidence, the result is `quarantined`.

## Recovery-to-implementation boundary

Recovered material MAY inform implementation work, but cannot itself authorize:

- merge or deployment;
- production or Supabase mutation;
- external technology approval;
- owner admission;
- public release;
- agent activation.

These actions require their own exact-scope gates and lifecycle evidence.

## Batch verification evidence

A `TESTED` transition for this boundary requires exact-head evidence for:

1. canonical manifest ordering and digest stability;
2. duplicate-link non-destructiveness;
3. conflict quarantine behavior;
4. provenance retention after normalization;
5. rejection of unauthorized lifecycle jumps;
6. negative tests for digest tampering and missing source locators.

## Safety boundary

Documentation-only. No runtime activation, merge, deployment, production data mutation, owner admission, external technology authorization, public release, force-push, or agent activation is performed by this boundary.
