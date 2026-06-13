import { createPantavionWorkPackagePlans } from "@/core/pantaai/autonomous-code/ecosystem-work-package-generator";
import { getPantavionEcosystemWorkPackages } from "@/core/pantaai/autonomous-code/ecosystem-work-packages";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const maxRaw = Number(url.searchParams.get("maxPackages") ?? "9");
  const maxPackages = Number.isFinite(maxRaw) ? Math.max(1, Math.min(maxRaw, 50)) : 9;

  const packages = getPantavionEcosystemWorkPackages();
  const plans = createPantavionWorkPackagePlans(maxPackages);

  return Response.json({
    ok: true,
    marker: "pantavion_ecosystem_work_packages_route_c5_v1",
    totalPackages: packages.length,
    returnedPlans: plans.length,
    plans,
  });
}

const pantavion_ecosystem_work_packages_route_marker_v1 =
  "pantavion_ecosystem_work_packages_route_c5_v1";

