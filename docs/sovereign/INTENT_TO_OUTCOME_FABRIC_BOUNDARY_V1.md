# Intent-to-Outcome Fabric Boundary v1

Status: CODED

## Purpose

Define a deterministic, fail-closed boundary for converting a user intent into a bounded outcome plan. This document is a contract and evidence boundary; it does not authorize execution, owner admission, production mutation, public release, external technology authorization, or agent activation.

## Canonical lifecycle

`IDEA -> CODED -> TESTED -> MERGED -> DEPLOYED -> VERIFIED_LIVE`

Only one forward transition may be recorded at a time. Every transition requires exact commit SHA, exact workflow/run evidence, timestamp, actor, and the applicable gate result.

## Required intent inputs

- stable `intentId`
- authenticated `userId`
- non-empty intent text and desired outcome
- jurisdiction when relevant
- explicit cost ceiling when supplied
- deadline only when parseable and bounded

Malformed identity, outcome, cost, or deadline inputs fail closed.

## Outcome-plan invariants

- Every step has a stable identifier, title, capability, risk, reversibility flag, approval flag, and dependency list.
- Duplicate, missing, self, or cyclic dependencies are blockers.
- Empty candidate steps are a blocker; no plan is executable.
- Estimated cost must be finite and non-negative.
- The intent cost ceiling, when present, is never exceeded.
- High-risk, irreversible, owner-marked, or over-automatic-budget work requires owner approval.
- A blocked plan has no executable steps.
- A ready plan exposes only dependency-satisfied, incomplete steps.
- Completion is true only when every planned step is completed and the plan is non-empty.

## Safety and authority gates

The fabric must fail closed when any of the following is true:

- owner admission is absent or scope-mismatched;
- production or external side effects are requested without separate authorization;
- a required capability, consent, privacy, legal, security, rollback, or jurisdiction gate is missing;
- the plan is over budget, malformed, stale, tampered, or replay-unsafe;
- the requested action would publish, message externally, change identity/access, or mutate production state without a separately verified gate.

The following remain non-authorizing in this boundary:

- `ownerAdmission: false`
- `productionMutation: false`
- `publicRelease: false`
- `externalTechnologyAuthorization: false`
- `agentActivation: false`
- `forcePush: false`

## Deterministic evidence

For each plan snapshot record:

- canonical serialized intent, candidate steps, policy, blockers, and state;
- exact commit SHA and repository ref;
- deterministic SHA-256 digest of the snapshot;
- evaluation timestamp and evaluator identity;
- workflow/run references for the current lifecycle state;
- explicit next allowed transition or blocker.

Any digest mismatch, contradictory state, missing evidence, or stale evidence forces `HOLD`.

## Disconnected / edge rule

Offline execution may prepare only bounded, reversible, non-authorizing work. Network-required, production-write, publication, external messaging, identity/access, and other irreversible work must stop at owner review or a deterministic blocker.

## Review and test plan

The next lifecycle transition must verify, at minimum:

1. deterministic equivalent intents produce equivalent plans;
2. malformed inputs fail closed;
3. dependency cycles and missing dependencies are detected;
4. cost ceilings and approval escalation are enforced;
5. blocked plans expose no executable work;
6. digest tampering is detected;
7. disconnected mode preserves the authority gates.

## Non-authorizing boundary

This document records constraints and evidence requirements only. It is not an approval, release, deployment, production change, owner admission, technology authorization, or agent activation.
