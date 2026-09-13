# Pantavion Sovereign Technology Factory — Evidence Ledger Boundary v1

Status: CODED

## Purpose

This document defines a loss-preserving, founder-visible evidence ledger for the Sovereign Technology Factory. It records what is known about each lifecycle transition without granting authority to merge, deploy, activate agents, authorize external technologies, or mutate production data.

## Canonical lifecycle

`IDEA -> CODED -> TESTED -> MERGED -> DEPLOYED -> VERIFIED_LIVE`

Only one adjacent transition may be recorded at a time. A later state must never be inferred from an earlier state, a preview deployment, a green check, or a documentation claim.

## Evidence record

Every ledger entry MUST include:

- `workstream_id`
- `artifact_kind` (`code`, `test`, `documentation`, `recovery`, `status_surface`)
- `repository`
- `base_ref`
- `head_ref`
- `exact_commit_sha`
- `lifecycle_state`
- `evidence_items[]`
- `verified_at`
- `verified_by`
- `blockers[]`
- `next_allowed_transition`
- `authority_gates`
- `deterministic_digest`

Each `evidence_items[]` record SHOULD include the check name, run identifier, status, conclusion, timestamp, and canonical URL. Missing, stale, contradictory, or non-exact-head evidence forces `HOLD`.

## Truth boundaries

The ledger MUST distinguish:

- repository state from hosted preview state,
- CI success from deployment authorization,
- deployment existence from live verification,
- documentation from executable behavior,
- recovered material from inferred classification,
- owner review from owner approval,
- provider availability from technology authorization.

A preview deployment can be recorded as `preview_observed`; it cannot promote a workstream to `DEPLOYED` or `VERIFIED_LIVE`.

## Fail-closed gates

The ledger MUST remain non-authorizing for:

- production or Supabase writes,
- merge or branch promotion,
- public release,
- external technology authorization,
- owner admission or approval,
- agent activation,
- identity/access changes,
- irreversible actions,
- privacy, legal, security, consent, jurisdiction, rollback, and safety gates.

If any gate is unknown, expired, mismatched, or contradictory, the recorded result is `HOLD`.

## Recovery and classification

Recovered content MUST be retained with source locator, content digest, provenance, and classification confidence. Exact duplicates may be linked but not destructively deleted. Conflicts remain visible and quarantined until resolved by an authorized process.

## Deterministic digest

The digest input MUST be canonicalized with stable key ordering, normalized line endings, UTF-8 encoding, and explicit null/empty handling. The digest MUST cover the complete evidence record, including blockers and authority gates.

## Minimum verification set

Before recording `TESTED`, the exact head MUST have applicable:

- build/type checks,
- unit/integration/e2e checks,
- security and policy checks,
- runtime-safety checks,
- recovery/data-integrity checks when recovery material is involved,
- exact-head verification evidence.

The required set is repository-configured and may expand; it may not be silently reduced.

## Status projection contract

A visible implementation-status surface MAY project ledger entries read-only. It MUST:

1. display exact commit and evidence references;
2. display blockers and the next allowed transition;
3. distinguish `TESTED`, `MERGED`, `DEPLOYED`, and `VERIFIED_LIVE`;
4. show unknown or contradictory evidence as `HOLD`;
5. avoid controls that imply authorization or execution.

## Non-authorizing examples

- A successful preview build is not `DEPLOYED`.
- A `Ready` Vercel preview is not `VERIFIED_LIVE`.
- A green CI workflow is not owner approval.
- A documentation PR is not runtime implementation.
- A recovery classification is not permission to delete source material.

## Next transition test plan

To move from `CODED` to `TESTED`, attach exact-head evidence for all applicable checks and confirm no unresolved contradiction. To move beyond `TESTED`, separately satisfy review, owner, legal, privacy, security, rollback, and deployment gates; record each adjacent transition independently.
