# Global Connect Foundation — bounded cycle

This branch extends the existing Pantavion runtime instead of replacing it.

## Scope

- provider-neutral persistence contracts for authenticators, one-time challenges, recovery codes, devices and named sessions;
- command idempotency and transactional outbox tables;
- two-lane translation channel/job/output persistence that keeps the original immutable;
- ISO 3166 registry ledger with 249 entries, defaulting to `registry-only` when seeded;
- seven-continent registry;
- truthful readiness endpoint at `/api/capabilities/global-connect`;
- deterministic registry verification script.

## Truth boundaries

This increment does **not** claim:
- a connected WebAuthn/passkey ceremony;
- a connected translation engine;
- tested compatibility with every device;
- completed legal/jurisdiction research;
- production deployment or production database migration.

Country-to-continent assignment and native/localized names remain evidence work; the seven-continent registry exists, while country records do not invent mappings that have not been reviewed.

Sensitive tables have RLS enabled and intentionally expose no direct client-write policy. State changes are expected to be owned by governed commands/RPCs following:

`Command → Validation → Authorization/Policy Decision → Canonical Write → Outbox/Event Emission`.
