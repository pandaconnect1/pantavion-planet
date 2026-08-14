# Global Connect Foundation — Cycle 1

## Scope and truth state

This cycle is a bounded local implementation increment. It adds contracts,
additive PostgreSQL migration files, a registry-only country ledger and read-only
capability endpoints. It does **not** apply a migration, create a provider,
perform an external translation, deploy a route, create an account, or prove
production readiness.

## Architecture fit

| Layer | Cycle-1 contribution | Not claimed |
| --- | --- | --- |
| Experience | Read-only country and readiness APIs for responsive/PWA clients | Device/browser compatibility or native-shell support |
| Knowledge / Graph / AI / Memory / Trust / Protocol | Explicit identity, policy, translation lane, immutable-original and audit contracts | AI/provider routing as a live service |
| Infrastructure / Security / Data / Observability | Additive RLS-deny-by-default PostgreSQL schema, command idempotency and transactional outbox primitives | Applied database, backups, restore, telemetry or deployment |

The intended write path remains: **Command → Validation → Authorization/Policy
Decision → Canonical Write → Outbox/Event Emission**. The migration supplies
unique idempotency keys, command receipts and outbox records; a future
server-side transaction/RPC must join each canonical write to its outbox insert.

The contract preserves boundaries: People is not Social; private Chat is not
Social; Voice is not Interpreter; SOS is not generic Chat. Translation records
refer to artifacts only and do not create Social indexes or public graph data.

## Identity, device and session foundation

- `global_connect_handles` separates a public technical handle from `auth.users`.
  The first secure subset is ASCII-only, so cross-script lookalikes are rejected
  until an approved Unicode-confusable implementation exists.
- Passkey credentials retain public credential data, sign count, backup state,
  transport metadata and RP ID; private keys are not stored.
- Challenges, recovery codes and refresh sessions have hash-only fields. No raw
  challenge, recovery code or refresh/session secret column is created.
- Device records use a capability snapshot and a user-agent hash. Sessions are
  device-linkable, revocable and rotatable through a `rotated_from_session_id`.

These are persistence contracts only. Secure sign-up/sign-in, WebAuthn ceremony,
rate limiting, recovery display-once flow, re-authentication and session runtime
still need separately tested server implementation.

## Translation boundary

`core/global-connect/foundation-contract.ts` creates exactly two inverse BCP 47
lanes, A→B and B→A. A translation job requires an immutable source-artifact
reference/hash, separate output records and an idempotency key. External dispatch
is blocked without an approved policy; private Chat additionally requires
recorded consent, and SOS machine translation is blocked by the foundation
contract.

No engine is connected or tested. The existing public fallback adapter no longer
selects MyMemory implicitly: it requires the explicit
`PANTAVION_TRANSLATE_ALLOW_PUBLIC_FALLBACK=true` runtime opt-in. Legacy
translation routes are not accepted as private-Chat translation channels by this
cycle and must be wired through the new policy/persistence flow before any such
claim can be made.

## Country and device coverage

- The in-code ledger has exactly 249 unique ISO 3166 alpha-2 entries from the
  identified IANA tzdata snapshot (ISO source date reported by that snapshot:
  2023-04-05).
- The additive migration carries the same 249 `registry-only` records with
  `ON CONFLICT DO NOTHING`; it is not applied in this cycle and never upgrades
  a later jurisdiction-pack decision during a re-run.
- Every entry is `registry-only`, has production-sensitive features blocked, and
  has one of Africa, Antarctica, Asia, Europe, North America, Oceania or South
  America for operational coverage grouping.
- Numeric UN M49 region/subregion reconciliation, native-name evidence and every
  jurisdiction pack are intentionally `research-pending`; no local law, age,
  consent, emergency, residency or cultural conclusion is inferred from the
  ledger.
- `GET /api/platform/global-connect/countries?locale=el` sorts localized display
  names alphabetically using `Intl.DisplayNames` and `Intl.Collator`. It does
  not falsely present an empty `nativeNames` array as verified native naming.
- The device table stores capability snapshots, but no current-device matrix,
  screen-reader, RTL, reduced-motion, low-data or browser smoke test is claimed
  by this cycle.

## Migration and rollback procedure

Forward migration: `supabase/migrations/20260815010000_create_global_connect_foundation.sql`.
Manual rollback artifact: `supabase/rollback/20260815010000_create_global_connect_foundation.down.sql`.
The rollback file is outside Supabase's automatic migration directory and must
only be used after verified backup/restore evidence, exact impact review and an
explicit owner decision. It contains no `CASCADE` operations.

Before any database apply, run in an approved non-production environment:

```bash
supabase db push --dry-run
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/migrations/20260815010000_create_global_connect_foundation.sql
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/rollback/20260815010000_create_global_connect_foundation.down.sql
```

Then restore the verified pre-migration backup and prove the restored schema and
data match the expected baseline. None of these commands were run in this cycle.

## Local checks

The executable contract checks are intentionally separate from a database claim:

```bash
node --experimental-strip-types core/global-connect/foundation-contract.test.ts
node --experimental-strip-types core/global-connect/country-registry.test.ts
node scripts/global-connect-foundation-schema-test.cjs
```

The Next build, TypeScript check, audit gates and local endpoint smoke checks are
run and reported by the implementation cycle rather than asserted by this file.
