# Pantavion Sovereign Implementation Status Snapshot Schema v1

Status: CODED

## Purpose

Define the smallest deterministic, founder-visible snapshot that reports implementation truth without authorizing execution. The snapshot is informational and must remain safe to expose in preview, audit, and read-only status surfaces.

## Canonical lifecycle

A component may advance only one state at a time:

`IDEA -> CODED -> TESTED -> MERGED -> DEPLOYED -> VERIFIED_LIVE`

The snapshot must never infer a later state from a preview deployment, a successful build, a provider callback, or a chat assertion.

## Required fields

```json
{
  "schemaVersion": "1.0",
  "componentId": "string",
  "componentName": "string",
  "domain": "intent-to-outcome|ephemeral-agent-swarm|edge-execution|intent-firewall|capability-budget|owner-control|technology-library|status-surface",
  "lifecycle": "IDEA|CODED|TESTED|MERGED|DEPLOYED|VERIFIED_LIVE",
  "exactCommit": "40-hex-sha-or-null",
  "evidence": [
    {
      "kind": "commit|workflow|test|review|deployment|live-check|file|blocker",
      "reference": "string",
      "result": "pass|fail|not-run|blocked",
      "observedAt": "ISO-8601"
    }
  ],
  "authority": {
    "productionMutation": false,
    "publicRelease": false,
    "ownerAdmission": false,
    "externalAuthorization": false,
    "agentActivation": false,
    "forcePush": false
  },
  "gates": {
    "privacy": "pass|fail|not-evaluated",
    "security": "pass|fail|not-evaluated",
    "legal": "pass|fail|not-evaluated",
    "rollback": "pass|fail|not-evaluated"
  },
  "blocker": null,
  "nextAllowedTransition": "CODED|TESTED|MERGED|DEPLOYED|VERIFIED_LIVE|none",
  "deterministicDigest": "sha256:hex"
}
```

## Truth rules

1. `exactCommit` is mandatory for `CODED` and later states.
2. `TESTED` requires exact-commit evidence for all applicable repository checks; partial workflow evidence is not sufficient.
3. `MERGED` requires an observed merge result and merge commit SHA.
4. `DEPLOYED` requires a deployment reference tied to the merged commit; a preview URL alone is insufficient.
5. `VERIFIED_LIVE` requires a reproducible live check against the intended environment, with timestamp and result.
6. Any missing, contradictory, stale, or tampered evidence forces `blocker` and `nextAllowedTransition: "none"`.
7. `authority.*` flags are declarative guardrails, not permissions. A status surface must not mutate them as a side effect of rendering.
8. The status surface is GET-only and must not trigger production writes, owner admission, external authorization, public release, or agent activation.

## Deterministic digest

The digest is computed over canonical JSON with sorted object keys, UTF-8 encoding, and no insignificant whitespace. The `deterministicDigest` field is excluded from the input before hashing. Equivalent snapshots must produce the same digest; any lifecycle, evidence, gate, authority, blocker, or commit change must change the digest.

## Example safe blocked snapshot

```json
{
  "schemaVersion": "1.0",
  "componentId": "sovereign.intent-firewall",
  "componentName": "Intent Firewall",
  "domain": "intent-firewall",
  "lifecycle": "CODED",
  "exactCommit": "0000000000000000000000000000000000000000",
  "evidence": [],
  "authority": {
    "productionMutation": false,
    "publicRelease": false,
    "ownerAdmission": false,
    "externalAuthorization": false,
    "agentActivation": false,
    "forcePush": false
  },
  "gates": {
    "privacy": "not-evaluated",
    "security": "not-evaluated",
    "legal": "not-evaluated",
    "rollback": "not-evaluated"
  },
  "blocker": "No exact-head verification evidence recorded",
  "nextAllowedTransition": "none",
  "deterministicDigest": "sha256:pending"
}
```

## Non-authorizing boundary

This schema documents truth; it does not authorize code execution, production changes, deployment promotion, owner admission, external technology use, public exposure, or autonomous agent activation. Those decisions remain separate gated operations.
