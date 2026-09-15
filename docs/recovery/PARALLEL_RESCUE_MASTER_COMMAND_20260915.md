# Pantavion Parallel Rescue — Single Master Command

Use this exact master command in multiple ChatGPT threads. Every thread must execute the same dispatcher logic and claim one rescue lane without overlapping another active thread.

## Repository / branch
- Repository: `pandaconnect1/pantavion-planet`
- Recovery branch: `backup/pre-vercel-risk-20260914`
- Team ID: `team_tGNSGGjcV3VNecscMvaAniGY`

## Mandatory startup sequence
1. Read `docs/recovery/PARALLEL_THREAD_RESCUE_PROTOCOL_20260915.md` and this file from the recovery branch.
2. Read the current claim files under `docs/recovery/live/claims/` if present.
3. Claim the first available lane A→L by creating exactly one lock file under `docs/recovery/live/claims/LANE_<letter>.lock`.
4. The lock file must contain: UTC timestamp, lane, thread purpose, and `status: ACTIVE`; never include secrets.
5. If `create_file` fails because the lock already exists, do not overwrite it; immediately try the next lane.
6. If all A–L locks already exist, become a VERIFY/COORDINATE worker only: reconcile evidence and do not duplicate lane work.
7. Never delete an existing lock during emergency rescue. Mark completion only inside the lane status artifact.

## Lane A — canonical deep rescue
Vercel project: `pantavion-planet` (`prj_BxhpnjvAs1seyfBU1UYFU8nDykwh`). Continue from newest saved cursor, fallback `until=1786553202397`. Exhaust deployment history to explicit terminal zero. Preserve deployment ID, state, target, Git SHA/ref/message, timestamps and provenance. Write only `docs/recovery/live/shards/lane-a-canonical.json` plus lane-A checkpoints.

## Lane B — vmxx deep rescue
Vercel project: `pantavion-planet-vmxx` (`prj_YsZ25kIBmTByMYfT3WqpfrE9mFPU`). Continue from newest saved cursor, fallback `until=1786553202092`. Exhaust deployment history to explicit terminal zero and classify mirror candidates vs unique evidence. Write only `docs/recovery/live/shards/lane-b-vmxx.json` plus lane-B checkpoints.

## Lane C — legacy/PantaAI group A deep history
Projects: `pantavion-one`, `pantavion-one-clean-98it`, `pantavion-one-clean`, `pantaai`, `pantavion-one-clean-ui`, `pantaai-template`. Capture metadata/Git binding and exhaust deployment history to terminal zero. Preserve deployment provenance. Avoid duplicating canonical ingestion owned by F–L. Write only `docs/recovery/live/shards/lane-c-legacy-a.json` plus lane-C checkpoints.

## Lane D — legacy/PantaAI group B + no-Git deep history
Projects: `pantaai-v1-nf17`, `pantaai-v1`, `nextjs-ai-chatbot`, `v0-new-project-dr8uqvuxfhx`, `v0-new-project-cd71xe9esnl`, `v0-new-project-0hexy2s8dnt`, `v0-new-project-81xhfwdrlxy`. Exhaust deployment history and accessible project metadata to terminal zero. Never call no-Git projects empty merely because Git binding/latestDeployment/domain is absent. Avoid duplicating canonical ingestion owned by F–L. Write only `docs/recovery/live/shards/lane-d-legacy-b.json` plus lane-D checkpoints.

## Lane E — secrets continuity and export gaps
Across all 15 projects, build the non-secret continuity map for environment/secret key names, scope, consumer, provider/origin, exact-value exportability, and `REISSUE/ROTATE REQUIRED` where values cannot be reread. Map deployment-file/artifact export prerequisites and Vercel-only gaps. Never write secret values or private source into public GitHub. Write only `docs/recovery/live/shards/lane-e-secrets-artifacts.json` plus lane-E checkpoints.

## Lane F — canonical ingestion: deployment evidence
Consume durable checkpoint/batch files produced by A–D. Normalize every recovered deployment into canonical records with supported fields: `project`, `project_id`, `evidence_type`, `deployment_id`, `created_at`, `state`, `target`, `git_sha`, `git_ref`, `git_message`, `source_surface`, `uniqueness`, `rescue_state`, `live_truth`, `privacy`, `destination`. Produce deduplicated, classified GitHub evidence and founder-feed input. Do not perform deployment pagination. Write only `docs/recovery/live/shards/lane-f-canonical-ingestion.json` and F-owned canonical index/checkpoints.

