import { readFile } from "node:fs/promises";
import { join } from "node:path";

const root = process.cwd();

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const sources = [
  "core/sovereign/intent-to-outcome-fabric.ts",
  "core/sovereign/ephemeral-agent-swarm.ts",
  "core/sovereign/edge-execution.ts",
  "core/sovereign/intent-firewall.ts",
  "core/sovereign/agent-capability-budget-control.ts",
  "core/sovereign/technology-library.ts",
  "core/pantavion/implementation-sync-registry.ts",
  "core/intelligence/pantavion-sovereign-intelligence-fabric.ts",
];

for (const relativePath of sources) {
  const content = await readFile(join(root, relativePath), "utf8");
  assert(content.trim().length > 0, `Canonical source must be non-empty: ${relativePath}`);
}

const [fabric, swarm, edge, firewall, capability, library, registry, intelligence] = await Promise.all(
  sources.map((relativePath) => readFile(join(root, relativePath), "utf8")),
);

assert(/intent|outcome/i.test(fabric), "Intent-to-Outcome Fabric markers must remain discoverable.");
assert(/ephemeral|agent/i.test(swarm), "Ephemeral Agent Swarm markers must remain discoverable.");
assert(/offline|disconnected|edge/i.test(edge), "Disconnected/edge execution markers must remain discoverable.");
assert(/firewall|allow|deny|approval/i.test(firewall), "Intent Firewall decision markers must remain discoverable.");
assert(/capability|budget|grant/i.test(capability), "Capability/Budget Control markers must remain discoverable.");
assert(/technology|evidence|license|deploymentAuthorized/i.test(library), "Technology Library evidence boundary must remain discoverable.");
assert(/IDEA|CODED|TESTED|MERGED|DEPLOYED|VERIFIED_LIVE/.test(registry), "Lifecycle truth markers must remain discoverable.");
assert(/provider-neutral|sovereign|brain|intelligence/i.test(intelligence), "Sovereign intelligence source markers must remain discoverable.");

const forbidden = /supabase\.from\(|\.insert\(|\.update\(|\.delete\(|force[-_ ]push|owner admission|external authorization|agent activation/i;
for (const [name, content] of Object.entries({ fabric, swarm, edge, firewall, capability, library, registry, intelligence })) {
  assert(!forbidden.test(content), `Canonical source contains an unsafe direct mutation/bypass marker: ${name}`);
}

console.log(`PASS sovereign factory surface coverage: ${sources.length} canonical sources verified`);
