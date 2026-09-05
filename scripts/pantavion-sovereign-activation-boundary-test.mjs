import { readFile } from "node:fs/promises";
import { join } from "node:path";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const root = process.cwd();
const sources = [
  ["intent-to-outcome-fabric", "core/sovereign/intent-to-outcome-fabric.ts"],
  ["ephemeral-agent-swarm", "core/sovereign/ephemeral-agent-swarm.ts"],
  ["edge-execution", "core/sovereign/edge-execution.ts"],
  ["intent-firewall", "core/sovereign/intent-firewall.ts"],
  ["agent-capability-budget", "core/sovereign/agent-capability-budget-control.ts"],
  ["owner-control", "app/owner/control/implementation/page.tsx"],
  ["technology-library", "core/sovereign/technology-library.ts"],
  ["status-surface", "app/api/implementation/status/route.ts"],
];

for (const [id, relativePath] of sources) {
  const content = await readFile(join(root, relativePath), "utf8");
  assert(content.trim().length > 0, `${id} source must be non-empty.`);
}

const factory = await readFile(join(root, "core/sovereign/technology-factory.ts"), "utf8");
const swarm = await readFile(join(root, "core/sovereign/ephemeral-agent-swarm.ts"), "utf8");
const budget = await readFile(join(root, "core/sovereign/agent-capability-budget-control.ts"), "utf8");
const status = await readFile(join(root, "app/api/implementation/status/route.ts"), "utf8");

assert(/owner|approval|admission/i.test(factory), "Factory must expose an owner/approval boundary.");
assert(/activateEphemeralAgent|approval|authorized/i.test(swarm), "Agent swarm must expose explicit activation authorization.");
assert(/budget|capability|authorize/i.test(budget), "Agent capability/budget control must remain explicit.");
assert(/runtime|status|blocker|provenance|owner|verification/i.test(status), "Status surface must expose verification fields.");

const forbidden = ["supabase.from(", "supabase.rpc(", "process.env.SUPABASE_SERVICE_ROLE_KEY", "force-push", "reset --hard"];
for (const token of forbidden) {
  assert(!status.includes(token), `Status surface must not contain unsafe mutation/bypass token: ${token}`);
}

assert(
  /IDEA\s*->\s*CODED\s*->\s*TESTED\s*->\s*MERGED\s*->\s*DEPLOYED\s*->\s*VERIFIED_LIVE/.test(`${factory}\n${status}`),
  "Lifecycle order must remain explicit and complete.",
);

console.log("sovereign activation boundary contract: PASS");
