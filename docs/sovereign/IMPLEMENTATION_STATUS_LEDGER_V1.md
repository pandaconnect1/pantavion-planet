# Pantavion Sovereign Technology Factory — Implementation Status Ledger v1

**Purpose:** founder-visible, read-only status projection for the canonical recovery program and Sovereign Technology Factory workstreams.

## Truth contract

This ledger is descriptive only. It does not authorize runtime activation, agent activation, production mutation, owner admission, external technology authorization, public release, merge, deployment, or force-push.

Lifecycle transitions are adjacent and evidence-gated:

`IDEA -> CODED -> TESTED -> MERGED -> DEPLOYED -> VERIFIED_LIVE`

A missing, stale, contradictory, or non-exact evidence packet forces `HOLD`; status must never be inferred from preview readiness, intent, or a related PR.

## Required record shape

Each workstream record must contain:

- `workstream_id`
- `scope`
- `current_state`
- `exact_head_sha`
- `evidence_refs`
- `last_verified_at`
- `blockers`
- `next_safe_transition`
- `authorizations` (all explicit booleans)
- `truth_boundary` (`repository`, `preview`, `production`, or `live`)

## Current canonical workstreams

| Workstream | Current state | Safe next transition | Minimum evidence gate |
| --- | --- | --- | --- |
| Intent-to-Outcome Fabric | TESTED | MERGED | approved review + exact-head CI + no open blocking thread |
| Ephemeral Agent Swarm | TESTED | MERGED | approved review + exact-head CI + activation remains false |
| Disconnected / edge execution | TESTED | MERGED | approved review + offline/replay evidence + production-write false |
| Intent Firewall | TESTED | MERGED | approved review + deny/allow matrix evidence + owner gate preserved |
| Agent Capability / Budget Control | TESTED | MERGED | approved review + budget-boundary tests + capability scope evidence |
| Owner Control integration | TESTED | MERGED | explicit founder approval packet + revocation/expiry evidence |
| Technology Library | TESTED | MERGED | provenance/evidence completeness + drift checks |
| Visible implementation-status surface | TESTED | MERGED | read-only projection checks + preview/live separation |
| Canonical recovery / classification | TESTED | MERGED | loss-preserving ledger checks + provenance/quarantine evidence |

## Authorization defaults

Unless a separately authorized evidence packet exists, the following remain `false`:

- `runtime_activation`
- `agent_activation`
- `production_mutation`
- `owner_admission`
- `external_technology_authorization`
- `public_release`
- `force_push`

## Verification packet

A transition packet is valid only when it binds the exact repository head, changed paths, workflow run IDs, review outcome, security checks, and applicable boundary assertions. Preview deployment may be recorded as an observation but cannot satisfy `DEPLOYED` or `VERIFIED_LIVE` without production-specific evidence.

## Recovery preservation

Recovered material is append-only at intake. Normalization may add links, classifications, or confidence metadata, but must not delete raw material. Duplicates are linked non-destructively; conflicts are quarantined with provenance and remain reviewable.

## Status surface contract

A UI or API projection built from this ledger must be read-only, show the exact head and evidence timestamp, expose `HOLD` reasons, distinguish preview from production/live, and render unverified states as unverified rather than optimistic.
