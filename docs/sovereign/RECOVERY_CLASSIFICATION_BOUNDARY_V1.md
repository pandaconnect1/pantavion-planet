# Pantavion Canonical Recovery & Classification Boundary v1

**Lifecycle state: CODED**

## Purpose

Define a deterministic, loss-preserving boundary for recovering, classifying, deduplicating, and indexing Pantavion material before any implementation, merge, deployment, owner admission, or external authorization.

## Non-negotiable invariants

- Preserve every source artifact; never destructive-delete during recovery.
- Record source locator, acquisition timestamp, content digest, byte/line counts, and parser status.
- Separate `raw`, `normalized`, `classified`, `deduplicated`, `verified`, and `quarantined` states.
- Treat conflicting claims as `CONFLICT` until resolved by explicit evidence; never silently overwrite.
- Keep deterministic truth boundaries between recovered material, inferred metadata, and authorized implementation decisions.
- Require stable identifiers derived from canonical content digests; path names are not identity.

## Classification contract

Each recovered item must carry:

- `artifact_id` and `content_sha256`
- source repository/project/surface and exact locator
- material type and Pantavion workstream/module
- language/encoding and parse confidence
- provenance chain and parent/duplicate references
- sensitivity flags for privacy, legal, security, owner-control, and production impact
- current lifecycle state and next permitted transition
- blocker or conflict reason when applicable

## Deduplication and conflict handling

- Exact duplicates may be linked by digest but not discarded.
- Near-duplicates require similarity evidence and retain both source records.
- Conflicting versions remain parallel records with explicit precedence metadata only when supported by evidence.
- Any unresolved ambiguity forces `HOLD` for downstream implementation.

## Safe processing boundary

Recovery/classification work is read-only with respect to production data and external systems. It must not:

- mutate production or Supabase data;
- authorize technologies, agents, owners, or public release;
- bypass privacy, legal, security, consent, jurisdiction, or rollback gates;
- claim `TESTED`, `MERGED`, `DEPLOYED`, or `VERIFIED_LIVE` without exact evidence.

## Evidence required for the next transition

To move from `CODED` to `TESTED`, attach exact evidence for:

1. schema/contract validation;
2. deterministic digest and identity tests;
3. preservation and duplicate-link tests;
4. conflict/quarantine tests;
5. security/privacy/legal boundary tests;
6. exact commit SHA and successful CI/build/type/test/security runs.

## Canonical lifecycle

`IDEA -> CODED -> TESTED -> MERGED -> DEPLOYED -> VERIFIED_LIVE`

Only one forward transition is permitted per evidence checkpoint. Missing, stale, or contradictory evidence forces `HOLD`.
