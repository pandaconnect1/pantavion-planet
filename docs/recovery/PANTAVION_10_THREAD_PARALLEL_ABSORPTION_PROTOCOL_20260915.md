# PANTAVION 10-THREAD PARALLEL ABSORPTION PROTOCOL — 2026-09-15

Repository: `pandaconnect1/pantavion-planet`
Recovery branch: `backup/pre-vercel-risk-20260914`

## Common rule
Read the current recovery master/status/checkpoints before doing work.

## Mission
Preserve and absorb everything recoverable from Vercel/Pantavion evidence into the Pantavion ecosystem without loss, then classify, canonicalize, route, audit and prepare it for immediate use by Pantavion AI agents and modules.

## Non-negotiable rules
- ZERO deletions.
- ZERO destructive Vercel mutations.
- Never expose passwords, tokens, API keys, secret values or private credentials.
- Never duplicate another thread's scope.
- Every record must retain immutable source provenance.
- Deduplicate deterministically.
- For Vercel deployments use `projectId:deploymentId`.
- For Pantavion corpus records use stable `recordId + source hash/fingerprint`.
- Append/preserve first; process second.
- Raw/source evidence must never be destroyed because classification changes.
- Classification must include where evidence permits: `theme → section → type → module → subsystem → capability → feature → canonicalTarget`.
- Uncertain classification must be marked `REVIEW_REQUIRED`; never guessed as truth.
- Use idempotent writes/upserts.
- Use leases/fencing/atomic claims for shared durable work.
- READY/DEPLOYED is NOT VERIFIED_LIVE.
- UNRESOLVED is NOT completion.
- Do not inflate counts.
- Do not compare the user's ~18,000 Vercel estimate with the 82,413 Pantavion corpus as if they were the same dataset.
- Preserve all existing recovery evidence and checkpoints.
- If another worker already owns a record/shard, skip it rather than duplicate it.
- All work must leave durable GitHub/Supabase/Pantavion evidence.
- Do not wait for another stage when the current record can immediately fan out to independent downstream tasks.

## Target pipeline
`CAPTURE/PRESERVE → VERIFY → DEDUP → CLASSIFY → CANONICALIZE → MODULE/GRAPH ROUTE → GOVERNANCE → AGENT WORK QUEUE → AUDIT → FOUNDER FEED → TEST/VERIFY`

## Thread 0 — Coordinator / runtime truth
Do NOT claim ingestion shards.

Responsibilities:
- coordinator truth
- live runtime verification
- aggregate status
- scheduler/worker health
- checkpoint reconciliation
- detect stalls/overlap
- ensure counts never regress/inflate
- coordinate all 9 worker threads
- verify final convergence

## Thread 1 — Vercel universal intake
Exclusive scope: Vercel source preservation/intake only.
- Find every recoverable deployment/project/artifact/provenance record not already durably preserved.
- Append safely into Pantavion recovery intake/evidence.
- Do NOT perform final classification/canonical module routing.
- Dedup by `projectId:deploymentId`.
- Never re-page terminal histories unless contradictory evidence exists.
- Preserve unknown/no-Git/v0 artifacts as explicit UNKNOWN rather than assuming empty.

Goal: `ALL_RECOVERABLE_VERCEL_EVIDENCE → DURABLE_PANTAVION_INTAKE`

## Thread 2 — Canonical workers F01–F05
Exclusive ownership: deterministic canonical shard buckets 0–4 of 10.
Bucket rule: `hash(stableRecordKey) mod 10 ∈ {0,1,2,3,4}`.
- canonicalization
- idempotent dedup
- provenance binding
- canonical ledger write
- no work on buckets 5–9
- consume preserved G/B/C/D/Vercel/Pantavion intake evidence when eligible

Never count a record canonical until the durable canonical write exists.

## Thread 3 — Canonical workers F06–F10
Exclusive ownership: deterministic canonical shard buckets 5–9 of 10.
Bucket rule: `hash(stableRecordKey) mod 10 ∈ {5,6,7,8,9}`.
Same canonical rules as Thread 2. Threads 2 and 3 MUST NOT overlap.

## Thread 4 — AI semantic classification swarm
Exclusive scope: classification only.
For every eligible preserved/canonical candidate determine:
- theme
- section
- artifact/content type
- module
- subsystem
- capability
- feature
- canonical target
- confidence
- reasons/evidence
- REVIEW_REQUIRED where uncertain

