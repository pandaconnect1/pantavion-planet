# Identity / Auth / Profile — Canonical Reconciliation 2026-08-22

Status: ACTIVE BOUNDED RECOVERY
Canonical repository: `pandaconnect1/pantavion-planet`
Base: `main`
Working branch: `recovery/identity-auth-reconcile-20260822`

## Goal

Recover the unique Identity/Auth/Profile behavior from historical branches without blind-merging stale security or registration code, and preserve exact provenance before implementation.

## Truth rules

- Do not blind-merge security-sensitive branches.
- Do not replace current `main` with an older branch.
- Do not reduce canonical age policy to a single global `minor/adult` switch.
- Preserve historical sources and record whether each behavior is absorbed, diverged, superseded, or still missing.
- Production verification is required before `VERIFIED_LIVE`.

## Current canonical main

At `main` commit `ee5e4d8e42d5ceb32d4a60f0cbd44fc2048a2cc1`, `app/auth/actions.ts` currently provides Supabase email/password signup with username + display name and an 8-character minimum password. `app/auth/register/RegisterClient.tsx` additionally collects country, primary language, an `ageConfirmed` checkbox and a combined terms/privacy acceptance checkbox.

Current limitation: the server action does not currently consume or enforce the UI `ageConfirmed`, country, language, terms or privacy fields. Therefore those UI fields are not currently a complete deterministic server-side registration policy.

## Historical source A — `recovery/identity-registration-current-main`

Comparison against current `main`:

- status: `diverged`
- ahead by: 2 commits
- behind by: 200 commits
- changed paths:
  - `app/auth/actions.ts`
  - `app/auth/register/RegisterClient.tsx`

Recovered behaviors:

- separates first/last name;
- lowercases email;
- requires country;
- requires terms and privacy separately;
- increases password minimum to 12 characters;
- checks a server-side public-registration gate via `pantavion_public_registration_status`;
- stores registration metadata in Supabase auth metadata;
- explicitly fails closed when the registration-status RPC is unavailable;
- explicitly fails closed when public registration is not enabled.

Divergence / rejection as-is:

- the branch uses only `minor` / `adult` as declared age groups;
- this conflicts with the broader canonical age model (`child`, `teen`, `adult`, `verified_adult`) and jurisdiction-aware age-safety requirements;
- therefore this branch must not be merged wholesale.

Relation: `diverged_from` current canonical registration.
Decision: `MERGE_BEHAVIOR_SELECTIVELY`, not branch merge.

## Historical source B — `feature/identity-trust-security-core`

Comparison against current `main`:

- status: `diverged`
- ahead by: 9 commits
- behind by: 250 commits
- unique changed paths include:
  - `app/api/people/find-from-contacts/route.ts`
  - `app/auth/actions.ts`
  - `app/auth/register/RegisterClient.tsx`
  - `core/recovery/canonical-placement-registry.ts`
  - `docs/identity-trust-security-core.md`
  - `supabase/migrations/20260813070000_create_identity_trust_security_core.sql`
  - `supabase/migrations/20260813070100_seed_signup_phone_and_consents.sql`

Recovered security-core value:

- private identity table separated from public profile;
- multiple user emails and phones with primary/login/recovery/discoverability controls;
- identity-security state;
- verification workflow metadata;
- registration-review queue;
- RLS on private identity/security tables;
- canonical age-band vocabulary: `unknown`, `child`, `teen`, `adult`, `verified_adult`;
- protected-account security floor;
- signup trigger seeding profile/private identity/security/email/phone layers;
- explicit note that raw biometric templates are not stored by this foundation.

Security caution:

The historical signup trigger derives age bands using fixed `<13`, `<18`, adult thresholds. These values are historical implementation evidence, not proof of worldwide legal compliance. Canonical policy must remain jurisdiction/version aware and must not present these fixed thresholds as global compliance.

Relation: `diverged_from` current `main`; contains unique unabsorbed security-core value.
Decision: `RECONCILE_FUNCTION_BY_FUNCTION_AND_MIGRATION_BY_MIGRATION`.

## Exact next implementation increment

1. Inventory whether the registration-gate RPC and identity/security tables already exist under different migration names on current `main` or production before adding any migration.
2. Preserve the canonical age-band vocabulary (`child`, `teen`, `adult`, `verified_adult`) and avoid the stale `minor/adult`-only form contract.
3. Add deterministic server-side validation for registration fields only after the canonical schema/RPC dependency is confirmed.
4. Keep private identity data separate from public profile data.
5. Add/verify RLS and negative tests before deployment.
6. Verify signup/profile end-to-end in production before changing state to `VERIFIED_LIVE`.

## Current state

`Identity/Auth/Profile = BACKEND_LIVE / PARTIAL_RECOVERY`

This reconciliation artifact is recovery evidence only. No production schema, auth behavior, DNS, Vercel configuration, Supabase project, or destructive data was changed by this increment.

## Rollback

Delete/revert only this reconciliation document/branch if required. Historical source branches remain untouched.
