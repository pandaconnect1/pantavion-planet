import {
  createPantavionDailyEcosystemBrief,
  getPantavionEcosystemSignals,
  pantavionCapabilityReadinessChecklist,
} from "@/core/intelligence/pantavion-ecosystem-signal-registry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({
    ok: true,
    route: "/api/pantavion/ecosystem-signals",
    status: "internal",
    note:
      "Internal ecosystem signal registry. It does not claim autonomous implementation or production deployment.",
    checklist: pantavionCapabilityReadinessChecklist,
    signals: getPantavionEcosystemSignals({ minimumImportance: "important" }),
    dailyBrief: createPantavionDailyEcosystemBrief(),
  });
}
