# Pantavion Directive-to-Verified-Execution Rule

Status: FOUNDER DIRECTIVE / IMPLEMENTATION GOVERNANCE
Date: 2026-09-09
Scope: all Pantavion recovery, research, design, code, migration, testing and implementation work

## Purpose

Prevent a founder/user directive from remaining only in chat, prose, an unresolved thread, an unattached artifact, or an unexecuted plan.

This rule does not claim that every directive can be autonomously deployed. It requires every actionable directive to become durable work and to advance as far as current authority, evidence and tooling safely allow.

## Canonical invariant

`DIRECTIVE != ARTIFACT != CODED != EXECUTED != TESTED != DEPLOYED != VERIFIED_LIVE`

No earlier state may be reported as a later state.

## Mandatory lifecycle

`DIRECTIVE_CAPTURED -> INTENT_PRESERVED -> SCOPE_CLASSIFIED -> OWNER_ASSIGNED -> ARTIFACT_BOUND -> EXECUTION_PLAN_BOUND -> IMPLEMENTING -> EXECUTION_EVIDENCE_BOUND -> TESTED -> DEPLOYED_WHEN_AUTHORIZED -> VERIFIED_LIVE`

Alternative terminal/holding states are explicit only:

- `BLOCKED_WITH_EVIDENCE`
- `STRATEGIC_REVIEW_REQUIRED`
- `REJECTED_WITH_REASON`
- `SUPERSEDED_WITH_LINEAGE`

`UNRESOLVED` is not a completion state.

## Rules

1. Preserve the original directive verbatim or by immutable reference before interpretation.
2. Record inferred intent separately from the original expression; inference must never overwrite source intent.
3. Every actionable directive receives a durable artifact/work item and an execution owner or owning kernel.
4. Every artifact must point to an execution plan, implementation target, or an explicit evidence-backed blocker. A document with no next executable edge is incomplete.
5. Every execution plan must define acceptance evidence. A plan cannot become complete merely because steps were proposed.
6. When authority and tools permit a safe repository implementation, proceed to implementation and validation instead of stopping at prose.
7. When an external credential, owner-only action, paid provider, production mutation, destructive operation, legal decision, or other reserved authority is required, stop only at `BLOCKED_WITH_EVIDENCE` or `STRATEGIC_REVIEW_REQUIRED`, with the exact owner action recorded.
8. Blockers must create a recovery edge: diagnose -> proposed bounded resolution -> retry/owner action -> verification. A blocker may not silently terminate the lifecycle.
9. Intermediate artifacts, decisions, evidence, failures and retries remain durable and linked by provenance. Corrections supersede; they do not silently erase history.
10. Thread continuity must carry unresolved state, commitments, artifacts, decisions and execution links into successor threads/workflows.
11. Completion requires evidence from the boundary that actually executed or independently verified the effect. Agent narration is not execution evidence.
12. `VERIFIED_LIVE` requires live-effect evidence where a live effect is part of the directive. Passing code/tests alone is not `VERIFIED_LIVE`.
13. No production deployment, public exposure, billing/provider activation, destructive cleanup, secret mutation, or other reserved action is implied by this rule. Existing authority boundaries remain mandatory.
14. If a directive is ambiguous in a way that changes safety, rights, cost, irreversibility, or strategic scope, preserve it and escalate the ambiguity rather than inventing intent.
15. Periodic reconciliation must identify directives/artifacts with no executable next edge, stale unresolved items, artifacts without execution links, executions without evidence, and false completion states.

## Anti-stall gate

A work item fails the anti-stall gate if any of the following is true:

- actionable directive exists but no durable artifact/work item exists;
- artifact exists but no owner/owning kernel exists;
- artifact exists but has neither executable next edge nor explicit blocker evidence;
- implementation exists but no validation evidence is attached;
- execution is claimed but no execution-boundary evidence exists;
- unresolved state is archived/forgotten without resolution, supersession or explicit rejection;
- a successor thread loses unresolved state, commitments, decisions, artifacts or execution lineage;
- prose/report status is promoted to coded/tested/deployed/verified status without evidence.

## Reconciliation output

Every reconciliation pass should produce counts for:

- directives captured
- artifacts bound
- execution plans bound
- implementing
- blocked with evidence
- strategic review required
- tested
- deployed
- verified live
- stale unresolved
- orphan artifacts
- executions missing evidence
- false completion claims rejected

## Relationship to existing Pantavion mechanisms

This rule binds, rather than replaces, the existing intent-to-outcome fabric, continuity graph, recovery provenance doctrine, execution/runtime systems, Guardian/security policy and truth rule.

The target architecture is therefore:

`ORIGINAL DIRECTIVE -> DURABLE INTENT -> OWNED WORK OBJECT -> EXECUTABLE EDGE -> EVIDENCED EFFECT -> VERIFIED OUTCOME`

with unresolved work continuously visible until it is resolved, explicitly blocked, rejected, or superseded.

## Enforcement requirement

This document is the governance rule. It is not sufficient enforcement by itself. The next implementation step is to encode the lifecycle and anti-stall invariants into machine-checkable runtime/gate code and tests on the safe branch before considering integration.
