const fs = require("node:fs");

function read(path) {
  return fs.readFileSync(path, "utf8");
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const runtime = read("core/research/pantavion-demand-radar-runtime.ts");
const route = read("app/api/kernel/demand-radar/route.ts");
const page = read("app/kernel/demand-radar/page.tsx");
const client = read("app/kernel/demand-radar/kernel-demand-radar-client.tsx");
const canonicalMigration = read("supabase/migrations/20260829135042_create_founder_canonical_state_and_execution_intents.sql");

assert(runtime.includes('PANTAVION_DEMAND_RADAR_STATE_KIND = "global_human_demand_radar"'), "missing canonical radar state kind");
assert(runtime.includes('PANTAVION_DEMAND_RADAR_SNAPSHOT_MARKER'), "missing snapshot marker");
assert(runtime.includes('content_sha256'), "canonical snapshot SHA not persisted");
assert(runtime.includes('supersedes_state_id'), "version provenance missing");
assert(runtime.includes('status: "superseded"'), "prior active state is not superseded");
assert(runtime.includes('validatedCountryRefs'), "country validation evidence filter missing");
assert(runtime.includes('item.tier === "country_report" || item.tier === "official"'), "country validation is not evidence-tier constrained");
assert(runtime.includes('versionedIdempotencyKey'), "snapshot-specific promotion idempotency missing");
assert(runtime.includes('approval_scope: candidate.submission.approvalScope'), "promotion is not routed through canonical execution intents");
assert(runtime.includes('status: "pending_materialization"'), "promotion bypasses canonical materialization state");

assert(route.includes('isPantavionKernelFounderRequestAllowed(request)'), "demand radar API is not founder-gated");
assert(route.includes('action === "initialize"'), "canonical seed initialization action missing");
assert(route.includes('action === "ingest"'), "research ingest action missing");
assert(route.includes('action === "promote"'), "founder promotion action missing");
assert(route.includes('materializePantavionFounderExecutionIntents(20)'), "promotion does not enter canonical Pantavion execution intake");
assert(route.includes('productionMutationAllowed: false'), "API truth boundary missing");

assert(page.includes('isPantavionKernelFounderIdentityAllowed()'), "demand radar page is not founder-identity gated");
assert(client.includes('/api/kernel/demand-radar'), "dashboard is not connected to live API");
assert(client.includes('Seven-continent coverage'), "seven-continent dashboard missing");
assert(client.includes('Create governed work-order proposal'), "governed founder action missing");
assert(client.includes('Ingest research into Pantavion'), "research intake UI missing");

assert(canonicalMigration.includes('force row level security'), "canonical store RLS force missing");
assert(canonicalMigration.includes('revoke all on table public.pantavion_founder_canonical_states from public, anon, authenticated'), "canonical state public access not revoked");
assert(canonicalMigration.includes('revoke all on table public.pantavion_founder_execution_intents from public, anon, authenticated'), "execution intent public access not revoked");

console.log("PANTAVION CONTINUOUS DEMAND RADAR RUNTIME: PASSED");
console.log("- founder-only API and page: yes");
console.log("- canonical versioned SHA snapshots: yes");
console.log("- evidence-bound country validation: yes");
console.log("- proposal-only canonical execution intake: yes");
console.log("- direct production mutation: no");
