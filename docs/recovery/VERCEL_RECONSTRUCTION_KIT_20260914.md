# Pantavion Vercel Reconstruction Kit — 2026-09-14

## Purpose
Preserve all currently recoverable non-secret Vercel evidence in GitHub before any Vercel suspension/deletion risk. This is a reconstruction record, not a claim that Vercel itself has been fully exported.

## Connected Vercel account/team evidence
- Team name: `pantavion`
- Team slug: `pandaconnect`
- Team id: `team_tGNSGGjcV3VNecscMvaAniGY`
- Plan observed via connected Vercel tool: `pro`

## Vercel projects proven by GitHub deployment status history
Two project contexts are proven by Vercel bot statuses attached to repository commits:
- `pantavion-planet`
- `pantavion-planet-vmxx`

## Recovered deployment evidence
### Commit `598688eb7b99ef8f9f3bebfd59baf956673772c3`
- `pantavion-planet` — success — deployment dashboard id `7GJboQKtEhRNS3ku288eSCPNFrsp`
- `pantavion-planet-vmxx` — success — deployment dashboard id `F8kNfJi8W4ETELrtQ7Uu7zLhT3kx`

### Commit `735765fb4c3701a75d4fd78ae7cefa5a814ca442`
- `pantavion-planet` — success — deployment dashboard id `7EjaXdV1Ki5c3qUAHKt1rXkzA7az`
- `pantavion-planet-vmxx` — success — deployment dashboard id `2nnwDw54vT6WzvSZuGhsxhbb1QSM`

### Commit `16297cdcad36c49aeea4acf087412b6bdc053761`
- `pantavion-planet` — success — deployment dashboard id `Dc5bXsU48aZAdZ8sASugaN7rnxSC`
- `pantavion-planet-vmxx` — success — deployment dashboard id `FoXoMgG2E7iZsRraJ1JUDx7VWmuu`

All six entries were emitted by `vercel[bot]` with description `Deployment has completed`.

## Known domain/runtime bindings preserved in source
- Canonical domain target: `https://pantavion.com`
- Known Vercel fallback host in source: `https://pantavion-planet.vercel.app`
- `next.config.mjs` contains host routing for `pantavion-planet.vercel.app` to the canonical origin.

## Production backend binding
- Canonical Supabase project ref: `cxhulvwkagzufbjsdwwu`
- Production Supabase project was observed `ACTIVE_HEALTHY` on 2026-09-14.
- Repository runtime and production migration ledgers bind to the same Supabase project ref.

## Deployment pipeline reconstruction evidence
Repository workflow `.github/workflows/pantavion-deploy.yml` preserves the deployment procedure and names of required secrets:
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`
- `SUPABASE_ACCESS_TOKEN`
- `SUPABASE_PROJECT_REF`
- `SUPABASE_DB_PASSWORD`
- optional AWS deployment variables

The workflow records the actual Vercel CLI sequence:
1. `vercel pull --yes --environment=production`
2. `vercel build --prod`
3. `vercel deploy --prebuilt --prod`

GitHub does not reveal secret values back through repository reads, so secret values are intentionally not copied here.

## Production environment names recoverable from tracked source
`.env.production.example` preserves at least:
- `PANTAVION_WATER_NETWORK_GEOJSON_URL`
- `PANTAVION_WATER_NETWORK_GEOJSON_BEARER_TOKEN`

## Current Vercel connector failure boundary
At rescue time, direct connected Vercel lookups for both `pantavion-planet` and `pantavion-planet-vmxx` return `404 Not Found`, while GitHub status history independently proves successful Vercel deployments for both projects minutes earlier. Therefore this file preserves external evidence needed to identify/reconstruct the Vercel projects if the current Vercel project listing remains inaccessible.

## GitHub rescue refs already created
- `backup/pre-vercel-risk-20260914`
- `backup/82k-ledger-20260914`
- `backup/82k-classification-20260914`
- `backup/pr-494-preseed-audit-20260914`
- `backup/pr-495-invention-disclosures-20260914`
- `backup/pr-497-cross-cultural-20260914`
- `backup/pr-498-execution-revalidation-20260914`
- `backup/pr-499-execution-manifest-20260914`
- `backup/pr-500-dry-run-scheduler-20260914`

## Truth boundary
RECOVERED HERE: project names, team identity, six deployment references, source commits, domain/fallback host evidence, deployment workflow, required environment-variable names, Supabase binding, GitHub rescue refs.

NOT YET RECOVERED FROM VERCEL ITSELF: secret values, full project settings, complete historical deployment list, aliases/domain configuration as held by Vercel, billing state, runtime logs and any Vercel-only artifacts. These must never be claimed recovered until the Vercel API/account exposes them again or another authenticated source supplies them.
