# PATCH 4 — Audit Compatibility Bridge

Timestamp: 20260411-201726
Branch: kernel-canonicalization-20260411-200129

## What this patch does
- Extends kernel/audit.ts
- Re-exports only missing canonical audit symbols from kernel/canonical-audit.ts

## Missing type symbols detected
CanonicalAuditEntry, CanonicalAuditInput

## Missing value symbols detected
createCanonicalAuditEntry, formatCanonicalAuditEntry, formatCanonicalAuditRecent, appendCanonicalAuditEntry

## Safety model
- Additive only
- Does not remove existing legacy audit exports
- Does not rename live imports
- Enables gradual live migration toward canonical audit contracts

## Why this matters
This makes kernel/audit.ts a safer bridge surface for future patches in:
- kernel/store.ts
- kernel/memory.ts
- kernel/runner.ts
- kernel API routes
