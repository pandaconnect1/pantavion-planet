# Pantavion Sovereign Implementation Status Surface Contract v1

Status: CODED
Authority: informational only; never an authorization mechanism

## Purpose

Expose a deterministic, reviewable implementation-status surface for the Sovereign Technology Factory without presenting planned, coded, tested, deployed, or live states as interchangeable.

## Required lifecycle

Every implementation slice MUST progress only through:

`IDEA -> CODED -> TESTED -> MERGED -> DEPLOYED -> VERIFIED_LIVE`

A surface MUST show the current state, exact commit, evidence references, and the next permitted transition. It MUST NOT infer a later state from an earlier state.

## Required record

Each visible record contains:

- `id`: stable implementation-slice identifier
- `title`: human-readable scope
- `domain`: one of Intent-to-Outcome, Ephemeral Agent Swarm, Disconnected/Edge, Intent Firewall, Capability/Budget, Owner Control, Technology Library, or Recovery
- `state`: one lifecycle value only
- `exactHead`: immutable commit SHA for the evidence being shown
- `evidence`: exact workflow, test, review, deployment, or live-verification references
- `blockers`: explicit unresolved blockers; empty only when none are known
- `nextAllowedTransition`: deterministic next state or `NONE`
- `authority`: informational, review-required, or founder-controlled
- `updatedAt`: ISO-8601 timestamp

## Truth boundaries

- `TESTED` requires successful checks on the exact displayed head.
- `MERGED` requires a merged PR and merge commit evidence.
- `DEPLOYED` requires deployment evidence for the displayed commit or merge result.
- `VERIFIED_LIVE` requires live verification evidence for the displayed deployment.
- A preview deployment is not production deployment.
- A ready deployment is not live verification.
- Owner approval, privacy review, security review, and legal review remain separate gates.
- The surface is read-only with respect to production state and cannot activate agents, admit owners, authorize technologies, or mutate production data.

## Minimum safe display

The surface SHOULD expose:

1. current state and exact head,
2. successful and failed checks,
3. unresolved blockers,
4. owner/privacy/security/legal gate status,
5. last verified timestamp,
6. provenance links,
7. next allowed transition.

If any required evidence is missing or stale, the record MUST remain at the last proven state and display the missing evidence as a blocker.
