# Pantavion Agent Capability & Budget Control Boundary v1

Status: CODED
Lifecycle: `IDEA -> CODED -> TESTED -> MERGED -> DEPLOYED -> VERIFIED_LIVE`

## Purpose

Define a deterministic, fail-closed control boundary for any future agent execution across the Sovereign Technology Factory. This document is normative for review and test design only. It does not grant authority, activate agents, mutate production data, or authorize external providers.

## Decision inputs

Every execution request must be evaluated against an immutable request envelope containing:

- `requestId`
- `ownerScope`
- `intentDigest`
- `capability`
- `resourceScope`
- `maximumCost`
- `maximumDurationMs`
- `maximumSteps`
- `networkMode` (`disconnected`, `edge`, `online`)
- `dataClass` (`public`, `internal`, `sensitive`, `regulated`)
- `reversibility` (`reversible`, `review_required`, `irreversible`)
- `requestedAt`
- `expiresAt`

Missing, malformed, expired, or contradictory fields result in `deny`.

## Capability rules

1. A capability must be explicitly present in the request envelope and in the granted capability set.
2. Capability grants are scoped to an owner scope, resource scope, time window, and maximum budget.
3. Scope expansion, privilege escalation, identity/access changes, production writes, public release, or agent activation require an explicit owner-controlled gate outside this boundary.
4. A capability cannot delegate itself, mint a new capability, or convert preview evidence into authority.
5. External technology/provider use requires separate authorization and evidence; otherwise return `owner_approval_required`.

## Budget rules

- `estimatedCost <= maximumCost`
- `estimatedSteps <= maximumSteps`
- `estimatedDurationMs <= maximumDurationMs`
- cumulative usage is monotonic and cannot be reset by the agent
- budget exhaustion returns `deny` or `owner_approval_required` according to risk policy; never auto-expand
- retries consume budget and must be bounded
- disconnected/edge mode may execute only locally available, reversible, non-authorizing work

## Decision outcomes

- `allow`: all gates pass; work is bounded, reversible where required, and within granted scope/budget
- `owner_approval_required`: a human-authority gate is required before continuation
- `deny`: request is unsafe, malformed, outside scope, over budget, expired, or conflicts with policy

## Required evidence

A testable decision record must preserve:

- canonical request envelope digest
- capability grant digest
- policy version
- decision outcome
- reason codes
- budget before/after
- network/data/reversibility classification
- exact timestamp
- no authority side effects

## Non-authorizing boundary

This contract is documentation-only. It MUST NOT be interpreted as:

- owner admission or owner approval
- permission to merge or deploy
- permission to mutate production or Supabase data
- permission to publish or release publicly
- authorization to activate agents
- authorization to use an external technology/provider

## Test plan for the next lifecycle transition

The implementation must demonstrate deterministic, fail-closed behavior for at least:

1. bounded capability within scope and budget -> `allow`
2. unknown capability -> `deny`
3. expired capability -> `deny`
4. scope mismatch -> `deny`
5. over-cost or over-step request -> `owner_approval_required` or `deny` per policy
6. retry budget exhaustion -> `deny`
7. disconnected mode with network-required action -> `owner_approval_required`
8. sensitive/regulated data without consent -> `deny`
9. production write or public release -> `owner_approval_required`
10. malformed or contradictory envelope -> `deny`

Until exact workflow evidence exists for the exact commit head, the lifecycle state remains `CODED`.
