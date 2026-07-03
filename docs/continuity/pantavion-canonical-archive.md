# Pantavion Canonical Archive

This archive is the permanent bridge between the founder vision, old repos, old patches, current repo, Kernel, Agent runtime and GitHub execution.

## Current repo

- Branch: kernel-live-runtime-20260626-230235
- Head: ab37211 Add Pantavion universal entry and legacy source intake
- Git status: M package.json
?? app/api/pantavion/agents/runtime/archive/
?? core/archive/
?? scripts/pantavion-canonical-archive-gate.cjs
?? scripts/pantavion-canonical-archive.cjs

## Evidence status

- universalEntry: true
- legacyIntake: true
- twoYearCanon: false
- orchestratorPlan: false
- agentRuntime: true
- agentTick: true

## Rule

Pantavion must not raw-add old repos blindly. It archives evidence, produces implementation queues, creates GitHub sync plans and lets Kernel/Agent implement in safe order.

## Next

Patch 7 must add Agent Supervisor + Work Order API that reads this archive and creates the next implementation slice automatically.
