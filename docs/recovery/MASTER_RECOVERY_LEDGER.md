# Pantavion Master Recovery Ledger

Status: ACTIVE RECOVERY + COMPLETION
Canonical repository: `pandaconnect1/pantavion-planet`
Canonical branch for this recovery wave: `agent/master-recovery-wave-1`

## Non-negotiable truth rules

1. Do not rebuild a capability before checking repository truth, history, backups, snapshots and donor traces.
2. `FOUND` means repository + path + content or commit has been directly verified.
3. Recovery state and live state are separate.
4. No feature is DONE until it is backend-live, UI-connected, tested, deployed and verified-live.
5. All recovered fragments keep provenance and are mapped to a canonical target before merge.
6. Static/foundation UI is not equivalent to a live capability.
7. Production deploy, destructive database work, provider activation, billing changes and unsafe rewrites remain gated.

## State model

Recovery State: `COMPLETE | PARTIAL | SKELETON | IDEA-SPEC | DELETED-HISTORICAL`

Decision: `KEEP | MERGE | EVOLVE | REBUILD | ARCHIVE | INVESTIGATE`

Live State: `SPEC_ONLY | UI_ONLY | BACKEND_PARTIAL | BACKEND_LIVE | CONNECTED | TESTED | DEPLOYED | VERIFIED_LIVE`

## Verified recovery datasets

### Source Inventory
- Path: `data/pantavion-source-inventory/inventory.json`
- Generated: 2026-05-18
- Active GitHub recorded by source: `pandaconnect1/pantavion-planet`
- Filesystem entries: 939
- Files: 439
- API routes: 42
- App pages: 185
- Kernel-related files: 45
- Scripts: 86
- Local backup entries: 108
- Decision: KEEP as historical inventory/evidence, refresh against current main before using counts as present-day truth.

### Founder Vision Ingestion
- Path: `data/runtime-reports/latest-founder-vision-ingestion.json`
- Generated: 2026-05-24
- Scanned files: 696
- Findings: 13,801
- Declared truth: ingest founder vision + repository code to recover unfinished ideas and convert them into runtime priorities.
- Decision: EVOLVE into the Recovery + Completion Engine; deduplicate findings before canonicalization.

### Unfinished Plan Ingestion
- Path: `data/runtime-reports/latest-unfinished-plan-ingestion.json`
- Generated: 2026-05-24
- Scanned files: 702
- Findings: 11,360
- Declared truth: scans repository work for unfinished plans, runtime gaps, provider-pending states, fake-risk markers and untracked work.
- Decision: EVOLVE into the Recovery + Completion Engine; rescan current repository state.

### Recovery Snapshot
- Path: `PANTAVION_RECOVERY_SNAPSHOT_20260425-215458.txt`
- Backup duplicate verified at `.pantavion-backup/paste-junk-20260426131507/PANTAVION_RECOVERY_SNAPSHOT_20260425-215458.txt`
- Recovery State: COMPLETE as historical evidence, not proof of current live state.
- Decision: KEEP + mine for historical paths, deleted modules, commits and unfinished implementation.

## Verified canonical/runtime findings

### Durable Execution
- Path: `core/runtime/durable-execution.ts`
- Recovery State: PARTIAL
- Decision: EVOLVE
- Live State: BACKEND_PARTIAL
- Verified model: execution ID, idempotency key, status, timestamps, attempt count, checkpoints, last error.
- Verified blocker: runtime methods `register`, `registerTask`, `enqueue`, `execute`, `run` currently return `null`; snapshot reports `compatibility_rescue`.
- Canonical target: `core/runtime/durable-execution.ts`
- Related integration: `core/runtime/runtime-execution-supervisor.ts`
- Important mismatch: runtime supervisor looks for durable create functions named `createDurableExecution` / `createExecution`, while the current durable file exposes `createExecutionRecord`.
- Next action: design a persistent execution store + idempotent queue contract; add compatibility exports; add deterministic runtime tests; only then advance toward BACKEND_LIVE.

