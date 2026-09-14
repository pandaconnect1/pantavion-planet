# Vercel Connected Recovery — 2026-09-14/15

## Connection restored
The ChatGPT↔Vercel authorization is active for team `pantavion` (`pandaconnect`, team id `team_tGNSGGjcV3VNecscMvaAniGY`). Vercel project discovery returns 15 projects.

## Project inventory
1. `pantavion-planet-vmxx` — `prj_YsZ25kIBmTByMYfT3WqpfrE9mFPU` — GitHub `pandaconnect1/pantavion-planet`
2. `pantavion-planet` — `prj_BxhpnjvAs1seyfBU1UYFU8nDykwh` — GitHub `pandaconnect1/pantavion-planet`
3. `pantavion-one` — `prj_Rld6OiU8Iu0TeBDYZ6Y2igDd200e` — GitHub `pandaconnect1/pantavion-one`
4. `pantavion-one-clean-98it` — `prj_jQ4NAbtiHfxC68CazUHwIARlDa1E` — GitHub `pandaconnect1/pantavion-one-clean`
5. `pantavion-one-clean` — `prj_PZD1t2hOc6SaiY5pKithCHILboHF` — GitHub `pandaconnect1/pantavion-one-clean`
6. `pantaai` — `prj_ViFBWhpM0mPurIwxsdvKKmjGrNEs` — GitHub `pandaconnect1/nextjs-ai-chatbot`
7. `pantavion-one-clean-ui` — `prj_e5oghsEalj1r5sIKmXFyRlXGYUdC` — GitHub `pandaconnect1/pantavion-one-clean-ui`
8. `v0-new-project-dr8uqvuxfhx` — `prj_gp2GCnfAmKo4vQ8qTCo1rg8tmsI1` — no Git link returned
9. `v0-new-project-cd71xe9esnl` — `prj_UIFExM3Y5z1v42gAoMWgLtLGb2eM` — no Git link returned
10. `v0-new-project-0hexy2s8dnt` — `prj_QZvsq6eEjyNwZXVBuQGTqewHqLpJ` — no Git link returned
11. `pantaai-template` — `prj_QXmlk9C7ICX24Pi9cITJPJS4fFQ7` — GitHub `pandaconnect1/pantaai-template`
12. `pantaai-v1-nf17` — `prj_EAWqpERO72KiDdYv2pXPhKZdPUGe` — GitHub `pandaconnect1/pantaai-v1`
13. `pantaai-v1` — `prj_7grzRBApMytGyui5TzP2JTzxaR6k` — GitHub `pandaconnect1/pantaai-v1`
14. `v0-new-project-81xhfwdrlxy` — `prj_6vYEVxzch7eYJQthBUP53aQ87zvO` — no Git link returned
15. `nextjs-ai-chatbot` — `prj_qaSInQRFvCwA6V5duEvOLaGkcbbN` — GitHub `pandaconnect1/nextjs-ai-chatbot`

## Fresh project metadata snapshot
A direct `get_project` sweep was performed across all 15 projects.

Canonical projects:
- `pantavion-planet`: Next.js, Node 24.x, domains include `www.pantavion.com`, `pantavion.com`, `pantavion-planet.vercel.app`. The latest newly-created deployment observed at the time of this sweep is `dpl_uFnHeehksKAoAn6mk9ZEhu1YMvPN`, URL `pantavion-planet-ex2shfy6x-pandaconnect.vercel.app`, state `ERROR`, target null. This does NOT erase the earlier recovered production deployment `dpl_Dc5bXsU48aZAdZ8sASugaN7rnxSC`, which was `READY`, target `production`, source commit `16297cdcad36c49aeea4acf087412b6bdc053761`.
- `pantavion-planet-vmxx`: Next.js, Node 24.x. Latest newly-created deployment observed is `dpl_H98PyyW77CrLYa7rBHvcK5AbjCHF`, URL `pantavion-planet-vmxx-lagd6sef9-pandaconnect.vercel.app`, state `ERROR`, target null. Earlier recovered production deployment `dpl_FoXoMgG2E7iZsRraJ1JUDx7VWmuu` was `READY`, target `production`, same source commit `16297cdcad36c49aeea4acf087412b6bdc053761`.

Other project heads observed:
- `pantavion-one` — latest `READY` production
- `pantavion-one-clean-98it` — latest `READY` production; domains include `pantavion.com`
- `pantavion-one-clean` — latest `READY` production
- `pantaai` — latest deployment `ERROR`
- `pantavion-one-clean-ui` — latest deployment `READY`
- `pantaai-v1-nf17` — latest deployment `ERROR`
- `pantaai-v1` — latest deployment `ERROR`
- four `v0-new-project-*` projects — no latest deployment and no domains returned
- `pantaai-template` — no latest deployment and no domains returned
- `nextjs-ai-chatbot` — no latest deployment and no domains returned

## Deployment history evidence already recovered
The first deployment-history pages for both `pantavion-planet` and `pantavion-planet-vmxx` were captured previously, with older entries available by cursor. The recovered history includes successful production deployments tied to immutable Git commit SHAs.

## Git source preservation linkage
All currently accessible non-empty GitHub repositories under `pandaconnect1`, including the two private repositories `nextjs-ai-chatbot` and `pantaai-v1`, now have a `backup/full-preservation-20260914` branch. Details are recorded in `GITHUB_FULL_BRANCH_PRESERVATION_20260915.md`.

## Environment / secret boundary
The Vercel connector available in this chat does not expose an environment-variable read/export action. Vercel documentation confirms authorized CLI/API routes exist (`vercel env pull`, `vercel pull --environment=production`, GET project env endpoints), but this connector cannot invoke them directly. Therefore secret values are NOT represented as backed up here. Environment names/requirements are being reconstructed from source and workflow references; values must be recovered through an authorized private channel and must never be committed to this public repository.

## Preservation rule
Do not delete any Vercel project, deployment, branch, GitHub repository, domain binding, Supabase resource, environment binding, or historical evidence until project-by-project recovery evidence has been captured and independently verified.
