# Pantavion Water Access Protected-State Recovery — 2026-09-22

## Why this matters
Historical production evidence from 2026-07-21 proves that Pantavion Water had real protected access state in Vercel Blob before the current Supabase migration.

## Historical verified evidence
PR #91 (merged 2026-07-21T00:37:56Z) reported:
- 44 access-request/device records visible to the protected Water admin
- 16 approved Users

PR #92 (merged 2026-07-21T12:36:11Z) clarified that:
- the 44 figure represented historical request/device attempts;
- it did NOT necessarily mean 44 different people;
- the queue was deduplicated so older duplicate attempts would not reappear as fresh pending requests.

## Exact historical Vercel Blob prefixes
Recovered source at PR #92 head `087d4e1380a56d5c3a65622e4eff38fb8589a2c3` proves these protected paths:

1. `water/private/access-requests/`
2. `water/private/approved-devices/`
3. `water/private/approved-contacts/`
4. `water/private/rejected-requests/`
5. `water/private/revoked-devices/`

These objects contained protected Water access/request/device state. They must not be treated as public data.

## Current canonical Supabase state
Checked 2026-09-22:
- `public.water_access_requests`: 0 rows
- `public.water_approved_devices`: 0 rows
- `public.water_access_audit`: 0 rows
- Supabase Storage contains 0 objects under the historical Water access prefixes.

Therefore the historical Water access state has NOT yet been migrated into the current canonical Supabase project.

## Recovery action prepared
Workflow:
`.github/workflows/pantavion-vercel-blob-rescue.yml`

Commit:
`6b7768a1146c19575c8b47515dbde234d32545cb`

The workflow now performs priority-first read-only recovery for the five Water access prefixes before the general Vercel Blob sweep.

For each Blob store:
1. paginate each protected Water prefix to terminal;
2. download each object read-only;
3. SHA-256 the downloaded bytes;
4. upload into the private Supabase bucket `vercel-recovery-private`;
5. preserve the original pathname inside the deterministic destination path;
6. avoid persisting private source URLs in the GitHub recovery report;
7. then perform the full Blob-store sweep to terminal;
8. skip already captured priority objects idempotently.

## Security/truth boundary
- ZERO DELETE.
- ZERO Vercel mutation.
- Private source URLs are not persisted in recovery evidence.
- Secret values are not written to GitHub.
- Personal Water access records remain private recovery data.
- The historical figures 44 and 16 are evidence from July 2026; they are not a claim about the current number of unique people.
- Current Supabase rows remain zero until real Blob objects are recovered and a provenance-preserving import is executed.

## Current blocker
The recovery workflow still requires the authorized GitHub Actions repository secret `VERCEL_TOKEN`.
Until that credential is present, the protected Vercel Blob objects cannot be enumerated or copied.

## Cleanup prohibition
No Vercel Blob store/project containing these prefixes may be considered safe for cleanup until:
- terminal prefix enumeration is proven;
- every object is checksum-preserved in private Supabase Storage;
- recovered records are reconciled into canonical Water access tables without duplicate identities;
- the founder/admin access path is verified after migration.
