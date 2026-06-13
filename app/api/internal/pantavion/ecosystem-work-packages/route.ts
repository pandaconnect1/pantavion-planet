import { createPantavionWorkPackagePlans } from "@/core/pantaai/autonomous-code/ecosystem-work-package-generator";
import { getPantavionEcosystemWorkPackages } from "@/core/pantaai/autonomous-code/ecosystem-work-packages";
import { appendPantavionRuntimeLedgerEvent } from "@/core/pantaai/runtime/runtime-ledger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function recordWorkPackageLedgerEvent(input: {
  readonly totalPackages: number;
  readonly returnedPlans: number;
  readonly maxPackages: number;
  readonly gatedTargets: number;
}): void {
  try {
    appendPantavionRuntimeLedgerEvent({
      eventType: "work_package_planned",
      kernelFamily: "Pantavion Ecosystem Work Package Kernel",
      message: "Ecosystem work package plans were requested.",
      protectedDomains: input.gatedTargets > 0 ? ["founder_gate", "protected_domain"] : [],
      metadata: input,
    });
  } catch {
    // Ledger failure must never break internal planning routes.
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const maxRaw = Number(url.searchParams.get("maxPackages") ?? "9");
  const maxPackages = Number.isFinite(maxRaw) ? Math.max(1, Math.min(maxRaw, 50)) : 9;

  const packages = getPantavionEcosystemWorkPackages();
  const plans = createPantavionWorkPackagePlans(maxPackages);
  const gatedTargets = plans.reduce((count, plan) => count + plan.gatedTargets.length, 0);

  recordWorkPackageLedgerEvent({
    totalPackages: packages.length,
    returnedPlans: plans.length,
    maxPackages,
    gatedTargets,
  });

  return Response.json({
    ok: true,
    marker: "pantavion_ecosystem_work_packages_route_c5_v1",
    ledgerMarker: "pantavion_ecosystem_work_packages_ledger_route_c7c_v1",
    totalPackages: packages.length,
    returnedPlans: plans.length,
    plans,
  });
}

const pantavion_ecosystem_work_packages_route_marker_v1 =
  "pantavion_ecosystem_work_packages_route_c5_v1";

const pantavion_ecosystem_work_packages_ledger_route_marker_v1 =
  "pantavion_ecosystem_work_packages_ledger_route_c7c_v1";
