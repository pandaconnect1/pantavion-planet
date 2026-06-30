import { readFileSync } from "node:fs";

const core = readFileSync("core/water/water-asset-registry.ts", "utf8");
const store = readFileSync("core/water/water-asset-registry-store.ts", "utf8");
const route = readFileSync("app/api/kernel/water-asset-registry/route.ts", "utf8");
const docs = readFileSync("docs/pantavion/water-asset-registry-sv-fh-prv-dma-telemetry.md", "utf8");

const requiredCoreTokens = [
  "PANTAVION_WATER_ASSET_TYPE_REGISTRY",
  "assessPantavionWaterAssetRegistration",
  "listPantavionWaterAssetTypeRegistry",
  "SV",
  "FH",
  "PRV",
  "DMA",
  "PIPE",
  "METER",
  "PUMP",
  "TANK",
  "RESERVOIR",
  "TELEMETRY",
  "lost_or_covered",
  "replacement_required",
  "supportsOperationalOverlay",
  "supportsTelemetry",
  "supportsHydraulicModel",
  "supportsIsolationPlanning",
  "originalDwgMutationAllowed: false",
  "sourceDwgReferenceOnly: true",
  "physicalControlAllowed: false",
  "scadaWriteAllowed: false"
];

const requiredStoreTokens = [
  "water-asset-registry-state.json",
  "water-asset-registry-audit.jsonl",
  "registerPantavionWaterAsset",
  "water.asset.registry.registered"
];

const requiredRouteTokens = [
  "export async function GET",
  "export async function POST",
  "pantavion_water_asset_registry_sv_fh_prv_dma_telemetry",
  "mode === \"register\""
];

const requiredDocTokens = [
  "PATCH 8P",
  "SV / FH / PRV / DMA / Telemetry",
  "No physical valve control",
  "No SCADA write",
  "Original DWG is never mutated"
];

const missing = [
  ...requiredCoreTokens.filter((token) => !core.includes(token)),
  ...requiredStoreTokens.filter((token) => !store.includes(token)),
  ...requiredRouteTokens.filter((token) => !route.includes(token)),
  ...requiredDocTokens.filter((token) => !docs.includes(token))
];

if (missing.length > 0) {
  console.error("Water asset registry audit failed. Missing tokens:");
  for (const token of missing) {
    console.error(`- ${token}`);
  }
  process.exit(1);
}

console.log("Water asset registry audit passed.");
