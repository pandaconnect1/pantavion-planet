# Pantavion Vercel Residual Evidence + Secret Boundary — 2026-09-22

## Scope
Capture every remaining Vercel-accessible non-destructive evidence surface that is available through the connected account, while preserving a strict boundary around secret values.

## Deployment corpus
- 15 / 15 visible Vercel projects: deployment pagination terminal.
- 5,569 deployment records preserved.
- Phase 2 canonicalization: 5,569 deployments -> 3,138 unique Git source groups.
- Phase 3 canonical founder work order materialized successfully through the Pantavion durable work-order constructor.
- Phase 3 GitHub Actions run: 35776417068.
- Work order: pwo_8e27280d-b970-49ad-9674-abed043f3971.
- Workload plan: 3,138 units, batch size 250, 13 batches.
- Production deployment authority remains false.

## Vercel residual observability captured
### Toolbar comments
- unresolved threads: 0
- resolved threads: 0

### Agent Runs observability
- projects with Agent Runs data: 0

### Runtime errors, canonical pantavion-planet, last 7 days
Three grouped runtime errors were returned:
1. recovery agent bundle cron timeout
   - count: 7
   - route: /api/pantavion/recovery/agent-bundles/cron
   - first observed: 2026-09-16T14:05:21Z
   - last observed: 2026-09-18T00:00:21Z
2. secretless scheduled worker timeout
   - count: 3
   - route: /api/pantavion/intelligence/cron
   - first observed: 2026-09-16T12:45:38Z
   - last observed: 2026-09-17T13:00:38Z
3. recovery agent bundle bridge unavailable
   - count: 1
   - route: /api/pantavion/recovery/agent-bundles/cron
   - observed: 2026-09-18T00:35:21Z

### Runtime errors, pantavion-planet-vmxx, last 7 days
- No runtime errors returned for the selected window.

## Build-log export
The connected Vercel tool catalog advertises build-log retrieval, but live invocation returned a backend tool-unavailable error. Build-log preservation therefore remains an explicit connector-surface blocker rather than an empty result.

## Environment / secret continuity
Existing Lane E evidence preserves a verified lower bound of 128 code/recovery environment-variable names. This is NOT a complete Vercel inventory.

### Secure target prepared
The canonical Supabase project has Vault available.
A forced-RLS metadata catalog exists:
- public.pantavion_secret_recovery_catalog

A service-role-only Vault ingestion function exists:
- public.pantavion_ingest_recovery_secret(...)

The design guarantees:
- secret values are stored only in Supabase Vault;
- GitHub recovery files contain no secret values;
- the public recovery catalog contains metadata only;
- anon/authenticated roles cannot read/write the secret recovery catalog;
- ZERO DELETE and ZERO Vercel mutation.

### Current blocker for actual Vercel secret values
The connected Vercel tool surface does not expose project environment-variable retrieval/decryption.
Vercel REST supports GET /v10/projects/{idOrName}/env?decrypt=true with an authorized Bearer token.
GitHub Actions currently does not have repository secret VERCEL_TOKEN.
Therefore actual secret-value migration from Vercel remains blocked on authorized credential continuity.

No secret value was displayed, written to GitHub, or stored in this evidence file.

## Truth
- Deployment histories: PRESERVED / TERMINAL
- Phase 2 canonicalization: COMPLETE for deployment corpus
- Phase 3 founder work-order materialization: COMPLETE
- Runtime error evidence: CAPTURED where the connector returns it
- Toolbar threads: TERMINAL ZERO
- Agent Runs: TERMINAL ZERO
- Build logs: BLOCKED_CONNECTOR_TOOL_UNAVAILABLE
- Environment variable names: PARTIAL LOWER BOUND 128
- Secret values: SECURE DESTINATION READY, VERCEL EXPORT BLOCKED
- Blob/private object bytes: SECURE DESTINATION READY, VERCEL EXPORT BLOCKED
- Vercel deletions: 0
- Vercel destructive mutations: 0
