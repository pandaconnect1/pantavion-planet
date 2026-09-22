# Vercel Remaining Inventory — 2026-09-22

Repository: `pandaconnect1/pantavion-planet`
Vercel team: `pantavion` / `pandaconnect`
Team ID: `team_tGNSGGjcV3VNecscMvaAniGY`

## Preservation rule

- ZERO deletions.
- ZERO destructive Vercel mutations.
- Preserve project IDs, deployment IDs, URLs, commit provenance, and any Vercel-only evidence before cleanup.
- Secret values are not copied into this document.

## Current Vercel project inventory

| Project | Project ID | Deployments visible in current API page | Latest deployment state | Latest deployment ID | Latest source |
|---|---|---:|---|---|---|
| pantavion-planet | prj_BxhpnjvAs1seyfBU1UYFU8nDykwh | 20 | READY | dpl_J8q3EbdJTiZKLvCqaJ7sF5NFSerp | backup/pre-vercel-risk-20260914 @ d584444cdffdee9cc2917426db69d393ddf09b55 |
| pantavion-planet-vmxx | prj_YsZ25kIBmTByMYfT3WqpfrE9mFPU | 20 | READY | dpl_BN7huVYLcnPLigHbAoBaEmWrN971 | backup/pre-vercel-risk-20260914 @ d584444cdffdee9cc2917426db69d393ddf09b55 |
| pantavion-one | prj_Rld6OiU8Iu0TeBDYZ6Y2igDd200e | 14 | READY / production | dpl_7n748GPUgAahXvmgBDbLJUBLUDYi | main @ 402522eaaa8c30bb8cc0ef05829524ad6f1241d9 |
| pantavion-one-clean-98it | prj_jQ4NAbtiHfxC68CazUHwIARlDa1E | 4 | READY / production | dpl_2jsPyCC3zm3HnjehCS8QLDUTUtw4 | main @ 473429b1f11233181e35a3593b798888c414d4ad |
| pantavion-one-clean | prj_PZD1t2hOc6SaiY5pKithCHILboHF | 20 | READY / production | dpl_D8Kridd58RMaMUw473aLNiDedYjV | main @ 473429b1f11233181e35a3593b798888c414d4ad |
| pantaai | prj_ViFBWhpM0mPurIwxsdvKKmjGrNEs | 1 | ERROR / production | dpl_EwYtxUjRFHh8rqmsTCeCFRs8gvgm | main @ 1410fd14343a421974d504d271d7582216975dff |
| pantavion-one-clean-ui | prj_e5oghsEalj1r5sIKmXFyRlXGYUdC | 2 | READY | dpl_DRLLhUiVL8trrcKDEgyNXDo714rz | vercel/react-server-components-cve-vu-68t1ie @ 833bbbfd1308174be414db9230c7643f83579f62 |
| v0-new-project-dr8uqvuxfhx | prj_gp2GCnfAmKo4vQ8qTCo1rg8tmsI1 | 0 | — | — | — |
| v0-new-project-cd71xe9esnl | prj_UIFExM3Y5z1v42gAoMWgLtLGb2eM | 0 | — | — | — |
| v0-new-project-0hexy2s8dnt | prj_QZvsq6eEjyNwZXVBuQGTqewHqLpJ | 0 | — | — | — |
| pantaai-template | prj_QXmlk9C7ICX24Pi9cITJPJS4fFQ7 | 0 | — | — | — |
| pantaai-v1-nf17 | prj_EAWqpERO72KiDdYv2pXPhKZdPUGe | 6 | ERROR / production | dpl_AMTM9LwAoGcWEMVcuMbJAQRitHH4 | main @ cab42ccc04bafb9f7f0261156243b37cb46e97a3 |
| pantaai-v1 | prj_7grzRBApMytGyui5TzP2JTzxaR6k | 6 | ERROR / production | dpl_328tZJ6sJ2WXCHmRwtvyLSf4tbQV | main @ cab42ccc04bafb9f7f0261156243b37cb46e97a3 |
| v0-new-project-81xhfwdrlxy | prj_6vYEVxzch7eYJQthBUP53aQ87zvO | 0 | — | — | — |
| nextjs-ai-chatbot | prj_qaSInQRFvCwA6V5duEvOLaGkcbbN | 0 | — | — | — |

## Immediate preservation priorities

1. `pantavion-planet` and `pantavion-planet-vmxx`: preserve deployment metadata and any artifacts unique to Vercel.
2. Legacy Pantavion projects: compare Git commit SHAs against GitHub before any cleanup.
3. Vercel Blob / private water approval evidence: still requires a Blob-capable access path or valid token; current Vercel connector does not expose Blob listing or secret environment variable values.
4. Domains and aliases: preserve mapping evidence before detaching anything.
5. No project is authorized for deletion by this inventory.

## Current limitation

The available Vercel connector exposes projects, deployments, build/runtime logs, and observability. It does **not** expose Vercel Blob object listing/download or secret environment-variable values. Those Vercel-only assets must be retrieved through a Blob-capable path before any Vercel shutdown/cleanup can be considered safe.
