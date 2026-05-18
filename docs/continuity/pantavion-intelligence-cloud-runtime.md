# Pantavion Intelligence Cloud Runtime

This batch adds the first cloud scheduler and tick ledger layer for the Pantavion Sovereign Intelligence Fabric.

## Live Page

- /pantavion/intelligence/cloud

## Live API Routes

- /api/pantavion/intelligence/cron
- /api/pantavion/intelligence/ledger
- /api/pantavion/intelligence/health
- /api/pantavion/intelligence/tick

## Vercel Cron

vercel.json now includes:

- path: /api/pantavion/intelligence/cron
- schedule: 0 * * * *

This means the production deployment can call the Pantavion intelligence cron endpoint hourly.

## Storage Truth

The ledger supports three modes:

1. external_endpoint_durable
   - Real durable production mode.
   - Requires PANTAVION_INTELLIGENCE_LEDGER_ENDPOINT.
   - Optional PANTAVION_INTELLIGENCE_LEDGER_TOKEN.

2. local_development_file
   - Writes to data/pantavion-intelligence-ledger on local machine.
   - Useful for development only.

3. runtime_memory_non_durable
   - Production fallback if no external ledger endpoint is configured.
   - It is explicitly labeled non-durable and must not be claimed as full persistence.

## Required Environment Variables

- CRON_SECRET
- PANTAVION_INTELLIGENCE_LEDGER_ENDPOINT
- PANTAVION_INTELLIGENCE_LEDGER_TOKEN

## Non-Negotiable Rule

Do not call this full autonomous 24/365 intelligence until cron, storage, provider access, queue, monitoring, audit, and production checks are configured and verified.

