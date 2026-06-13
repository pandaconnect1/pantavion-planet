import { checkPantavionProductionAutonomyEnvironment } from "@/core/pantaai/runtime/production-env-check";
import { isPantavionSchedulerAuthorized } from "@/core/pantaai/runtime/scheduler-guard";
import { appendPantavionRuntimeLedgerEvent } from "@/core/pantaai/runtime/runtime-ledger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const authorized = isPantavionSchedulerAuthorized(request);
  const check = checkPantavionProductionAutonomyEnvironment();

  appendPantavionRuntimeLedgerEvent({
    eventType: check.ok ? "audit_passed" : "founder_gate_required",
    severity: check.ok ? "info" : "warning",
    kernelFamily: "Pantavion Production Environment Check Kernel",
    message: check.ok
      ? "Production autonomy environment check passed safe baseline."
      : "Production autonomy environment check found missing autonomy requirements.",
    protectedDomains: check.ok ? [] : ["production", "secrets", "github_pr", "founder_gate"],
    metadata: {
      marker: "pantavion_production_env_check_route_c8c_v1",
      authorized,
      production: check.production,
      writeMode: check.writeMode,
      safeForObserve: check.safeForObserve,
      safeForGithubPr: check.safeForGithubPr,
      warnings: check.warnings,
      requiredBeforeFullAutonomy: check.requiredBeforeFullAutonomy,
    },
  });

  return Response.json({
    ok: true,
    marker: "pantavion_production_env_check_route_c8c_v1",
    authorized,
    check,
    note: "Secrets are never returned. Only configured/not-configured booleans are exposed.",
  });
}

const pantavion_production_env_check_route_marker_v1 =
  "pantavion_production_env_check_route_c8c_v1";