### Runtime Execution Supervisor
- Path: `core/runtime/runtime-execution-supervisor.ts`
- Recovery State: PARTIAL
- Decision: KEEP + EVOLVE
- Live State: BACKEND_PARTIAL
- Verified behavior: enumerates runtime scenarios, builds provider fallback plans, dispatches provider/control-plane scenarios, evaluates hardening, builds runtime matrix, stores a latest snapshot.
- Blocker: durable runtime evidence currently reports create function missing because expected export names are absent.
- Next action: align runtime contracts and add scenario-level tests.

### Kernel State Store
- Path: `core/storage/kernel-state-store.ts`
- Recovery State: PARTIAL
- Decision: KEEP + EVOLVE
- Live State: BACKEND_PARTIAL
- Verified behavior: in-memory Map-based state store with revisioning, snapshots and export.
- Blocker: process-memory storage is not durable persistence across serverless/runtime restarts.
- Next action: introduce an approved persistent adapter (database/object/event storage as appropriate) while retaining the in-memory adapter for tests/degraded operation.

### Thread / Continuity Memory
- Path: `core/memory/thread-registry.ts`
- Supporting verified paths include `core/memory/continuity-recall-policy.ts`, `core/memory/memory-thread-kernel.ts`, `core/memory/working-memory-store.ts`, `core/memory/predictive-planning-memory-store.ts`.
- Recovery State: PARTIAL
- Decision: EVOLVE
- Live State: BACKEND_PARTIAL
- Canonical direction: Pantavion Continuity Graph: User -> Project -> Domain -> Thread -> Decisions -> Artifacts -> Implementation -> Status -> Result.
- Next action: inspect each store/policy contract, unify identifiers and persistence, then connect to Control Room and project/thread surfaces.

## Current-main evolution that recovery must not overwrite

Current `main` contains active August 2026 work including:
- mobile-first Pantavion home foundation
- STT language-aware routing and resilient retry
- official Vercel AI SDK transcription path
- strict translation language routing through AI Gateway
- mobile MediaRecorder finalization before STT upload

Recovery merges must compare against this newer work first. Historical Voice/Translation code is donor evidence, not automatically canonical replacement code.

## Priority execution lanes

### Recovery lane
Historical commits -> backups -> deleted files -> recovery snapshots -> donor traces -> idea/spec registries -> code fragments -> provenance map -> canonical placement.

### Implementation lane
Identity/Auth -> Profile -> Consent -> Contacts -> Relationship Graph -> Messaging -> Realtime Chat -> per-message Translation -> Voice/Video -> Communities/Social -> Nearby/Match -> Business/Ads/Listings -> Knowledge/Libraries -> SOS/Resilience.

### Core lane
Kernel -> Capability Registry -> Delegation -> Provider Router -> Durable Execution -> Memory/Continuity -> Guardian -> Agents -> Monitoring -> Failover.

## First recovery wave queue

1. Durable Execution persistence + compatibility contract.
2. Continuity/Thread Memory audit and canonical graph plan.
3. Identity/Auth/Profile direct current-state verification.
4. Contacts API boundary and consent/storage verification.
5. Messaging guarded route verification + required schema/runtime.
6. Translation provider/router comparison against August 2026 AI Gateway implementation.
7. Historical Voice donor extraction, preserving only capabilities absent from current implementation.
8. Backups/deleted-files inventory expansion from `.pantavion-backup` and historical commits.
9. Donor registry verification and direct repository accessibility check before any donor claim.
10. Founder/Admin Control Room data model driven by these recovery/live states.

## DONE gate

A capability may only be marked DONE when all are true:
`RECOVERED -> CANONICALIZED -> MERGED -> BACKEND_LIVE -> UI_LIVE -> TESTED -> DEPLOYED -> VERIFIED_LIVE`.
