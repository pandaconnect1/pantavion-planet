const fs = require("node:fs");

function read(path) {
  return fs.readFileSync(path, "utf8");
}

function requireAll(label, text, needles) {
  const missing = needles.filter((needle) => !text.includes(needle));
  if (missing.length) {
    throw new Error(`${label} missing required contract: ${missing.join(", ")}`);
  }
}

const migrationPath = "supabase/migrations/20260829135042_create_founder_canonical_state_and_execution_intents.sql";
const runtimePath = "core/kernel/pantavion-founder-canonical-state-runtime.ts";
const routePath = "app/api/kernel/canonical-state/route.ts";
const cronPath = "app/api/pantavion/intelligence/cron/route.ts";
const kernelPagePath = "app/kernel/page.tsx";
const materializationControlPath = "app/kernel/canonical-materialization-client.tsx";

const migration = read(migrationPath);
const runtime = read(runtimePath);
const route = read(routePath);
const cron = read(cronPath);
const kernelPage = read(kernelPagePath);
const materializationControl = read(materializationControlPath);

requireAll("migration", migration, [
  "pantavion_founder_canonical_states",
  "pantavion_founder_execution_intents",
  "force row level security",
  "revoke all on table public.pantavion_founder_canonical_states from public, anon, authenticated",
  "revoke all on table public.pantavion_founder_execution_intents from public, anon, authenticated",
  "to service_role",
  "pending_materialization",
  "work_order_execution_id",
]);

requireAll("server runtime", runtime, [
  'import "server-only"',
  "createAdminClient",
  "persistPantavionFounderWorkOrder",
  "materializePantavionFounderExecutionIntents",
  'status: "materializing"',
  'status: "materialized"',
  'status: "blocked"',
  "materialization_lease_expired",
  "idempotencyKey: row.idempotency_key",
]);

requireAll("founder route", route, [
  "isPantavionKernelFounderRequestAllowed",
  "createPantavionKernelAccessDeniedReport",
  "listPantavionFounderCanonicalStates",
  "listPantavionFounderExecutionIntents",
  "materializePantavionFounderExecutionIntents",
  "evaluatePrivilegedRequestBoundary",
  "export async function POST",
  'action !== "materialize"',
  'visibility: "founder_internal_only"',
  'workOrderMaterialization: true',
  'directFileWriteAllowed: false',
  'directProductionDeployAllowed: false',
  'status: 404',
  'Cache-Control", "no-store',
]);

const boundaryIndex = route.indexOf("evaluatePrivilegedRequestBoundary(request)");
const founderAuthIndex = route.indexOf("isPantavionKernelFounderRequestAllowed(request)", boundaryIndex);
const materializeRouteIndex = route.indexOf("materializePantavionFounderExecutionIntents(limit)");
if (
  boundaryIndex < 0 ||
  founderAuthIndex < 0 ||
  materializeRouteIndex < 0 ||
  boundaryIndex > founderAuthIndex ||
  founderAuthIndex > materializeRouteIndex
) {
  throw new Error("founder materialization POST must enforce mutation boundary then founder+AAL2 authorization before materialization");
}

requireAll("founder kernel page", kernelPage, [
  "isPantavionKernelFounderIdentityAllowed",
  "CanonicalMaterializationClient",
  "<CanonicalMaterializationClient />",
]);

requireAll("founder materialization control", materializationControl, [
  '"use client"',
  'fetch("/api/kernel/canonical-state"',
  'method: "POST"',
  '"Content-Type": "application/json"',
  'JSON.stringify({ action: "materialize", limit: 50 })',
  'credentials: "same-origin"',
  "Materialize pending intents",
  "direct file write: false",
  "direct production deploy: false",
]);

if (materializationControl.includes("NEXT_PUBLIC_") || materializationControl.includes("SUPABASE_SERVICE_ROLE")) {
  throw new Error("founder materialization control must not contain public or service-role credentials");
}

requireAll("cron", cron, [
  "materializePantavionFounderExecutionIntents",
  "runPantavionNervousSystemFoundryTick",
  "canonicalExecutionIntake",
  "exact CRON_SECRET bearer token",
]);

const materializeCall = "const canonicalExecutionIntake = await materializePantavionFounderExecutionIntents";
const foundryCall = "const foundry = await runPantavionNervousSystemFoundryTick";
const materializeIndex = cron.indexOf(materializeCall);
const foundryIndex = cron.indexOf(foundryCall);
if (materializeIndex < 0 || foundryIndex < 0 || materializeIndex > foundryIndex) {
  throw new Error("canonical execution intents must be materialized before the Nervous System/Foundry tick");
}

const forbiddenPublicClientPatterns = [
  "NEXT_PUBLIC_SUPABASE",
  "NEXT_PUBLIC_",
  "createBrowserClient",
  "createClientComponentClient",
  "SUPABASE_ANON_KEY",
  "SUPABASE_PUBLISHABLE_KEY",
];
const forbiddenPublicClientPattern = forbiddenPublicClientPatterns.find((pattern) => runtime.includes(pattern));
if (forbiddenPublicClientPattern) {
  throw new Error(`canonical founder state runtime uses forbidden browser/public database path: ${forbiddenPublicClientPattern}`);
}

console.log("Pantavion canonical founder state + execution intent contract verified.");
