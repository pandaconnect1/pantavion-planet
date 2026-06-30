import { readFileSync } from "node:fs";

const core = readFileSync("core/water/water-work-order-registry.ts", "utf8");
const store = readFileSync("core/water/water-work-order-registry-store.ts", "utf8");
const route = readFileSync("app/api/kernel/water-work-order-registry/route.ts", "utf8");
const docs = readFileSync("docs/pantavion/water-work-order-field-verification-registry.md", "utf8");

const requiredCoreTokens = [
  "PantavionWaterWorkOrderKind",
  "assessPantavionWaterWorkOrder",
  "fault",
  "repair",
  "replacement",
  "lost_covered_investigation",
  "telemetry_check",
  "as_built_verification",
  "fieldVerificationStatus",
  "requiresFieldVerification",
  "requiresSupervisorReview",
  "requiresPhotoRefs",
  "requiresTelemetryRefs",
  "originalDwgMutationAllowed: false",
  "sourceDwgReferenceOnly: true",
  "physicalControlAllowed: false",
  "scadaWriteAllowed: false",
  "telemetryReadOnly: true"
];

const requiredStoreTokens = [
  "water-work-order-registry-state.json",
  "water-work-order-registry-audit.jsonl",
  "registerPantavionWaterWorkOrder",
  "water.work.order.registry.registered"
];

const requiredRouteTokens = [
  "export async function GET",
  "export async function POST",
  "pantavion_water_work_order_field_verification_registry",
  "mode === \"register\""
];

const requiredDocTokens = [
  "PATCH 8Q",
  "Work Order / Field Verification Registry",
  "No physical valve control",
  "No SCADA write",
  "Original DWG is never mutated",
  "photo references",
  "field verification"
];

const missing = [
  ...requiredCoreTokens.filter((token) => !core.includes(token)),
  ...requiredStoreTokens.filter((token) => !store.includes(token)),
  ...requiredRouteTokens.filter((token) => !route.includes(token)),
  ...requiredDocTokens.filter((token) => !docs.includes(token))
];

if (missing.length > 0) {
  console.error("Water work order registry audit failed. Missing tokens:");
  for (const token of missing) {
    console.error(`- ${token}`);
  }
  process.exit(1);
}

console.log("Water work order registry audit passed.");
