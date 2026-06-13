import { appendPantavionRuntimeLedgerEvent, summarizePantavionRuntimeLedger } from "./runtime-ledger";
import { decidePantavionSchedulerRun } from "./scheduler-guard";

export type PantavionSchedulerSmokeResult = {
  readonly ok: boolean;
  readonly marker: "pantavion_scheduler_smoke_check_c8b_v1";
  readonly decision: ReturnType<typeof decidePantavionSchedulerRun>;
  readonly ledgerBefore: number;
  readonly ledgerAfter: number;
  readonly wroteLedger: boolean;
};

export function runPantavionSchedulerSmokeCheck(request: Request): PantavionSchedulerSmokeResult {
  const before = summarizePantavionRuntimeLedger();
  const decision = decidePantavionSchedulerRun(request);

  appendPantavionRuntimeLedgerEvent({
    eventType: decision.ok ? "audit_passed" : "founder_gate_required",
    severity: decision.ok ? "info" : "warning",
    kernelFamily: "Pantavion Scheduler Smoke Check Kernel",
    message: decision.ok
      ? "Scheduler smoke check wrote a runtime ledger event."
      : "Scheduler smoke check confirmed founder gate protection.",
    protectedDomains: decision.protectedDomains,
    metadata: {
      marker: "pantavion_scheduler_smoke_check_c8b_v1",
      decision,
    },
  });

  const after = summarizePantavionRuntimeLedger();

  return {
    ok: after.totalEvents > before.totalEvents,
    marker: "pantavion_scheduler_smoke_check_c8b_v1",
    decision,
    ledgerBefore: before.totalEvents,
    ledgerAfter: after.totalEvents,
    wroteLedger: after.totalEvents > before.totalEvents,
  };
}

export const pantavion_scheduler_smoke_check_marker_v1 =
  "pantavion_scheduler_smoke_check_c8b_v1";
