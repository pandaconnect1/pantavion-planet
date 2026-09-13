import assert from "node:assert/strict";
import fs from "node:fs";

const read = (path) => fs.readFileSync(path, "utf8");

const gateSource = read("core/pantavion/owner-release-gate.ts");
const registrySource = read("core/pantavion/implementation-sync-registry.ts");
const pageSource = read("app/owner/control/implementation/page.tsx");
const fabricSource = read("core/intelligence/pantavion-sovereign-intelligence-fabric.ts");

const lifecycle = ["idea", "coded", "tested", "merged", "deployed", "verified_live"];

assert.match(gateSource, /implementationRank/);
for (const state of lifecycle) assert.match(gateSource, new RegExp(`\\b${state}\\b`));
assert.match(registrySource, /truthChain:\s*\[\"idea\",\s*\"coded\",\s*\"tested\",\s*\"merged\",\s*\"deployed\",\s*\"verified_live\"\]/);
assert.match(registrySource, /blockedRule:/);
assert.match(registrySource, /never infers completion from code alone/);
assert.match(pageSource, /IDEA.*CODED.*TESTED.*MERGED.*DEPLOYED.*VERIFIED_LIVE/);
assert.match(pageSource, /OWNER_OK_FOR_USERS/);
assert.match(fabricSource, /Every build action must pass audit, TypeScript, build, scoped commit, push, and production verification/);
assert.match(fabricSource, /Agents are virtual workers with scoped authority/);

const forbiddenFalseLive = /(?:claim|mark|set)[^\n]{0,80}(?:verified_live|VERIFIED_LIVE)[^\n]{0,80}(?:without|before|missing|absent)/i;
assert.doesNotMatch(registrySource, forbiddenFalseLive);
assert.doesNotMatch(pageSource, forbiddenFalseLive);

console.log("pantavion sovereign factory cross-surface contract: PASS");
console.log(JSON.stringify({
  lifecycle,
  surfaces: [
    "core/pantavion/owner-release-gate.ts",
    "core/pantavion/implementation-sync-registry.ts",
    "app/owner/control/implementation/page.tsx",
    "core/intelligence/pantavion-sovereign-intelligence-fabric.ts",
  ],
  productionMutation: false,
  ownerAdmission: false,
  externalTechnologyAuthorization: false,
  agentActivation: false,
}, null, 2));
