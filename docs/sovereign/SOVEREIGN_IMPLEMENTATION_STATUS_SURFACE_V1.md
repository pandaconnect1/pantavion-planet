# Pantavion Sovereign Implementation Status Surface v1

## Purpose

This document defines the canonical, visible, read-only status surface for the Pantavion Sovereign Technology Factory and canonical recovery program. It exposes evidence-backed lifecycle state without authorizing runtime activation, merge, deployment, owner admission, production mutation, external technology authorization, public release, or agent activation.

## Canonical lifecycle

Every workstream and recovery batch MUST use adjacent-only transitions:

`IDEA -> CODED -> TESTED -> MERGED -> DEPLOYED -> VERIFIED_LIVE`

A status surface MUST NOT infer or skip a state. Missing, stale, contradictory, unverifiable, or non-exact evidence yields `HOLD` and preserves the last proven state.

## Workstream registry

The registry SHOULD include at least:

- Intent-to-Outcome Fabric
- Ephemeral Agent Swarm
- Disconnected / Edge Execution
- Intent Firewall
- Agent Capability / Budget Control
- Owner Control Integration
- Technology Library
- Canonical Recovery / Classification
- Visible Status / Verification Surface

Each entry MUST contain:

- `workstream_id`
- `scope_summary`
- `lifecycle_state`
- `exact_head_sha` when repository-backed
- `evidence_refs`
- `evidence_digest`
- `last_verified_at`
- `dependencies`
- `blockers`
- `owner_gate_state`
- `legal_privacy_security_state`
- `deployment_target` and `deployment_kind`
- `truth_boundary_notes`

## Evidence rules

Evidence is valid only when it is:

1. tied to the exact reviewed commit or immutable artifact digest;
2. attributable to a concrete check, workflow, preview, deployment, or live probe;
3. timestamped and retained;
4. consistent with the declared scope and environment;
5. still fresh under the applicable evidence TTL.

Preview readiness MUST be displayed separately from production deployment. A successful CI run MUST NOT be rendered as `MERGED`, `DEPLOYED`, or `VERIFIED_LIVE`.

## Status projection rules

The visible surface MUST be read-only and deterministic:

- no hidden optimistic state;
- no conversion of intent, chat, or documentation into implementation evidence;
- no destructive rewriting of recovery records;
- no deletion of superseded evidence; link and quarantine instead;
- explicit `UNKNOWN`, `HOLD`, and `BLOCKED` outcomes where proof is incomplete;
- exact blockers are shown with the missing evidence or required owner/legal/privacy/security action.

## Gate preservation

The status surface MUST preserve and expose, rather than bypass:

- owner control and exact-scope approval;
- identity and access controls;
- privacy, consent, legal, jurisdiction, and data-residency gates;
- security, abuse, safety, rollback, and incident gates;
- disconnected-mode revalidation and replay protection;
- capability, budget, expiry, and non-escalation constraints.

A green status indicator is evidence of the named check only; it is not authorization for a broader action.

## Minimum verification view

The implementation-status view SHOULD render, for each entry:

| Field | Meaning |
|---|---|
| Workstream | Canonical identifier |
| Lifecycle | Last proven adjacent lifecycle state |
| Exact head / digest | Immutable evidence anchor |
| Checks | Build, type, test, security, policy, or live probes |
| Environment | Repository, preview, staging, production, or edge |
| Last verified | Timestamp of latest accepted evidence |
| Blocker | Exact unresolved condition |
| Next allowed state | Only the immediate next transition |

## Fail-closed behavior

If the status projection cannot prove the exact state, it MUST show `HOLD` or `UNKNOWN` and MUST NOT promote the entry. If a downstream dependency regresses, dependent entries MUST be prevented from claiming a higher state than the dependency permits.

## Non-authorizing boundary

This surface is an observability and evidence projection only. It does not itself:

- merge code;
- deploy artifacts;
- mutate production or Supabase data;
- approve owners, technologies, agents, or external actions;
- activate a swarm or edge executor;
- publish a public capability claim.

## Verification plan for the next transition

To move this boundary from `CODED` to `TESTED`, retain exact-head evidence for:

1. markdown/schema validation;
2. deterministic lifecycle and fail-closed rule checks;
3. repository CI/build/type/test/security workflows;
4. visible-surface rendering or projection checks where implemented;
5. proof that preview, merged, deployed, and live states remain distinct;
6. evidence-retention and blocker-display checks;
7. confirmation that no production or owner-control side effects occur.
