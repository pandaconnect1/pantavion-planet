# Pantavion Sovereign Technology Factory — Integration Matrix Boundary v1

## Status

This document is a documentation-only, fail-closed integration boundary. It does not implement runtime execution, authorize technologies, admit an owner, mutate production or Supabase data, activate agents, publish externally, or promote lifecycle state.

Canonical lifecycle remains:

`IDEA -> CODED -> TESTED -> MERGED -> DEPLOYED -> VERIFIED_LIVE`

Only one forward transition may be recorded per evidence event. Missing, stale, contradictory, or unverifiable evidence forces `HOLD`.

## Purpose

Connect the current factory workstreams without collapsing their truth boundaries:

- Intent-to-Outcome Fabric
- Ephemeral Agent Swarm
- Disconnected / Edge Execution
- Intent Firewall
- Agent Capability / Budget Control
- Owner Control integration
- Technology Library
- Visible implementation-status / verification surface
- Canonical recovery / classification

The matrix is an inspection and evidence contract, not an execution authority.

## Integration invariants

1. Every downstream artifact MUST reference an immutable upstream intent or recovered-artifact digest.
2. Every plan MUST carry explicit capability, budget, network, privacy, legal, safety, consent, jurisdiction, rollback, and owner-control gates.
3. A child agent MUST NOT broaden the parent scope, capability set, budget, retention, or authority window.
4. Disconnected execution MUST remain deterministic, bounded, replay-safe, and non-authorizing.
5. The Intent Firewall is the first decision boundary for any proposed action.
6. Technology Library entries are evidence-bearing candidates only; library presence does not authorize use.
7. Owner Control approval is exact-scope, time-bounded, revocable, and non-transferable.
8. The status surface is read-only and reports evidence; it cannot mint evidence or advance lifecycle state.
9. Recovery/classification preserves raw material and records inference separately from source truth.
10. Production mutation, external messaging, identity/access changes, public release, and irreversible actions remain closed until all applicable gates and owner/legal/security approvals are independently evidenced.

## Matrix

| Stage | Required input | Required gate | Produced evidence | Hard stop |
|---|---|---|---|---|
| Recover / classify | Source artifact + locator | provenance, integrity, privacy/legal | raw digest, normalized digest, classification record | missing source or conflicting truth |
| Form intent | Canonical intent envelope | schema, requester, scope, expiry | intent digest and validation result | malformed or ambiguous intent |
| Firewall decision | Intent + context | capability, risk, network, privacy, legal, consent, jurisdiction | deterministic decision digest | deny or owner review required |
| Plan outcome | Approved decision + dependencies | acyclic graph, bounded cost/time/steps | outcome-plan digest | missing dependency or budget breach |
| Select technology | Plan + library entry | provenance, license, security, residency, provider status | technology evidence bundle | stale, mismatched, or external authorization absent |
| Spawn ephemeral agents | Parent plan + grants | bounded fan-out, inherited scope, expiry, revocation | child-envelope digests | scope escalation or missing activation gate |
| Execute connected / edge | Approved task envelope | network mode, replay, rollback, write boundary | execution receipt and replay evidence | non-determinism or unauthorized write |
| Owner review | Exact proposed transition | owner identity, exact scope, expiry, revocation | approval record | mismatch, stale approval, or absent owner gate |
| Publish status | Evidence bundle | read-only projection, digest verification | visible status snapshot | contradictory or unverifiable evidence |
| Lifecycle transition | Current state + exact evidence | one-step transition rule | transition record | attempted skip or unsupported state |

## Cross-workstream dependency order

1. Recovery/classification establishes source truth and provenance.
2. Intent-to-Outcome Fabric creates a bounded plan from a validated intent.
3. Intent Firewall decides whether the plan is review-only, owner-gated, or denied.
4. Capability/Budget Control constrains execution scope and cost.
5. Technology Library supplies evidence-bearing candidate technologies only.
6. Ephemeral Agent Swarm may decompose only within inherited bounds.
7. Disconnected/Edge Execution may run only deterministic, reversible, non-authorizing work.
8. Owner Control is required for exact-scope promotion or privileged action.
9. The status surface projects evidence and blockers without creating authority.

## Required verification record

Each integration change MUST record:

- repository and base branch,
- isolated branch and PR number,
- exact head commit SHA,
- changed paths,
- check names and run IDs,
- test/build/type/security results,
- deployment identifier, only if deployment was explicitly authorized,
- live verification URL and timestamp, only if the artifact reached `VERIFIED_LIVE`,
- blockers and owner decisions,
- explicit statement of what did not occur.

## Non-authorizing boundary

This matrix does not authorize:

- merge or deployment,
- production or Supabase mutation,
- owner admission,
- external technology authorization,
- public release,
- agent activation,
- bypass of privacy, legal, security, consent, rollback, or jurisdiction gates.

## Test plan for next transition

The next lifecycle transition for this document requires exact-head evidence covering:

- matrix schema integrity and deterministic digest behavior,
- missing/contradictory evidence forcing `HOLD`,
- dependency ordering and cycle rejection,
- child-scope non-escalation,
- disconnected execution non-authorizing behavior,
- read-only status projection,
- one-step lifecycle enforcement,
- tamper detection and replay safety.
