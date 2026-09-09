# Pantavion Prior-Art Pressure Pass 08 — 2026-09-09

Status: RESEARCH ONLY / NOVELTY UNVERIFIED

## Purpose
Attack the current HNTO/Human Need Truth Object candidate against older requirements engineering, goal-driven service composition, case management, context-aware computing and cross-device continuity. This pass deliberately searches pre-LLM prior art because a mechanism is not novel merely because it is now implemented with AI agents.

## Strong prior art found

### 1. Goal-driven dynamic service composition is old prior art
Bonino da Silva Santos et al. (2008/2009) describe a goal-based framework where the user expresses the outcome to be achieved, the platform gathers user context, searches for services, and composes services when no individual service satisfies the goal.

Vukovic et al. (Cambridge/IBM, 2007) describe context-aware applications assembled on demand through goal-oriented inference, with execution monitoring, dynamic recomposition after context changes, and failure recovery.

Khanfir et al. (2017) add self-adaptive goal-driven service composition, changing user environment, execution monitoring, feedback, and transformation of failed composition requests.

CONCLUSION: Pantavion must NOT claim novelty for:
- user goal -> service discovery;
- goal -> dynamic service composition;
- context-aware composition;
- composition fallback/replanning;
- execution monitoring;
- failure recovery.

### 2. Requirements-at-runtime / goal satisfaction is established
Models@run.time / Requirements@Runtime literature predates current agent systems. Contextual Goal Models relate strategies to changing contexts; Runtime Goal Models can check behavioral constraints against execution traces. ACon maintains contextual requirements using runtime feedback.

CONCLUSION: Pantavion must NOT claim novelty for keeping goals/requirements alive at runtime or adapting fulfillment strategies to context.

### 3. Longitudinal human goals and unresolved needs are established in case management
Case-management systems have long represented client/patient goals, updated them over time, tracked duration and resolution, and retained unresolved needs. Modern EHR case-management research explicitly studies patient-defined goals, repeated updates, duration and successful resolution.

CONCLUSION: Pantavion must NOT claim novelty merely for persistent human goals/needs, partial resolution, unresolved need, or longitudinal follow-up.

### 4. Cross-device continuation is established
Modern cross-device APIs expose application context with create/update timestamps, intent URI, app-specific state and continuation on another device.

CONCLUSION: cross-device continuity alone is not novelty.

## What remains under test
The current candidate survives only if defined as a stricter truth-preservation invariant rather than a goal manager or service composer.

### Candidate: Human Need Truth Separation Invariant (HNTSI)
For every governed action chain, preserve distinct, independently inspectable and versioned truth domains:

1. HUMAN_EXPRESSION — what the person actually communicated;
2. SYSTEM_INTERPRETATION — what AI/software inferred the person meant;
3. HUMAN_STATE_EVIDENCE — context actually evidenced versus inferred;
4. AUTHORITY_STATE — consent, age/guardian, relationship authority, entitlement and identity constraints;
5. JURISDICTION_POLICY_STATE — rules applicable to the proposed action;
6. PROPOSED_OUTCOME — what result the system proposes to achieve;
7. CAPABILITY_PLAN — selected/composed/proposed capability and dependencies;
8. AUTHORIZED_ACTION — the exact bounded action that passed deterministic authorization;
9. EXECUTION_RECEIPT — what actually executed, with provider/tool/version/time provenance;
10. OBSERVED_OUTCOME — what evidence shows happened;
11. HUMAN_ACCEPTANCE — whether the human accepts the outcome as satisfying the need;
12. RESIDUAL_NEED — what remains unresolved or changed.

No layer may silently overwrite another. AI interpretation cannot rewrite human expression. Authorization cannot be inferred from successful execution. Execution cannot imply outcome. Outcome cannot imply human satisfaction. A changed provider/model/app/device/language must not erase the chain.

## Why this is narrower
Older goal/service-composition systems strongly overlap with goal -> context -> composition -> monitoring -> recovery. Case management overlaps with persistent needs and resolution. Cross-device APIs overlap with continuation. The remaining research question is therefore not whether Pantavion can track goals or compose services, but whether the explicit separation and zero-loss transition of all twelve truth domains across heterogeneous capabilities is materially distinct and technically useful.

## PRE-SEED-safe framing today
Do not say world-first, unique, patented or patentable.

Defensible wording:
"Pantavion investigates an evidence-preserving human-need execution architecture that prevents a user's original expression, machine interpretation, authorization state, executed action and observed outcome from collapsing into one mutable AI state. The prototype will test whether this separation improves auditability, continuity and safe adaptation across heterogeneous digital services."

## Next attack
Search standards, provenance/event-sourcing, workflow/case-management audit trails, consent receipts, policy decision records, agent execution receipts, event sourcing and safety-case literature for an existing equivalent of the complete separation invariant. If an equivalent exists, demote HNTSI and move to the next recovered Pantavion mechanism rather than manufacturing novelty.
