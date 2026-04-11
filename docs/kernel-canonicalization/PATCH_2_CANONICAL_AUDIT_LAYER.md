# PATCH 2 — Canonical Audit Layer

Timestamp: 20260411-201017
Branch: kernel-canonicalization-20260411-200129

## What this patch does
- Creates kernel/canonical-audit.ts
- Introduces stable canonical audit structures:
  - CanonicalAuditEntry
  - CanonicalAuditInput
  - createCanonicalAuditEntry
  - ormatCanonicalAuditEntry
  - ormatCanonicalAuditRecent
  - ppendCanonicalAuditEntry

## Safety model
- Additive only
- No live module redirects yet
- No mutation of existing kernel/audit.ts yet

## Why this matters
This gives the kernel a stable audit contract before redirecting:
- kernel/audit.ts
- kernel/store.ts
- kernel/memory.ts
- kernel/runner.ts

## Next intended patch
Patch 3 should align the live kernel/audit.ts implementation to this canonical layer with a controlled redirect.
