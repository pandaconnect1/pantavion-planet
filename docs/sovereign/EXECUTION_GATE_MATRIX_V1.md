# Pantavion Sovereign Execution Gate Matrix v1

Status: CODED

This document is a reviewable, non-authorizing control matrix for the Sovereign Technology Factory. It connects intent validation, capability and budget control, ephemeral execution, disconnected/edge operation, owner control, recovery evidence, and visible status projection without activating runtime behavior.

## 1. Canonical lifecycle

Only adjacent transitions are valid:

`IDEA -> CODED -> TESTED -> MERGED -> DEPLOYED -> VERIFIED_LIVE`

A missing, stale, contradictory, or non-exact evidence anchor forces `HOLD`.

## 2. Execution gates

| Gate | Required evidence | Fail-closed outcome |
| --- | --- | --- |
| Intent identity | immutable intent id, canonical payload digest, requester context | deny |
| Outcome plan | bounded steps, deterministic ordering, rollback marker | deny |
| Intent Firewall | decision digest, policy version, risk classification | deny or owner approval required |
| Capability control | scoped capability, issuer, expiry, revocation status | deny |
| Budget control | cost, duration, retries, fan-out, cumulative budget | deny |
| Owner Control | exact-scope approval, current status, expiry, revocation check | hold or deny |
| Disconnected/edge | packet digest, freshness, replay protection, network limits | deny |
| Recovery provenance | source id, artifact digest, provenance chain, conflict status | hold |
| Verification | exact commit, exact workflow runs, timestamps, environment | hold |

## 3. Non-authorizing boundaries

This matrix does not authorize:

- merge or branch promotion;
- deployment or production mutation;
- Supabase or other persistent-data writes;
- owner admission or identity changes;
- external technology authorization;
- public release;
- agent activation;
- bypass of legal, privacy, consent, security, safety, rollback, or jurisdiction gates.

## 4. Visible status projection

The implementation-status surface should expose, at minimum:

- workstream id and scope;
- current lifecycle state;
- exact head and evidence references;
- blocker or hold reason;
- next allowed adjacent transition;
- deployment/live fields only when independently evidenced;
- explicit negative authorization assertions.

The projection is read-only and must never infer a later lifecycle state from a preview deployment, a passing unrelated workflow, or a stale comment.

## 5. Review rule

Any implementation change must be isolated in a reviewable branch/PR, tested at its exact head, and advanced only after deterministic evidence is recorded. Where one workstream is blocked, independent documentation, validation, and recovery-preservation work may continue without escalating authority.
