# Vercel Full Project Content Recovery — 2026-09-15

## Mission
Preserve every recoverable Vercel project artifact/evidence before any billing-related loss. No deletion is authorized.

Team: `pantavion` / `pandaconnect`
Team ID: `team_tGNSGGjcV3VNecscMvaAniGY`

## Projects visible through restored authorization
15 Vercel projects are currently visible:
1. `pantavion-planet-vmxx` — `prj_YsZ25kIBmTByMYfT3WqpfrE9mFPU`
2. `pantavion-planet` — `prj_BxhpnjvAs1seyfBU1UYFU8nDykwh`
3. `pantavion-one` — `prj_Rld6OiU8Iu0TeBDYZ6Y2igDd200e`
4. `pantavion-one-clean-98it` — `prj_jQ4NAbtiHfxC68CazUHwIARlDa1E`
5. `pantavion-one-clean` — `prj_PZD1t2hOc6SaiY5pKithCHILboHF`
6. `pantaai` — `prj_ViFBWhpM0mPurIwxsdvKKmjGrNEs`
7. `pantavion-one-clean-ui` — `prj_e5oghsEalj1r5sIKmXFyRlXGYUdC`
8. `v0-new-project-dr8uqvuxfhx` — `prj_gp2GCnfAmKo4vQ8qTCo1rg8tmsI1`
9. `v0-new-project-cd71xe9esnl` — `prj_UIFExM3Y5z1v42gAoMWgLtLGb2eM`
10. `v0-new-project-0hexy2s8dnt` — `prj_QZvsq6eEjyNwZXVBuQGTqewHqLpJ`
11. `pantaai-template` — `prj_QXmlk9C7ICX24Pi9cITJPJS4fFQ7`
12. `pantaai-v1-nf17` — `prj_EAWqpERO72KiDdYv2pXPhKZdPUGe`
13. `pantaai-v1` — `prj_7grzRBApMytGyui5TzP2JTzxaR6k`
14. `v0-new-project-81xhfwdrlxy` — `prj_6vYEVxzch7eYJQthBUP53aQ87zvO`
15. `nextjs-ai-chatbot` — `prj_qaSInQRFvCwA6V5duEvOLaGkcbbN`

## Deployment-history recovery progress
Complete histories already traversed and zero-page verified past the oldest record:
- `pantavion-one`: 14 deployments recovered; query before oldest returned 0.
- `pantavion-one-clean-98it`: 4 deployments recovered; query before oldest returned 0.
- `pantaai`: 1 deployment recovered; query before oldest returned 0.
- `pantavion-one-clean-ui`: 2 deployments recovered; query before oldest returned 0.
- `pantaai-v1-nf17`: 6 deployments recovered; query before oldest returned 0.
- `pantaai-v1`: 6 deployments recovered; query before oldest returned 0.

Projects verified with zero deployments in their current Vercel history:
- `pantaai-template`
- `nextjs-ai-chatbot`
- `v0-new-project-dr8uqvuxfhx`
- `v0-new-project-cd71xe9esnl`
- `v0-new-project-0hexy2s8dnt`
- `v0-new-project-81xhfwdrlxy`

Histories actively being paginated and not yet declared complete:
- `pantavion-planet`: at least 40 deployment records recovered in the current sweep; older records remain before cursor `1789288815063`.
- `pantavion-planet-vmxx`: at least 20 current deployment records recovered in the current sweep; older records remain before cursor `1789413676421`.
- `pantavion-one-clean`: at least 20 deployment records recovered; older records remain before cursor `1764020152617`.

## What is being preserved for every deployment
Where exposed by Vercel, recovery captures deployment ID, deployment URL, state, target, creator, timestamp, Git commit SHA/ref/repository provenance, branch alias, rollback eligibility, runtime statistics, inspector linkage, and build/runtime evidence.

## Source preservation
All Git-linked projects are tied back to their GitHub source repositories and immutable commit SHAs. Non-destructive preservation branches have been created across accessible repositories. Private repositories remain private.

## Vercel-only boundaries still requiring separate export
The connected Vercel tools do not expose a direct environment-variable export/read action or a full deployment-filesystem/artifact export. Therefore environment-variable secret values, encrypted credentials, and any Vercel-only build output not exposed by project/deployment/log APIs are NOT claimed as preserved yet. Vercel supports authorized `vercel pull --environment=production` / `vercel env pull` or the REST environment-variable endpoint; those exports must be captured through a private authorized channel and must never be committed to the public repository.

## Deletion freeze
No Vercel project, deployment, domain, alias, Git repository, branch, Supabase resource, or historical evidence may be deleted until the full Vercel recovery ledger reaches independently verified completion and the owner separately authorizes cleanup.
