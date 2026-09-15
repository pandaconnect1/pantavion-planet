# Vercel Environment / Runtime Gap Evidence — 2026-09-15

## Confirmed production impact
A direct Vercel runtime-error check against canonical project `prj_BxhpnjvAs1seyfBU1UYFU8nDykwh` found an active production failure group on route `/api/pantavion/intelligence/cron`.

Observed error:
`Pantavion Supabase admin runtime is missing SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY.`

Observed on production deployment:
`dpl_Dc5bXsU48aZAdZ8sASugaN7rnxSC`

The error was still recurring every five minutes during the latest one-hour check on 2026-09-15. This proves the current missing-secret gap is not merely theoretical: it affects the secure scheduled worker runtime.

## Impact boundary
This does NOT mean the whole Pantavion source or production deployment is lost. The canonical production deployment remains identifiable and build evidence is preserved. The gap is specifically in privileged Supabase admin runtime configuration for the scheduled worker.

## Secret preservation boundary
The currently exposed ChatGPT↔Vercel connector does not provide a direct environment-variable read/export action. Secret values therefore have not been exported through the connector and must not be copied into this public repository.

Vercel officially supports retrieving environment configuration with authorized CLI/API flows such as `vercel env pull` / `vercel pull --environment=production`. Any such export must be stored privately and never committed to a public repository.

## Required recovery action before Vercel cleanup
1. Privately export environment variables for every non-empty Vercel project/environment.
2. Verify especially `SUPABASE_SECRET_KEY` or `SUPABASE_SERVICE_ROLE_KEY` for the canonical `pantavion-planet` production project.
3. Keep the export outside public GitHub.
4. Re-test `/api/pantavion/intelligence/cron` after restoration and require non-500 evidence before considering the runtime configuration recovered.

## Deletion freeze
No Vercel project or environment configuration is approved for deletion until the private environment export is completed and verified.