# Pantavion Sovereign Verification Evidence Protocol v1

Status: CODED
Scope: documentation-only, fail-closed verification protocol for the Sovereign Technology Factory and canonical recovery/classification program.

## Purpose

This protocol defines the minimum evidence needed to project a workstream from one lifecycle state to the next without conflating repository presence, CI success, preview deployment, production deployment, or live behavior.

## Canonical lifecycle

`IDEA -> CODED -> TESTED -> MERGED -> DEPLOYED -> VERIFIED_LIVE`

Only one adjacent transition may be recorded per evidence event. Missing, stale, contradictory, or non-exact evidence forces `HOLD`.

## Evidence record

Every transition record must include:

- `workstream_id`
- `transition_id`
- `from_state` and `to_state`
- exact `commit_sha`
- repository and base ref
- changed paths and scope classification
- test/build/type/security evidence with run IDs and conclusions
- timestamp and evidence freshness window
- deterministic digest of the normalized record
- blocker, if any
- owner/legal/privacy/security/consent/jurisdiction/rollback gate outcomes
- explicit non-authorizations

## State gates

### CODED -> TESTED

Requires exact-head evidence for the applicable build, type, test, and security checks. Documentation-only changes may use the repository's configured required workflows, but no successful workflow may be attributed to a different commit.

### TESTED -> MERGED

Requires an open reviewable PR, required review/approval policy satisfied, no unresolved blocking review state, exact expected head, and no owner/legal/privacy/security gate violation. This protocol does not authorize merging.

### MERGED -> DEPLOYED

Requires a merged commit identity, deployment record tied to that commit, environment identity, and rollback reference. A preview deployment is not production deployment.

### DEPLOYED -> VERIFIED_LIVE

Requires live probes against the declared environment, probe timestamps, expected/observed outputs, and confirmation that the observed runtime corresponds to the deployed commit. Preview success cannot satisfy this gate.

## Deterministic truth boundaries

- `repository_state` is not `runtime_state`.
- `preview_ready` is not `production_deployed`.
- `production_deployed` is not `verified_live`.
- `recovered_material` is not `implementation_authorization`.
- `successful_checks` do not authorize owner admission, external technology authorization, production mutation, public release, or agent activation.

## Fail-closed rules

1. Do not infer a missing run, approval, deployment, or live probe.
2. Do not reuse evidence after the exact head changes.
3. Do not collapse independent workstreams into one lifecycle claim.
4. Do not overwrite recovered material; link duplicates and quarantine conflicts.
5. In disconnected/edge mode, require packet integrity, expiry, replay protection, capability scope, budget limits, and safe rollback before execution.
6. Intent Firewall and Owner Control remain authoritative gates for consequential actions.

## Visible status projection

The status surface should expose, per workstream:

- current state
- last exact head
- evidence count and freshness
- next allowed transition
- blocker/HOLD reason
- deployment environment, if any
- live verification result, if any
- non-authorizing gate flags

The projection is informational and read-only; it must never mutate production state or activate agents.

## Required negative assertions

Unless separately evidenced and authorized, every status record must retain:

- `merge_authorized: false`
- `production_mutation_authorized: false`
- `owner_admission_authorized: false`
- `external_technology_authorized: false`
- `public_release_authorized: false`
- `agent_activation_authorized: false`

## Next transition test plan

1. Validate schema completeness and enum enforcement.
2. Validate exact-head mismatch rejection.
3. Validate stale/contradictory evidence produces `HOLD`.
4. Validate preview-vs-production and deployed-vs-live separation.
5. Validate deterministic digest stability across normalized input.
6. Validate negative authorization assertions cannot be omitted silently.
