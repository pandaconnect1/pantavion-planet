# Pantavion Emergency Rescue — 2026-09-14

## Purpose
Preserve a truthful, non-secret recovery record before any Vercel account/project loss.

## GitHub preservation refs
- main snapshot: `backup/pre-vercel-risk-20260914` -> `16297cdcad36c49aeea4acf087412b6bdc053761`
- 82K item accounting: `backup/82k-ledger-20260914` -> `97e2b70d2b93be510815f5a99129e1af78c5ecb8`
- 82K classification surface: `backup/82k-classification-20260914` -> `cb88cf553528ed695db9231fd4a72994be5b504c`
- PRE-SEED audit: `backup/pr-494-preseed-audit-20260914` -> `8d00bae9ea614e42309065b5ee74110cc93c62cd`
- invention disclosures: `backup/pr-495-invention-disclosures-20260914` -> `b2434d35fcd0d7b8f024c152ed61eaaf8f6fad6b`
- cross-cultural understanding: `backup/pr-497-cross-cultural-20260914` -> `d85a81bf01dacd968a65835b3a4c81b87ddb5271`
- execution revalidation: `backup/pr-498-execution-revalidation-20260914` -> `f0d36a346fd18f6717d787e9920793d86e552e35`
- execution manifest: `backup/pr-499-execution-manifest-20260914` -> `49924524c41cb2dd70d7c7fd159ae5dc61918ba4`
- dry-run scheduler: `backup/pr-500-dry-run-scheduler-20260914` -> `e5dfafa6fc1e5d65b3e6efe1cff80f9695c54e55`

## Canonical production backend
- Supabase project ref: `cxhulvwkagzufbjsdwwu`
- Status observed 2026-09-14: `ACTIVE_HEALTHY`
- Project is referenced in runtime code and production migration ledgers.

## Vercel recovery status
- Connected Vercel team visible: `pantavion` / slug `pandaconnect`.
- Connector currently returns zero visible projects for that team.
- Direct lookup attempts for `pantavion.com`, `pantavion-planet.vercel.app`, and `pantavion-planet-vmxx.vercel.app` returned deployment-not-found through the connected Vercel account.
- Repository still contains deployment workflow references to GitHub Actions secrets `VERCEL_TOKEN`, `VERCEL_ORG_ID`, and `VERCEL_PROJECT_ID`; values are intentionally not recorded here.
- Known historical/current fallback host in source: `pantavion-planet.vercel.app`.

## Truth boundary
This file does **not** claim a complete Vercel export. Environment-variable values, deployment history, aliases, billing state and Vercel project metadata have not been recovered through the currently connected Vercel account. Do not mark Vercel rescue complete until those items are independently recovered and verified.

## Safety
Never commit secret values, service-role keys, tokens or database passwords to this public repository.
