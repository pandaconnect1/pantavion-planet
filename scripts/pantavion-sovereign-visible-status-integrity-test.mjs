import { readFile } from "node:fs/promises";
import { join } from "node:path";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const statusPath = join(process.cwd(), "docs/verification/PANTAVION_FACTORY_STATUS_2026-09-04.md");
const status = await readFile(statusPath, "utf8");

const requiredWorkstreams = [
  "Intent-to-Outcome Fabric",
  "Ephemeral Agent Swarm",
  "disconnected / edge execution",
  "Intent Firewall",
  "Agent Capability / Budget Control",
  "Owner Control integration",
  "Technology Library",
  "visible implementation-status / verification surface",
];
for (const workstream of requiredWorkstreams) {
  assert(status.includes(workstream), `Visible status must name workstream: ${workstream}`);
}

const lifecycle = ["IDEA", "CODED", "TESTED", "MERGED", "DEPLOYED", "VERIFIED_LIVE"];
for (let index = 0; index < lifecycle.length - 1; index += 1) {
  assert(
    status.includes(`${lifecycle[index]} -> ${lifecycle[index + 1]}`),
    `Visible status must preserve lifecycle edge ${lifecycle[index]} -> ${lifecycle[index + 1]}`,
  );
}

assert(status.includes("syntheticRecordsCountedAsImplementation: 0"), "Recovery status must preserve zero synthetic implementation records.");
assert(status.includes("No production mutation"), "Status surface must state the production mutation boundary.");
assert(status.includes("No owner admission"), "Status surface must state the owner admission boundary.");
assert(status.includes("No public release"), "Status surface must state the public release boundary.");
assert(status.includes("No agent activation"), "Status surface must state the agent activation boundary.");

const blockedMentions = [...status.matchAll(/BLOCKED|HOLD|blocker/gi)].map((match) => match[0]);
assert(blockedMentions.length > 0, "Visible status must expose blockers or governed holds rather than implying completion.");

const forbiddenFalseLiveClaims = ["VERIFIED_LIVE: yes", "DEPLOYED: yes", "production live: yes"];
for (const claim of forbiddenFalseLiveClaims) {
  assert(!status.toLowerCase().includes(claim.toLowerCase()), `Status must not contain unqualified false-live claim: ${claim}`);
}

console.log("Visible status integrity contract passed.");
