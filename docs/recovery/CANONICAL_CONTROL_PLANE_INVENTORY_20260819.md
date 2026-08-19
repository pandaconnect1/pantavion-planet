# Canonical control-plane inventory — 2026-08-19

## Canonical target

`pantavion-planet` is the single implementation target. No repository, domain, runtime, or storage changes are included in this increment.

## Existing artifacts and mapping

| Existing artifact | Evidence | Role in canonical path | Disposition |
| --- | --- | --- | --- |
| `core/recovery/canonical-knowledge-classification.ts` | Defines recovery provenance, classification, and live-state types | Source vocabulary for recovery and classification records | Reuse; persistent mapping begins in this increment |
| `core/recovery/repository-triage-registry.ts` | Lists repository triage records | Historical donor inventory input | Preserve; contains conflicting duplicate `pantavion-planet` records requiring later data reconciliation |
| `core/recovery/project-fragment-registry.ts` | Lists project fragment records | Historical fragment inventory input | Preserve; contains a duplicate `pantavion-planet` candidate-clean record requiring later data reconciliation |
| `core/canonical/canonical-registry.ts` | Resolves code placement by domain | Code-placement registry | Reuse; not a persistent recovery/readiness source of truth |
| `core/registry/capability-registry.ts` | Static capability definitions and scope checks | Capability catalogue input | Reuse; persistent grants begin in this increment |
| `core/security/authorization-policy-registry.ts` | Static authorization policy records | Policy vocabulary input | Reuse; deterministic persisted evaluation ledger begins in this increment |
| `core/runtime/supabase-durable-execution-store.ts` | Server-only Supabase persistence | Established server-side control-plane persistence pattern | Reuse for future repository implementation |
| `supabase/migrations/20260811002000_create_durable_execution_runtime.sql` | RLS-enabled, service-only control-plane tables | Security/RLS baseline | Reuse pattern; no change |
| `kernel/`, `src/kernel/`, `core/kernel/`, `core/storage/` | Multiple historical/runtime kernel and store generations | Historical/runtime implementations | Preserve; not deleted or renamed in this increment |
| `kernel/_backup_2026-04-08/` and `docs/kernel-canonicalization/` | Explicit backup and canonicalization evidence | Historical evidence | Preserve unchanged |

## Conflict requiring later reconciliation

Both recovery registries assign two roles to `pantavion-planet`: canonical and donor/candidate-clean. This increment records the canonical persistence model only; it does not rewrite or delete historical registry entries. A later reconciliation must create explicit recovery records, classify the duplicate records, map dependencies, and obtain owner approval before cleanup.

## Increment boundary

The migration introduces service-controlled, tenant-owned persistent tables for the lifecycle:

`recovery item → canonical classification → entity/module mapping → gap → work item → evidence → readiness`.

It also adds capability grants, per-user AI authority, agent identity/audit, and an immutable policy-evaluation ledger. No application route consumes these tables yet; therefore readiness remains unassessed until implementation, security tests, deployment, and production-path verification produce evidence.
