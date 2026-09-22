# Pantavion Vercel Blob Rescue Blocker — 2026-09-22

## Scope
Preserve Vercel-only Blob/private storage contents into canonical Pantavion recovery storage without deleting or mutating Vercel.

## Verified current state
- Repository: `pandaconnect1/pantavion-planet`
- Recovery branch: `backup/pre-vercel-risk-20260914`
- Deployment-history pagination: TERMINAL for all 15 visible Vercel projects.
- Deployment records preserved: 5,569.
- Canonical `pantavion-planet`: 3,091, `nextCursor = null`.
- Mirror `pantavion-planet-vmxx`: 2,393, `nextCursor = null`.
- Supabase project: `cxhulvwkagzufbjsdwwu`.
- Private recovery bucket: `vercel-recovery-private`, `public=false`, 1.5 GiB per-object limit.
- Supabase recovery bucket currently contains no migrated Vercel Blob objects.

## Attempted safe migration
Recovery-only workflow:
`.github/workflows/pantavion-vercel-blob-rescue.yml`

GitHub Actions run:
`35772871657`

The workflow was designed to:
1. read project environment metadata using Vercel API GET requests only;
2. mask any recovered Blob credential immediately;
3. paginate Blob objects read-only;
4. download objects without Vercel mutation;
5. upload them to the private Supabase recovery bucket using deterministic paths;
6. retain SHA-256 and non-secret provenance;
7. perform ZERO DELETE and ZERO Vercel mutation.

## Actual blocker
The workflow failed closed at the credential gate because GitHub Actions does **not** currently have the repository secret:

`VERCEL_TOKEN`

The following required Supabase credentials were present and masked by GitHub Actions:
- `SUPABASE_ACCESS_TOKEN`
- `SUPABASE_PROJECT_REF`

No secret value was printed or persisted.

## Additional runtime evidence
A direct attempt to reach the existing protected master-DWG server route through the connected Vercel surface returned:

`HTTP 402 DEPLOYMENT_DISABLED`

Therefore the deployed server route cannot currently be used to proxy/download the private Blob content.

## Recovery truth
- Deployment metadata/history: **PRESERVED / TERMINAL**
- Vercel Blob dependency map: **PRESERVED**
- Vercel private Blob object bytes: **NOT YET PRESERVED**
- Exact secret environment-variable values: **NOT WRITTEN / NOT EXPOSED**
- Supabase private destination: **READY**
- Blob migration workflow: **READY BUT BLOCKED ON VERCEL_TOKEN**
- Vercel deletions: **0**
- Vercel destructive mutations: **0**

No Vercel project, deployment, Blob object, environment variable, domain, or other resource may be considered safe for cleanup until the Blob/private-storage gap is closed or explicitly accepted as unrecoverable.
