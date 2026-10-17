# Pantavion Sovereign Technology Factory — Convergence Index v1

Status: `CODED` (documentation-only)

## Purpose

This index is a founder-visible, read-only navigation layer for the current Sovereign Technology Factory workstreams. It does not authorize runtime activation, merge, deployment, production mutation, owner admission, external technology authorization, public release, force-push, or agent activation.

## Canonical lifecycle

`IDEA -> CODED -> TESTED -> MERGED -> DEPLOYED -> VERIFIED_LIVE`

Only adjacent transitions are valid. Missing, stale, contradictory, or non-exact evidence forces `HOLD`.

## Workstream map

| Workstream | Current repository boundary | Next safe transition evidence |
|---|---|---|
| Intent-to-Outcome Fabric | `docs/sovereign/` boundary PRs | exact-head validation of intent envelope, outcome-plan invariants, cost/approval gates |
| Ephemeral Agent Swarm | `docs/sovereign/` boundary PRs | exact-head validation of expiry, replay, fan-out, aggregate-budget, and activation gates |
| Disconnected / edge execution | `docs/sovereign/` boundary PRs | deterministic packet, offline restriction, replay, expiry, and rollback evidence |
| Intent Firewall | `docs/sovereign/` boundary PRs | deterministic allow/review/deny decision evidence and blocked-action tests |
| Agent Capability / Budget Control | `docs/sovereign/` boundary PRs | bounded capability, duration, step, retry, and cumulative budget evidence |
| Owner Control integration | `docs/sovereign/` boundary PRs | exact-scope approval, expiry/revocation, revalidation, and audit evidence |
| Technology Library | `docs/sovereign/` boundary PRs | provenance, readiness, drift invalidation, and disconnected-limit evidence |
| Visible implementation status | `docs/sovereign/` status PRs | deterministic projection with exact commit/run anchors and explicit blockers |
| Canonical recovery / classification | recovery boundary PRs and handoff records | loss-preserving intake, provenance, deduplication, quarantine, and batch evidence |

## Truth boundaries

- Repository state is not preview state.
- Preview deployment is not production deployment.
- Deployment is not live verification.
- A successful workflow is evidence for the tested commit only.
- Documentation is not implementation, and implementation is not authorization.
- Recovery preserves raw material; conflicts are quarantined, never silently overwritten.

## Gate defaults

The following remain closed unless separately evidenced and authorized:

- `owner_admission=false`
- `production_mutation=false`
- `public_release=false`
- `external_technology_authorization=false`
- `agent_activation=false`
- `force_push=false`

## Evidence envelope minimum

Every transition record must bind:

1. exact commit SHA;
2. exact workflow/run identifiers and conclusions;
3. timestamp and executor identity;
4. changed paths and scope;
5. test/security results;
6. blocker or `HOLD` reason;
7. next adjacent transition;
8. explicit negative authorization assertions.

## Current decision

This index is a navigation and verification aid only. It does not advance any existing PR beyond its recorded lifecycle state and does not imply merge, deployment, production readiness, or live verification.
