# Pantavion Sovereign Technology Factory — Status Projection Schema v1

## Purpose

This document defines the read-only, founder-visible projection contract for the Sovereign Technology Factory and canonical recovery/classification program. It is a projection contract only: it does not activate runtime work, authorize agents, approve production changes, or replace owner/legal/privacy/security gates.

## Truth boundary

The projection MUST distinguish at least these sources:

- `repository`: committed source and review state;
- `ci`: exact-head build/type/test/security evidence;
- `preview`: non-production deployment evidence, when present;
- `production`: production deployment evidence, when separately authorized;
- `live`: post-deployment verification evidence, when separately authorized;
- `recovery`: preserved raw/normalized recovery and classification evidence;
- `owner_control`: explicit scope, expiry, revocation, and decision evidence.

A missing source is `UNKNOWN`, not `PASS`. Conflicting sources are `CONFLICT` and MUST be quarantined rather than normalized away.

## Canonical record shape

Each workstream projection MUST contain:

```json
{
  "workstream": "intent_to_outcome_fabric",
  "lifecycle": "CODED",
  "repository": {
    "repo": "pandaconnect1/pantavion-planet",
    "base_ref": "main",
    "head_ref": "<branch-or-pr-head>",
    "head_sha": "<40-hex-sha>",
    "pr_number": 0
  },
  "evidence": {
    "ci": [],
    "preview": [],
    "production": [],
    "live": [],
    "recovery": [],
    "owner_control": []
  },
  "authorization": {
    "runtime_activation": false,
    "agent_activation": false,
    "production_write": false,
    "external_technology": false,
    "public_release": false
  },
  "blockers": [],
  "next_transition": "TESTED",
  "generated_at": "<RFC3339 timestamp>"
}
```

## Lifecycle rules

Allowed transitions are adjacent only:

`IDEA -> CODED -> TESTED -> MERGED -> DEPLOYED -> VERIFIED_LIVE`

A projection MUST NOT claim a later state unless the required evidence for that exact head and transition is present. A later state cannot be inferred from an earlier run, a different commit, a green default branch, or a successful preview alone.

## Required evidence by transition

### `IDEA -> CODED`

- reviewable branch or PR exists;
- exact head SHA is recorded;
- scope and non-authorizations are explicit.

### `CODED -> TESTED`

- exact-head CI evidence for applicable build/type/test/security checks;
- all required checks completed successfully;
- no unresolved blocker affecting the changed scope.

### `TESTED -> MERGED`

- PR is mergeable;
- required review/approval gates are satisfied;
- no owner/legal/privacy/security gate is bypassed;
- merge commit SHA is recorded after the merge actually occurs.

### `MERGED -> DEPLOYED`

- deployment was explicitly authorized;
- deployment target and artifact/commit identity are recorded;
- deployment result is independently observed.

### `DEPLOYED -> VERIFIED_LIVE`

- post-deployment verification executed against the deployed identity;
- live checks are time-stamped and exact;
- rollback/incident signals are absent or explicitly handled;
- owner and policy gates remain satisfied.

## Fail-closed behavior

The projection MUST show `HOLD` or `UNKNOWN` when any of the following is true:

- exact-head CI evidence is absent or stale;
- evidence belongs to another SHA;
- a required gate is pending, rejected, expired, or revoked;
- runtime/agent/production authorization is not explicit;
- preview evidence is being used to imply live evidence;
- recovery material has unresolved conflicts;
- a source reports contradictory lifecycle states.

## Recovery preservation

Recovery/classification records MUST preserve raw material, normalized derivatives, provenance, deterministic identifiers, duplicate links, and conflict/quarantine references. The status projection may summarize them, but MUST retain stable references to the underlying records and MUST NOT delete or overwrite raw evidence.

## Current workstream identifiers

Use stable identifiers for:

- `intent_to_outcome_fabric`
- `ephemeral_agent_swarm`
- `disconnected_edge_execution`
- `intent_firewall`
- `agent_capability_budget_control`
- `owner_control_integration`
- `technology_library`
- `visible_status_verification_surface`
- `canonical_recovery_classification`

## Non-authorizations

Unless separately recorded with exact scope and expiry, this schema assumes:

- no runtime activation;
- no agent activation;
- no production or Supabase mutation;
- no external technology authorization;
- no public release;
- no force-push;
- no deletion of recovered material.

This document is documentation-only and does not itself advance any lifecycle state.