## Lane G — project/Git/domain provenance classification
Across all 15 projects, reconcile project metadata, Git bindings, branch/ref provenance, aliases/domains where exposed by existing evidence, and no-Git status. Classify unique vs mirror/duplicate evidence. Do not deep-page deployments. Write only `docs/recovery/live/shards/lane-g-project-provenance.json` plus G checkpoints.

## Lane H — build/runtime/error evidence classification
Consume already captured build/runtime/error evidence and any uniquely accessible non-pagination Vercel surfaces that do not overlap active lane work. Classify failures, successful build provenance, runtime failure evidence, and unresolved export gaps. Never equate READY/production with VERIFIED_LIVE. Write only `docs/recovery/live/shards/lane-h-runtime-build.json` plus H checkpoints.

## Lane I — no-Git/v0 preservation classifier
Focus on the four no-Git v0 projects. Reconcile all captured metadata, deployment provenance, build/runtime evidence, uniqueness and Vercel-only preservation gaps. Never label them empty without explicit evidence. Do not duplicate D pagination. Write only `docs/recovery/live/shards/lane-i-nogit-v0.json` plus I checkpoints.

## Lane J — Pantavion module/theme classifier
Map recovered evidence into Pantavion canonical modules/themes (Social, People, Chat, Interpreter/Translation, Contacts, Trust/Verification, Minors/Safety, Ads Center, Business, Dating, Events, Marketplace, AI/Orchestration, Memory/Continuity, Security, Infrastructure, other). Preserve source provenance for every classification and mark ambiguous items for review instead of guessing. Write only `docs/recovery/live/shards/lane-j-module-classification.json` plus J checkpoints.

## Lane K — founder recovery feed integration
Transform canonical classified recovery records into the non-secret founder-only recovery feed consumed by `/admin/pantavion/recovery`. Preserve counts, cursors, source project, rescue state, gaps, terminal status, and evidence pointers. Do not claim UI/runtime verification unless directly proven. Write only `docs/recovery/live/shards/lane-k-founder-feed.json` plus K checkpoints.

## Lane L — completeness/dedup/audit
Cross-check A–K outputs for missing projects, missing checkpoint ranges, duplicate deployment IDs, conflicting classifications, provenance gaps, and terminal-state inconsistencies. Produce an audit matrix and unresolved gap queue. Do not deep-page deployments unless explicitly reassigned after another lane is terminal. Write only `docs/recovery/live/shards/lane-l-audit.json` plus L checkpoints.

## Canonical destination rule
Recovery is not complete merely because evidence was fetched. Every recoverable item must be: `CAPTURED → CLASSIFIED → CANONICALIZED → GITHUB_EVIDENCE_BOUND → PANTAVION_FOUNDER_FEED_BOUND → VERIFIED_OR_EXPLICIT_GAP`. Raw, unclassified evidence is incomplete. Public GitHub receives only public-safe metadata/evidence. Private source and secrets stay private.

## Shared hard rules
- ACTUAL TOOL WORK, not plans or status prose.
- Zero deletions and zero Vercel mutations.
- Never expose secret values.
- Keep private source private.
- Do not write to another lane's shard file.
- Use current saved cursor/status before fallbacks.
- `READY`/`production` is evidence, not `VERIFIED_LIVE`.
- Terminal means explicit zero/no-older-records, not assumption.
- Preserve both success and failure history when useful for provenance.
- When a lane reaches terminal, set its shard status to `TERMINAL_VERIFIED` and redirect only to unique unclaimed evidence/gaps; do not restart completed work.

## Single command users paste into every new thread
`PANTAVION PARALLEL RESCUE MASTER: Read and execute docs/recovery/PARALLEL_RESCUE_MASTER_COMMAND_20260915.md from pandaconnect1/pantavion-planet branch backup/pre-vercel-risk-20260914. Claim the first free lane atomically using its GitHub lock file, then execute that lane with actual Vercel/GitHub tool work until terminal or a real blocker. Zero deletions, no secret values, no duplicate lane work.`
