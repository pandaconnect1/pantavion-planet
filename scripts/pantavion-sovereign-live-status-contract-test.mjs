import { readFile } from "node:fs/promises";
import { join } from "node:path";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const repoRoot = process.cwd();
const requiredSurfaces = [
  "app/api/pantavion/implementation-status/route.ts",
  "core/pantavion/implementation-sync-registry.ts",
  "core/sovereign/intent-to-outcome-fabric.ts",
  "core/sovereign/ephemeral-agent-swarm.ts",
  "core/sovereign/edge-execution.ts",
  "core/sovereign/intent-firewall.ts",
  "core/sovereign/agent-capability-budget-control.ts",
  "core/sovereign/technology-library.ts",
];

for (const relativePath of requiredSurfaces) {
  const content = await readFile(join(repoRoot, relativePath), "utf8");
  assert(content.trim().length > 0, `Canonical surface must be non-empty: ${relativePath}`);
}

const statusRoute = await readFile(
  join(repoRoot, "app/api/pantavion/implementation-status/route.ts"),
  "utf8",
);
for (const marker of ["runtime", "status", "blocker", "provenance", "owner", "verification"]) {
  assert(statusRoute.includes(marker), `Visible status route must expose ${marker}.`);
}
for (const forbidden of ["supabase.from(", "supabase.rpc(", "delete from", "update "]) {
  assert(!statusRoute.toLowerCase().includes(forbidden), `Status route must not contain production mutation primitive: ${forbidden}`);
}

const registry = await readFile(
  join(repoRoot, "core/pantavion/implementation-sync-registry.ts"),
  "utf8",
);
const lifecycle = ["IDEA", "CODED", "TESTED", "MERGED", "DEPLOYED", "VERIFIED_LIVE"];
for (const state of lifecycle) {
  assert(registry.includes(state), `Implementation registry must retain lifecycle state ${state}.`);
}
assert(
  registry.includes("syntheticRecordsCountedAsImplementation") || registry.includes("synthetic"),
  "Registry must preserve synthetic recovery exclusion semantics.",
);
assert(
  registry.includes("owner") && registry.includes("external") && registry.includes("live"),
  "Registry must retain owner/external/live evidence boundaries.",
);

console.log("Sovereign live-status contract passed.");
console.log(`- surfaces_checked=${requiredSurfaces.length}`);
console.log("- lifecycle=IDEA -> CODED -> TESTED -> MERGED -> DEPLOYED -> VERIFIED_LIVE");
console.log("- production_mutation_surface=absent");
console.log("- synthetic_recovery_exclusion=preserved");
