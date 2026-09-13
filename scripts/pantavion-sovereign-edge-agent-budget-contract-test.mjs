import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");
const exists = (relativePath) => fs.existsSync(path.join(root, relativePath));

const factory = read("docs/architecture/PANTAVION_SOVEREIGN_TECHNOLOGY_FACTORY.md");
assert.match(factory, /DISCOVER -> RESEARCH -> PROTOTYPE -> SIMULATE -> BENCHMARK -> SECURE -> APPROVE -> DEPLOY -> OBSERVE -> IMPROVE/);
assert.match(factory, /authority is not implicit/);
assert.match(factory, /identity, consent, capability, jurisdiction, risk, budget and reversibility/);
assert.match(factory, /Owner Control Center/);
assert.match(factory, /Technology Library/);
assert.match(factory, /IDEA != CODED != TESTED != DEPLOYED != VERIFIED_LIVE/);

const requiredSurfaceHints = [
  "disconnected",
  "edge",
  "Intent Firewall",
  "budget",
  "capability",
  "Owner Control",
];
const sourceCandidates = [
  "docs/architecture/PANTAVION_SOVEREIGN_TECHNOLOGY_FACTORY.md",
  "docs/recovery/PANTAVION_MASTER_RECOVERY_CONTINUATION_BRIEF.md",
  "core/intelligence/pantavion-sovereign-intelligence-fabric.ts",
  "core/guardian/pantavion-guardian-kernel.ts",
  "core/pantavion/kernel-completion-spine.ts",
  "core/kernel/autonomous-build/autonomous-kernel-manifest.ts",
];
const corpus = sourceCandidates.filter(exists).map(read).join("\n");
for (const hint of requiredSurfaceHints) assert.match(corpus, new RegExp(hint.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&"), "i"));

const unsafeFragments = [
  "supabase.from(",
  "supabase.rpc(",
  "DROP TABLE",
  "TRUNCATE",
  "force-push",
  "process.env.SUPABASE_SERVICE_ROLE_KEY",
];
for (const fragment of unsafeFragments) assert.doesNotMatch(factory, new RegExp(fragment.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&"), "i"));

console.log(JSON.stringify({
  contract: "sovereign-edge-agent-budget",
  state: "CODED",
  testOnly: true,
  requiredSurfaceHints,
  productionMutation: false,
  ownerAdmission: false,
  externalAuthorization: false,
  agentActivation: false,
  lifecycle: ["IDEA", "CODED", "TESTED", "MERGED", "DEPLOYED", "VERIFIED_LIVE"],
}, null, 2));
