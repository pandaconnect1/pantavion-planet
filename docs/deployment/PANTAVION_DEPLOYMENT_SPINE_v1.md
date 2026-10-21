# Pantavion production deployment — Render

## Source and active service
- Source of truth for app code: `pandaconnect1/pantavion-planet`, branch `main`.
- Public application: `https://pantavion.com`.
- Render production service: `pantavion-planet` (ID `srv-datmlvg93c1s73b80ekg`), Frankfurt.
- GitHub Actions are CI/verification only; they **never deploy to Vercel**.
- Render is the only supported application deployment target.

## Safe release procedure
1. Run GitHub CI, including Water Network Lock, Privileged Session Security, Runtime Safety and production core availability checks.
2. Validate schema migrations against actual Supabase migration history. Migrations must be reviewed and applied separately; no automatic destructive schema deployment.
3. Merge a reviewed pull request to `main`; check Render automatically detected the new commit.
4. If Render did not auto-deploy, use its service-specific deployment action with the exact reviewed commit, without concurrent deployments.
5. Check the new Render deployment reports `live` and the commit SHA matches `main`.
6. Verify `/`, legacy `/auth/signup` redirect, `/auth/register`, `/social`, and fail-closed Water access on the live domain.
7. Roll back the deployment if the real production checks fail.

## Data preservation and remaining dependencies
- The Water source/map integrity lock must not be bypassed. Never change protected geometry or authorization just to make CI green.
- Production signup can only open after the separate verified-live registration gate approves it. Correcting the route does not authorize public account creation.
- Vercel Blob data, old OIDC bridge integrations and third-party inference paths require **independently verified replacements** before Vercel projects or credentials can be deleted.
- Keep verified object inventories, cryptographic checksums, off-provider backups, and restore-test evidence. Do not treat a new file path as proof of a migrated object.
- An own-hosted Pantavion AI must pass inference health and content checks before its private endpoint is enabled; it must not silently fall back to a third-party AI provider.

## Do not confuse hosting with app design
Hosting on Render does not alter the appearance of the Pantavion website. The same site can run on a different infrastructure provider.
