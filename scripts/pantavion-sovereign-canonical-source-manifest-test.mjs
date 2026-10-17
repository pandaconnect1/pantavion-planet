import { readFile } from "node:fs/promises";
import { join } from "node:path";

const root = process.cwd();
const registryPath = join(root, "core/pantavion/implementation-sync-registry.ts");
const registry = await readFile(registryPath, "utf8");

const expected = [
  ["sovereign-technology-factory", "core/sovereign/technology-factory.ts"],
  ["intent-to-outcome-fabric", "core/sovereign/intent-to-outcome-fabric.ts"],
  ["ephemeral-agent-swarm", "core/sovereign/ephemeral-agent-swarm.ts"],
  ["intent-firewall", "core/sovereign/intent-firewall.ts"],
  ["agent-capability-budget", "core/sovereign/agent-capability-budget-control.ts"],
  ["disconnected-edge-execution", "core/sovereign/edge-execution.ts"],
  ["owner-control", "core/pantavion/owner-control.ts"],
  ["technology-library", "core/sovereign/technology-library.ts"],
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

for (const [id, sourcePath] of expected) {
  assert(registry.includes(`testedItem(\"${id}\"`), `Missing canonical workstream id: ${id}`);
  assert(registry.includes(`\"${sourcePath}\"`), `Missing canonical source path for ${id}`);
  await readFile(join(root, sourcePath), "utf8");
}

assert(
  registry.includes("syntheticRecordsCountedAsImplementation: 0"),
  "Recovery-derived records must remain excluded from implementation counts.",
);
assert(
  registry.includes("IDEA -> CODED -> TESTED -> MERGED -> DEPLOYED -> VERIFIED_LIVE"),
  "Canonical lifecycle must remain explicit and ordered.",
);
assert(
  !registry.includes("forcePushProduction") && !registry.includes("resetProductionData"),
  "Canonical registry must not expose unsafe production bypass markers.",
);

console.log("Canonical Sovereign source-manifest contract passed.");
