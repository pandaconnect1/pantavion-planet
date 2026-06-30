import { readFileSync } from "node:fs";

const core = readFileSync("core/water/water-operational-overlay.ts", "utf8");
const store = readFileSync("core/water/water-operational-overlay-store.ts", "utf8");
const route = readFileSync("app/api/kernel/water-operational-overlay/route.ts", "utf8");

const requiredCoreTokens = [
  "PANTAVION_WATER_OPERATIONAL_COLOR_POLICY",
  "assessPantavionWaterOperationalOverlay",
  "closed_temporary_fault",
  "closed_permanent",
  "opened_after_repair",
  "sv_problem_detected",
  "sv_defective_operable",
  "sv_defective_inoperable",
  "sv_replacement_required",
  "sv_replaced_pending_verification",
  "sv_lost_or_covered",
  "cyan_lost_covered_ring",
  "dashed_ring",
  "dashed_ring_white_hatch",
  "white_hatch_lines",
  "overlayAdornment",
  "replacementRequired",
  "lostOrCoveredInvestigationRequired",
  "originalDwgMutationAllowed: false",
  "physicalValveControl: false",
  "scadaWriteAllowed: false",
  "allowedOnSurfaceB: false",
  "allowedOnSurfaceC: true"
];

const requiredStoreTokens = [
  "water-operational-overlay-state.json",
  "water-operational-overlay-audit.jsonl",
  "applyPantavionWaterOperationalOverlay",
  "restore_all_opened",
  "water.operational.overlay.applied",
  "water.operational.overlay.bulk_restored"
];

const requiredRouteTokens = [
  "export async function GET",
  "export async function POST",
  "pantavion_water_operational_overlay_sv_workflow",
  "mark_sv_lost_or_covered",
  "mode === \"apply\""
];

const missing = [
  ...requiredCoreTokens.filter((token) => !core.includes(token)),
  ...requiredStoreTokens.filter((token) => !store.includes(token)),
  ...requiredRouteTokens.filter((token) => !route.includes(token))
];

if (missing.length > 0) {
  console.error("Water operational overlay audit failed. Missing tokens:");
  for (const token of missing) {
    console.error(`- ${token}`);
  }
  process.exit(1);
}

console.log("Water operational overlay audit passed.");
