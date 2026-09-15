# Pantavion Parallel Rescue — Single Master Command

Use this exact master command in multiple ChatGPT threads. Every thread must execute the same dispatcher logic and claim one rescue lane without overlapping another active thread.

## Repository / branch
- Repository: `pandaconnect1/pantavion-planet`
- Recovery branch: `backup/pre-vercel-risk-20260914`
- Team ID: `team_tGNSGGjcV3VNecscMvaAniGY`

## Mandatory startup sequence
1. Read `docs/recovery/PARALLEL_THREAD_RESCUE_PROTOCOL_20260915.md` and this file from the recovery branch.
2. Read the current claim files under `docs/recovery/live/claims/` if present.
3. Claim the first available lane A→E by creating exactly one lock file:
   - A: `docs/recovery/live/claims/LANE_A.lock`
   - B: `docs/recovery/live/claims/LANE_B.lock`
   - C: `docs/recovery/live/claims/LANE_C.lock`
   - D: `docs/recovery/live/claims/LANE_D.lock`
   - E: `docs/recovery/live/claims/LANE_E.lock`
4. The lock file must contain: UTC timestamp, lane, thread purpose, and `status: ACTIVE`; never include secrets.
5. If `create_file` fails because the lock already exists, do not overwrite it; immediately try the next lane.
6. If all A–E locks already exist, become a VERIFY/COORDINATE worker only: check for stale/terminal lanes, reconcile evidence, and do not duplicate deep pagination.
7. Never delete an existing lock during emergency rescue. Mark completion only inside the lane status artifact.

## Lane A — canonical deep rescue
Vercel project: `pantavion-planet`
Project ID: `prj_BxhpnjvAs1seyfBU1UYFU8nDykwh`
Use the latest verified saved cursor; if none newer exists, fallback `until=1786553202397`.
Exhaust deployment history page-by-page in large batches until explicit terminal `count=0` / no older records. Preserve deployment ID, state, target, Git SHA/ref/message, timestamps, and unique Vercel provenance. Do not equate READY/production with VERIFIED_LIVE.
Write lane status only to `docs/recovery/live/shards/lane-a-canonical.json` plus compact timestamped lane-A checkpoints.

## Lane B — vmxx deep rescue
Vercel project: `pantavion-planet-vmxx`
Project ID: `prj_YsZ25kIBmTByMYfT3WqpfrE9mFPU`
Use latest verified saved cursor; if none newer exists, fallback `until=1786553202092`.
Exhaust deployment history to explicit terminal zero. Preserve the same evidence fields as Lane A and classify mirror candidates vs unique evidence.
Write only `docs/recovery/live/shards/lane-b-vmxx.json` plus lane-B checkpoints.

## Lane C — legacy/PantaAI group A
Projects:
- `pantavion-one` — `prj_Rld6OiU8Iu0TeBDYZ6Y2igDd200e`
- `pantavion-one-clean-98it` — `prj_jQ4NAbtiHfxC68CazUHwIARlDa1E`
- `pantavion-one-clean` — `prj_PZD1t2hOc6SaiY5pKithCHILboHF`
- `pantaai` — `prj_ViFBWhpM0mPurIwxsdvKKmjGrNEs`
- `pantavion-one-clean-ui` — `prj_e5oghsEalj1r5sIKmXFyRlXGYUdC`
- `pantaai-template` — `prj_QXmlk9C7ICX24Pi9cITJPJS4fFQ7`

For every project: capture project metadata/Git binding, exhaust deployment history to terminal zero, preserve deployment provenance, inspect build/runtime/error/toolbar/agent evidence where exposed, record domains/aliases where available, and document Vercel-only artifact/env export gaps.
Write only `docs/recovery/live/shards/lane-c-legacy-a.json` plus lane-C checkpoints.

## Lane D — legacy/PantaAI group B + all no-Git v0 projects
Projects:
- `pantaai-v1-nf17` — `prj_EAWqpERO72KiDdYv2pXPhKZdPUGe`
- `pantaai-v1` — `prj_7grzRBApMytGyui5TzP2JTzxaR6k`
- `nextjs-ai-chatbot` — `prj_qaSInQRFvCwA6V5duEvOLaGkcbbN`
- `v0-new-project-dr8uqvuxfhx` — `prj_gp2GCnfAmKo4vQ8qTCo1rg8tmsI1`
- `v0-new-project-cd71xe9esnl` — `prj_UIFExM3Y5z1v42gAoMWgLtLGb2eM`
- `v0-new-project-0hexy2s8dnt` — `prj_QZvsq6eEjyNwZXVBuQGTqewHqLpJ`
- `v0-new-project-81xhfwdrlxy` — `prj_6vYEVxzch7eYJQthBUP53aQ87zvO`

The four no-Git projects are high priority. Never call them empty merely because Git binding/latestDeployment/domain is absent. Exhaust all accessible evidence surfaces.
Write only `docs/recovery/live/shards/lane-d-legacy-b.json` plus lane-D checkpoints.

## Lane E — secrets continuity, deployment artifacts, classification and founder feed
Do not duplicate deep pagination from A–D.
Across all 15 projects, build the non-secret continuity map for environment/secret key names, project/environment/branch scope, consuming code/workflow, provider/origin, exact-value exportability, and `REISSUE/ROTATE REQUIRED` where old values cannot be reread. Map deployment file/artifact export prerequisites and Vercel-only gaps. Never write secret values or private source into the public repository.
Normalize evidence using fields where supported: `project`, `evidence_type`, `deployment_id`, `state`, `target`, `git_sha`, `git_ref`, `git_message`, `uniqueness`, `rescue_state`, `live_truth`, `privacy`, `destination`.
Write only `docs/recovery/live/shards/lane-e-secrets-artifacts.json` plus lane-E checkpoints.

## Shared hard rules
- ACTUAL TOOL WORK, not plans or status prose.
- Zero deletions and zero Vercel mutations.
- Never expose secret values.
- Keep private source private.
- Do not write to another lane's shard file.
- Batch many pages before checkpoint commits.
- Use current saved cursor/status before fallback cursors.
- `READY`/`production` is evidence, not `VERIFIED_LIVE`.
- Terminal means explicit zero/no-older-records, not assumption.
- Preserve both success and failure history when useful for provenance.
- When a lane reaches terminal, set its shard status to `TERMINAL_VERIFIED` and redirect only to unique unclaimed evidence/gaps; do not restart from the beginning.

## Single command users paste into every new thread
`PANTAVION PARALLEL RESCUE MASTER: Read and execute docs/recovery/PARALLEL_RESCUE_MASTER_COMMAND_20260915.md from pandaconnect1/pantavion-planet branch backup/pre-vercel-risk-20260914. Claim the first free lane atomically using its GitHub lock file, then execute that lane with actual Vercel/GitHub tool work until terminal or a real blocker. Zero deletions, no secret values, no duplicate lane work.`
