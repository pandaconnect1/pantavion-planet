# Vercel deep-history preservation checkpoint — 2026-09-15 05:54 Cyprus

Preservation branch: `backup/pre-vercel-risk-20260914`
Team: `pantavion` / `pandaconnect` (`team_tGNSGGjcV3VNecscMvaAniGY`)

## Scope
Continued backwards through the two large Pantavion Planet Vercel deployment histories. Every returned page was read without deleting or mutating Vercel projects/deployments. The returned records preserve deployment id, URL, state, target, Git commit/ref/PR provenance and available runtime metadata.

## pantavion-planet
Project: `prj_BxhpnjvAs1seyfBU1UYFU8nDykwh`
Current continuation point after the latest full 20-record page: `1788113141971`.
History remains open and must continue further back.

Notable production/READY evidence recovered in this deeper range includes:
- `dpl_6hLtmWjdeStxysGLvwNn9nj3kHyy` — production — Git `f23533d21c8be62ca1ddd0c3ecb5fe50c22d6912` — verified Git commit — rollback candidate.
- `dpl_FAgJKG2NtWFFKBhcPSGKwmGEFMPq` — production — Git `bb085e9cba119938d1c691b795d5b32da3864286` — verified Git commit — rollback candidate.
- `dpl_4R8cHEi9PNg4xmQHTmxaNpgmBChU` — production — Git `c710abbf1d24fefddc3f8d2154841a0982c64022` — verified Git commit — rollback candidate.
- `dpl_ArSz5ucyAmpGtodnWRtpVnNFTWCx` — production — Git `71d6092062a87f2a9de3d1b367997ee54acfca72` — verified Git commit — rollback candidate.
- `dpl_9g8KyWwM8kmZhXqS3prBzzQhexhP` — production — Git `7a644b8e30e2f782059959f1570d073744968bc0` — verified Git commit — rollback candidate.

This range also preserves recovery/fenced-executor, scheduler, Supabase migration-history, translation E2E, source-index and 82,413-record recovery provenance.

## pantavion-planet-vmxx
Project: `prj_YsZ25kIBmTByMYfT3WqpfrE9mFPU`
Current continuation point after the latest full 20-record page: `1788113142197`.
History remains open and must continue further back.

Matching production/READY evidence recovered in the vmxx mirror includes:
- `dpl_DQtNri3YTcokkN1Pkm6avgqMaL33` — production — Git `f23533d21c8be62ca1ddd0c3ecb5fe50c22d6912` — rollback candidate.
- `dpl_9TbaBc1w2jkbZfFnyzavezAK9XLr` — production — Git `bb085e9cba119938d1c691b795d5b32da3864286` — rollback candidate.
- `dpl_5uCzuoqv2DKxX3UXTpvDoZKAjKUx` — production — Git `c710abbf1d24fefddc3f8d2154841a0982c64022` — rollback candidate.
- `dpl_A67WURfESZMqvuA7yjDk3T3WKfxH` — production — Git `71d6092062a87f2a9de3d1b367997ee54acfca72` — rollback candidate.
- `dpl_4anetAJxh677c1Hvg7qF2irFgCcP` — production — Git `7a644b8e30e2f782059959f1570d073744968bc0` — rollback candidate.

## Preservation boundary
Deployment pagination is NOT yet exhausted. Do not treat this checkpoint as complete history. No Vercel/GitHub/Supabase cleanup or deletion is authorized. Environment-secret values are not readable through the current Vercel connector and remain a separate private-export gap; no secret values are written to this public repository.
