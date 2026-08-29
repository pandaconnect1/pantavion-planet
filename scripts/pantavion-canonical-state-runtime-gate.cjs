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

const migration = read(migrationPath);
const runtime = read(runtimePath);
const route = read(routePath);
const cron = read(cronPath);

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
  'visibility: "founder_internal_only"',
  'status: 404',
  'Cache-Control", "no-store',
]);

requireAll("cron", cron, [
  "materializePantavionFounderExecutionIntents",
  "runPantavionNervousSystemFoundryTick",
  "canonicalExecutionIntake",
  "exact CRON_SECRET bearer token",
]);

const materializeIndex = cron.indexOf("materializePantavionFounderExecutionIntents");
const foundryIndex = cron.indexOf("runPantavionNervousSystemFoundryTick");
if (materializeIndex < 0 || foundryIndex < 0 || materializeIndex > foundryIndex) {
  throw new Error("canonical execution intents must be materialized before the Nervous System/Foundry tick");
}

if (runtime.includes("NEXT_PUBLIC_") || runtime.includes("anon") || runtime.includes("authenticated")) {
  throw new Error("canonical founder state runtime must not use browser/public database credentials");
}

console.log("Pantavion canonical founder state + execution intent contract verified.");
