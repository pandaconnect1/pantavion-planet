# Pantavion Conversation Intake — 2026-09-30

## Source
- Surface: ChatGPT conversation
- Date: 2026-09-30
- Authority: Founder directives
- Purpose: Persist current operational intent so future execution is checked against Pantavion-owned records instead of assistant memory alone.

## Active Founder Directives

### 1. Everything enters Pantavion first
All conversations, commands, excavations, files, screenshots, proposed actions and execution decisions must enter Pantavion first.

Required pipeline:

`SOURCE -> INTAKE -> CLASSIFICATION -> PRIOR DIRECTIVE COMPARISON -> CONFLICT CHECK -> PRE-ACTION GOVERNOR -> EXECUTION -> EVIDENCE -> VERIFY`

The executor must not mutate providers, production, maps, security policy or repository state before the Pantavion Governor has checked the action.

### 2. Founder directive wins on conflict
The latest explicit Founder directive is the highest operational authority.

If an older plan, static gate, agent assumption, historical policy or assistant proposal conflicts with the latest explicit Founder directive:

`OVERRIDE_BY_FOUNDER`

The older conflicting rule must not silently win.

### 3. Water privacy is not operational shutdown
Map A, Map B and Map C must remain private/protected from unauthorized public access.

That requirement means:
- raw private source files remain private;
- unauthorized users do not receive protected network data;
- approved users may view the authorized map;
- founder/admin must retain operational view, edit, patch, review and approval capability;
- security checks must not disable founder/admin operation;
- production must not be called secure/successful when authorized operation is broken.

### 4. Primary operational target
The immediate target remains:
- `pantavion.com` VERIFIED LIVE;
- Map A VERIFIED LIVE;
- Map B VERIFIED LIVE;
- Map C VERIFIED LIVE;
- authorized founder/admin access works;
- authorized editing/review workflow works;
- no DONE/LIVE/SUCCESS label without live evidence.

### 5. Provider neutrality
Pantavion owns canonical identity, directives, lineage, data intent, execution state and verification truth.

External providers are replaceable execution adapters only.

Provider changes must not be used as a reflex when the failing layer has not been proven.

### 6. Excavation and implementation
Use the appropriate tools for each stage, including Python where useful for excavation, classification, deduplication, analysis and implementation support.

Recovered material must be classified and reconciled against canonical current truth before gaining execution authority.

### 7. AI supervision
Pantavion AI/Governor must supervise the executor.

The supervisor must detect:
- conflicts with Founder directives;
- repeated mistakes;
- circular rework;
- skipped work;
- false DONE/LIVE claims;
- provider churn without root cause;
- security rules that disable authorized founder/admin operation.

The supervisor returns one of:
- `GO`
- `CONFLICT`
- `STOP`
- `OVERRIDE_BY_FOUNDER`

## Current confirmed contradiction
A historical Water serving gate was found that encoded blocked production serving and founderApprovedProductionActivation=false as required markers.

This historical blocked state must not be treated as the Founder requirement for current Water operation.

The current Founder requirement is private/protected but operational for authorized users and editable/reviewable by founder/admin.

## Current implementation evidence
- Pantavion universal governor updated with founder-first pre-action rules.
- Deterministic pre-action governor added in `core/governance/pantavion-preaction-governor.ts`.
- Founder-gated API endpoint added at `/api/kernel/governor/preaction`.
- Future covered mutations must consult this control record before execution.

## Completion condition
This intake is not considered complete merely because it exists.

Completion requires future executor actions to actually consult the governor before mutation and to record evidence after execution.
