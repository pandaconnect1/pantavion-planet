# PATCH 3 — Types Compatibility Bridge

Timestamp: 20260411-201347
Branch: kernel-canonicalization-20260411-200129

## What this patch does
- Extends kernel/types.ts
- Re-exports only missing canonical symbols from kernel/canonical-types.ts

## Missing type symbols detected
AuditLevel, KernelSignalRecord

## Missing value symbols detected
KernelPriorities, KernelScopes, AuditLevels, normalizeKernelPriority, normalizeAuditLevel, normalizeKernelScopes

## Safety model
- Additive only
- Does not remove existing legacy exports
- Does not rename live imports
- Enables gradual live migration toward canonical types

## Why this matters
This is the first low-risk live alignment step.
Existing modules that still import from ./types can begin to resolve canonical symbols safely.
