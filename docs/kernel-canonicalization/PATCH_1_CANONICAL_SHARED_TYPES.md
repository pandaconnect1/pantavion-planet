# PATCH 1 — Canonical Shared Types Foundation

Timestamp: 20260411-200722
Branch: kernel-canonicalization-20260411-200129

## What this patch does
- Creates kernel/canonical-types.ts
- Introduces stable canonical primitives:
  - KernelPriority
  - KernelScope
  - AuditLevel
  - KernelIntakeRequest
  - KernelRunRequest
  - KernelSignalRecord
  - clamp
  - 
owIso
  - createKernelId
  - normalizers

## Safety model
- Additive only
- Does not modify live imports yet
- Does not mutate current kernel runtime logic directly

## Next intended patches
1. Redirect low-risk modules to kernel/canonical-types.ts
2. Align udit.ts
3. Align store.ts / memory.ts
4. Align unner.ts / egistry.ts
5. Align API kernel routes