Use existing semantic ledger and classifications when valid. Do not overwrite source evidence. Do not invent missing classifications. Output must immediately become usable by module/graph routing workers.

## Thread 5 — Module / knowledge graph routing
Exclusive scope: bind classified records into the Pantavion ecosystem structure.
Route to:
- shared core
- correct module(s)
- subsystem
- capability
- feature
- requirement
- dependency
- related evidence
- implementation candidate
- governed hold/quarantine where applicable

One source object may have multiple graph relationships but only one canonical identity. Do not duplicate the underlying record.

## Thread 6 — AI agent work queue / execution preparation
Exclusive scope: turn correctly classified/routed material into useful durable work for Pantavion agents.
Work-unit types include:
- research gap
- implementation candidate
- code task
- test task
- security task
- legal/governance review
- UX task
- data/schema task
- module improvement
- integration task
- verification task

Every task must point back to immutable provenance and canonical IDs. Do not deploy or release automatically merely because an AI agent produced a result.

## Thread 7 — Global dedup / reconciliation / completeness audit
Exclusive scope: audit, not ingestion.
Continuously check:
- duplicate stable IDs
- duplicate `projectId:deploymentId`
- semantic mirrors
- missing ranges
- missing provenance
- classification conflicts
- module-routing conflicts
- canonical/source count integrity
- worker/shard gaps
- stalled records
- records lacking downstream work
- terminal vs non-terminal states

Never rewrite another thread's owned shard silently. Open explicit reconciliation findings instead.

## Thread 8 — GitHub evidence / durability
Exclusive scope: GitHub durability/evidence plane.
Maintain:
- manifests
- receipts
- checksums
- evidence pointers
- recovery snapshots
- audit reports
- schema/code changes
- tests
- workflow evidence

GitHub is NOT the high-throughput primary database. Do not commit secrets or huge redundant raw payloads when object/data storage is more appropriate.

## Thread 9 — Supabase durable worker plane
Exclusive scope: Supabase execution/control plane.
Use existing:
- `durable_executions`
- `durable_execution_checkpoints`
- leases/fencing
- scheduled worker runs
- OIDC bridge
- existing 165 recovery partitions

Upgrade runtime flow from inventory-only to multi-stage durable jobs:
- classify
- canonicalize
- route
- audit
- work-unit generation

Requirements:
- idempotent task keys
- atomic claims
- leases/fencing
- retry policy
- dead-letter/explicit failure state
- no double ownership
- RLS/security preserved
- no secret leakage

Do not build a second competing execution system if the existing durable fabric can be extended.

## Common completion rule
A record is not complete merely because it was found.

Required progression where applicable:
`CAPTURED → PRESERVED → SOURCE_VERIFIED → DEDUPED → CLASSIFIED → CANONICALIZED → MODULE_ROUTED → AGENT_WORK_BOUND → AUDITED → GITHUB_EVIDENCE_BOUND → PANTAVION_FOUNDER_FEED_BOUND → TESTED/VERIFIED`

Production functionality separately requires:
`DIRECTIVE_CAPTURED → INTENT_PRESERVED → OWNER_ASSIGNED → ARTIFACT_BOUND → EXECUTION_PLAN → IMPLEMENTING → EXECUTION_EVIDENCE → TESTED → DEPLOYED_WHEN_AUTHORIZED → VERIFIED_LIVE`

Never call an intermediate state complete.

## Final objective
Pantavion must end with:
- nothing recoverable lost
- no duplicate physical records
- provenance preserved
- data correctly classified
- data correctly routed by module/theme/core
- AI agents supplied with real work
- canonical records immediately searchable/useful
- GitHub containing durable engineering/evidence truth
- Supabase running durable parallel execution
- founder feed showing exact real progress
- unresolved items explicit rather than hidden

## Compatibility with existing A–L rescue locks
Existing A–L lock ownership remains authoritative until reconciled. The 10-thread protocol MUST NOT restart or duplicate terminal A–D pagination, must not overwrite another lane's owned shard, and must consume existing durable outputs as source evidence. Thread 0 coordinates the transition; Threads 1–9 only take work that is unowned or explicitly assigned under this protocol.
