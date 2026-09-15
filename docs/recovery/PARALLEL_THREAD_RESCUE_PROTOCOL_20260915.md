# Pantavion Parallel Thread Rescue Protocol — 2026-09-15

Purpose: allow multiple ChatGPT threads to recover Vercel evidence in parallel without overwriting each other, duplicating work, leaking secrets, or falsely claiming completion.

## Immutable safety rules

1. ZERO DELETIONS. Never delete or mutate Vercel projects, deployments, domains, Git branches, repositories, historical evidence, or secrets during rescue.
2. Never place decrypted secret values, tokens, passwords, API keys, service-role keys, recovery codes, or private repository source into public GitHub or chat.
3. `READY` or `production` is deployment evidence, not proof of VERIFIED_LIVE runtime behavior.
4. A deployment history is complete only after an explicit terminal result: count 0 / no older deployments.
5. Do not call a no-Git project empty merely because Git binding, latestDeployment, or current domains are absent.
6. If exact secret values or deployment files cannot be exported by the available connector, record the precise authenticated CLI/API action still required. Do not claim preservation.
7. Preserve private repository material only in private locations. The central `pandaconnect1/pantavion-planet` repository is public.

## Shared Vercel scope

Team: `pantavion` / `pandaconnect`
Team ID: `team_tGNSGGjcV3VNecscMvaAniGY`

15 projects:
- pantavion-planet — `prj_BxhpnjvAs1seyfBU1UYFU8nDykwh`
- pantavion-planet-vmxx — `prj_YsZ25kIBmTByMYfT3WqpfrE9mFPU`
- pantavion-one — `prj_Rld6OiU8Iu0TeBDYZ6Y2igDd200e`
- pantavion-one-clean-98it — `prj_jQ4NAbtiHfxC68CazUHwIARlDa1E`
- pantavion-one-clean — `prj_PZD1t2hOc6SaiY5pKithCHILboHF`
- pantaai — `prj_ViFBWhpM0mPurIwxsdvKKmjGrNEs`
- pantavion-one-clean-ui — `prj_e5oghsEalj1r5sIKmXFyRlXGYUdC`
- v0-new-project-dr8uqvuxfhx — `prj_gp2GCnfAmKo4vQ8qTCo1rg8tmsI1`
- v0-new-project-cd71xe9esnl — `prj_UIFExM3Y5z1v42gAoMWgLtLGb2eM`
- v0-new-project-0hexy2s8dnt — `prj_QZvsq6eEjyNwZXVBuQGTqewHqLpJ`
- pantaai-template — `prj_QXmlk9C7ICX24Pi9cITJPJS4fFQ7`
- pantaai-v1-nf17 — `prj_EAWqpERO72KiDdYv2pXPhKZdPUGe`
- pantaai-v1 — `prj_7grzRBApMytGyui5TzP2JTzxaR6k`
- v0-new-project-81xhfwdrlxy — `prj_6vYEVxzch7eYJQthBUP53aQ87zvO`
- nextjs-ai-chatbot — `prj_qaSInQRFvCwA6V5duEvOLaGkcbbN`

## Thread sharding

Each thread owns exactly one shard and writes only its own status/checkpoint path. Never update another thread's shard file.

### THREAD-A — canonical deep history
Own project: pantavion-planet only.
Initial known continuation point when this protocol was written: `until=1786553202397`.
Write only: `docs/recovery/live/shards/thread-a-canonical.json` plus timestamped canonical checkpoints.

### THREAD-B — vmxx deep history
Own project: pantavion-planet-vmxx only.
Initial known continuation point when this protocol was written: `until=1786553202092`.
Write only: `docs/recovery/live/shards/thread-b-vmxx.json` plus timestamped vmxx checkpoints.

### THREAD-C — legacy group 1
Own projects: pantavion-one, pantavion-one-clean-98it, pantavion-one-clean, pantavion-one-clean-ui, pantaai, pantaai-template.
For each project: verify project metadata/Git binding, exhaust deployment history to terminal zero, preserve unique build/runtime/error/toolbar/agent evidence, domains/aliases where available, and Vercel-only gaps.
Write only: `docs/recovery/live/shards/thread-c-legacy-a.json` plus timestamped group checkpoints.

### THREAD-D — legacy group 2 + no-Git
Own projects: pantaai-v1-nf17, pantaai-v1, nextjs-ai-chatbot, all four v0-new-project-* projects.
The no-Git projects are high priority for Vercel-only evidence. Exhaust every accessible Vercel surface before calling them empty.
Write only: `docs/recovery/live/shards/thread-d-legacy-b.json` plus timestamped group checkpoints.

### THREAD-E — secrets, artifacts, classification, aggregation input
Own scope: all 15 projects, but DO NOT duplicate deep deployment pagination performed by A-D.
Build a secret-continuity inventory (names/scopes/consumers/providers/exportability only), deployment-file export map, domain/Git-binding inventory, deduplication map, and classification feed suitable for founder recovery UI.
Write only: `docs/recovery/live/shards/thread-e-secrets-artifacts.json` plus non-secret supporting docs.

## Required record classification

Every recovered item should be classified with as much of the following as the source proves:
- project_name / project_id
- evidence_type: deployment | build | runtime | error | domain | git_binding | toolbar | agent_run | env_name | deployment_file_gap | project_metadata
- deployment_id / created_at / state / target
- git_sha / git_ref / git_message / Git verification status
- source_surface: Vercel project/deployments/build/runtime/etc.
- uniqueness: unique | mirror_candidate | duplicate_confirmed | unknown
- rescue_state: CAPTURED | CHECKPOINTED | TERMINAL_VERIFIED | BLOCKED_AUTH_EXPORT
- live_truth: HISTORICAL_ONLY | RUNTIME_FAILURE_CONFIRMED | VERIFIED_LIVE (only with direct live proof)
- privacy: PUBLIC_SAFE | PRIVATE_ONLY | SECRET_NAME_ONLY
- destination: GitHub public recovery metadata | Pantavion founder UI feed | private secret store | private repo/archive

## GitHub write discipline

Recovery branch: `backup/pre-vercel-risk-20260914`.
Use one file per shard to avoid update conflicts. Before replacing an existing file, fetch it and use its current blob SHA. Prefer timestamped checkpoint files for append-like history. Do not make frequent per-page commits; batch substantial pages.

## Founder UI feed

The founder recovery page is `/admin/pantavion/recovery`.
Each shard should produce structured non-secret status JSON. A coordinator/aggregator may combine shard outputs into `docs/recovery/live/VERCEL_RESCUE_STATUS.json`. Shard threads must not all overwrite the aggregate simultaneously.

## Completion criteria

Rescue is NOT complete until:
- every project has verified project metadata;
- every deployment history has explicit terminal zero/no-older-records;
- Vercel-only build/runtime/error/domain/Git-binding evidence has been preserved where accessible;
- no-Git projects have been exhausted across accessible Vercel evidence surfaces;
- secret continuity is mapped, with exact export vs REISSUE/ROTATE REQUIRED clearly distinguished;
- deployment-file export gaps are explicitly resolved or documented as authenticated-export blockers;
- private material has not been published;
- zero deletions occurred.

If a thread lacks the required connected Vercel/GitHub tool in that chat, it must report the connector/tool blocker and must not invent progress.