# Pantavion Total Preservation Status — 2026-09-14

## PRESERVED IN CENTRAL PANTAVION GITHUB
Central destination: `pandaconnect1/pantavion-planet`, branch `backup/pre-vercel-risk-20260914`.

Current source trees copied from all non-empty PUBLIC repositories discovered under `pandaconnect1`:
- `pantavion-one`
- `pantavion-one-clean`
- `pantavion-one-clean-ui`
- `pantavion-voice`
- `nextjs-boilerplate`
- `pantavion.com`
- `Pantaai`
- `pantavion-app.`

Six additional public repositories were directly verified by GitHub as empty and therefore had no source tree to copy:
- `pantavion-socialhub`
- `pantaai-template`
- `pantavion`
- `pantavion-one-main`
- `pantavion-voice-`
- `SocialConnect`

The canonical `pantavion-planet` repository is itself the destination and is separately pinned by exact backup branches.

## ALL-REPOSITORY FREEZE COMPLETED
GitHub App installation `147879137` now reports repository access = `all`. All 17 accessible repositories were enumerated.

A uniform preservation branch `backup/full-preservation-20260914` was successfully created from `main` in every non-empty repository (11 repositories total), including both private repositories and the canonical `pantavion-planet`. This pins the current source and all reachable commit ancestry independently of future changes to `main`.

Detailed inventory: `docs/recovery/GITHUB_ALL_REPOSITORY_FREEZE_20260914.md`.

## PRIVATE GITHUB SOURCE — ACCESS RESTORED AND HEADS PINNED
Both previously inaccessible private repositories are now directly readable through the authorized GitHub connection:
- `pandaconnect1/nextjs-ai-chatbot` — private — repository id `994952595` — main head observed `1410fd14343a421974d504d271d7582216975dff`
- `pandaconnect1/pantaai-v1` — private — repository id `998179796` — main head observed `cab42ccc04bafb9f7f0261156243b37cb46e97a3`

The earlier exact rescue branches `backup/pantavion-rescue-20260914` remain in both private repositories, and the new uniform `backup/full-preservation-20260914` branches were also created.

The private source trees were directly enumerated and are no longer an access unknown. They are intentionally NOT copied into the public `pantavion-planet` repository because doing that would publish source that is currently private. Their confidentiality boundary is preserved while their Git state is pinned in GitHub.

## VERCEL EVIDENCE PRESERVED
Vercel authorization is restored for team `pantavion` / `pandaconnect`. Discovery returns 15 projects. Project IDs, Git bindings, canonical domains, production deployment evidence and Vercel-only/no-Git checks are recorded in `VERCEL_CONNECTED_RECOVERY_20260914.md`.

A fresh project-by-project metadata read was completed for all 15 Vercel projects. Framework, Node version, current domains and latest deployment metadata (where present) are preserved in `docs/recovery/VERCEL_ALL_PROJECT_METADATA_SNAPSHOT_20260914.md`.

Deployment histories have been actively traversed for the canonical projects and unique legacy projects. Source-linked Vercel deployments are tied to immutable Git commit SHAs; the underlying source repositories are now independently pinned by preservation branches. Build-log evidence has also been preserved for key legacy production projects and private-source projects.

## SUPABASE EVIDENCE PRESERVED
Canonical production project: `cxhulvwkagzufbjsdwwu` (`ACTIVE_HEALTHY` when checked). The production migration ledger, extension inventory, branch status, active Edge Function metadata and direct row-count truth are recorded in `SUPABASE_CONNECTED_RECOVERY_20260914.md`.

The complete active Edge Function source `pantavion-map-b-one-time-upload` has been copied into this branch under `docs/recovery/supabase-edge-functions/`.

Supabase's own `supabase_migrations.schema_migrations` table was verified to retain 64 migrations and their SQL statement arrays (259,299 SQL characters total), so the production migration SQL remains recoverable from the canonical database. No database password, service-role key, token, Vault secret or private row payload is copied into this public repository.

## ENVIRONMENT / SECRET BOUNDARY
The connected Vercel tools do not expose an environment-variable export/read operation. Secret values therefore have NOT been copied. This is deliberately not represented as complete backup.

Known environment-variable requirements are recoverable from source. For example, the frozen private `nextjs-ai-chatbot` `.env.example` records `AUTH_SECRET`, `XAI_API_KEY`, `BLOB_READ_WRITE_TOKEN`, `POSTGRES_URL`, and `REDIS_URL`; the canonical Pantavion `.env.example` records the application/runtime names and `CRON_SECRET`. Actual secret values must be recovered through an authorized private secret channel and must never be committed to this public repository.

## DELETION FREEZE
No Vercel project, Vercel deployment, GitHub repository, Git branch, domain binding, Supabase resource or historical evidence is approved for deletion. Cleanup can start only after source, configuration and evidence recovery is independently verified per project.