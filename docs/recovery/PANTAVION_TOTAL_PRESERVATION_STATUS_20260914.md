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

## VERCEL EVIDENCE PRESERVED
Vercel authorization is restored for team `pantavion` / `pandaconnect`. Discovery returns 15 projects. Project IDs, Git bindings, canonical domains, current production deployments and evidence for Vercel-only/no-Git projects are recorded in `VERCEL_CONNECTED_RECOVERY_20260914.md`.

Deployment histories have been actively traversed for the canonical projects and unique legacy projects. Source-linked Vercel deployments are tied to immutable Git commit SHAs; the underlying public Git source trees have been copied to the central preservation branch. Build-log evidence has also been preserved for key legacy production projects and for inaccessible private-source projects.

## SUPABASE EVIDENCE PRESERVED
Canonical production project: `cxhulvwkagzufbjsdwwu` (`ACTIVE_HEALTHY` when checked). The production migration ledger, extension inventory, branch status, active Edge Function metadata and direct row-count truth are recorded in `SUPABASE_CONNECTED_RECOVERY_20260914.md`.

The complete active Edge Function source `pantavion-map-b-one-time-upload` has been copied into this branch under `docs/recovery/supabase-edge-functions/`.

Supabase's own `supabase_migrations.schema_migrations` table was verified to retain 64 migrations and their SQL statement arrays (259,299 SQL characters total), so the production migration SQL remains recoverable from the canonical database. No database password, service-role key, token, Vault secret or private row payload is copied into this public repository.

## NOT YET SOURCE-COPIED — EXACT PRIVATE GITHUB ACCESS BLOCKER
Vercel proves two additional private source repositories exist:
- `pandaconnect1/nextjs-ai-chatbot` — repository id `994952595`
- `pandaconnect1/pantaai-v1` — repository id `998179796`

The GitHub App installation currently connected to ChatGPT is installation `147879137` on account `pandaconnect1`. GitHub reports `repository_selection: selected`, and the installation's accessible-repository list contains only `pandaconnect1/pantavion-planet`. Direct reads of both private repository ids therefore return 404.

Their Vercel provenance, commits and build evidence are preserved under `docs/recovery/vercel-private-source-evidence/`, but their actual private source contents are not yet copied. To retrieve them, the GitHub App installation must be granted access to those private repositories (or all repositories). Their source must remain private unless the owner explicitly authorizes changing that confidentiality boundary.

## ENVIRONMENT / SECRET BOUNDARY
The connected Vercel tools do not expose an environment-variable export/read operation. Secret values therefore have NOT been copied. This is deliberately not represented as complete backup. Environment-variable names/requirements may be reconstructed from source and workflows, but actual secret values must be recovered through an authorized private secret channel, never committed to this public repository.

## DELETION FREEZE
No Vercel project, Vercel deployment, GitHub repository, Git branch, domain binding, Supabase resource or historical evidence is approved for deletion. Cleanup can start only after source, configuration and evidence recovery is independently verified per project.