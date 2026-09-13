import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");

const requiredFiles = [
  "app/owner/control/implementation/page.tsx",
  "core/pantavion/implementation-sync-registry.ts",
  "core/intelligence/global-capability-intake-registry.ts",
  "core/intelligence/pantavion-sovereign-intelligence-fabric.ts",
];

for (const file of requiredFiles) {
  assert.ok(fs.existsSync(path.join(root, file)), `missing canonical owner-control source: ${file}`);
  assert.ok(read(file).trim().length > 0, `empty canonical owner-control source: ${file}`);
}

const implementationPage = read("app/owner/control/implementation/page.tsx");
const registry = read("core/pantavion/implementation-sync-registry.ts");
const intake = read("core/intelligence/global-capability-intake-registry.ts");
const fabric = read("core/intelligence/pantavion-sovereign-intelligence-fabric.ts");

for (const marker of ["Owner", "verification", "provenance", "blocker", "status"]) {
  assert.match(implementationPage, new RegExp(marker, "i"), `owner-control surface missing marker: ${marker}`);
}

for (const marker of ["IDEA", "CODED", "TESTED", "MERGED", "DEPLOYED", "VERIFIED_LIVE"]) {
  assert.match(registry, new RegExp(marker), `implementation registry missing lifecycle marker: ${marker}`);
}

for (const marker of ["delegation", "policy", "provenance", "offline-pack-registry"]) {
  assert.match(intake, new RegExp(marker, "i"), `capability intake missing safety marker: ${marker}`);
}

for (const marker of ["forbidden", "implementation", "trust", "safety"]) {
  assert.match(fabric, new RegExp(marker, "i"), `intelligence fabric missing truth-boundary marker: ${marker}`);
}

for (const forbidden of ["supabase.from(", "supabase.rpc(", "dangerouslySetInnerHTML", "force-push"]) {
  assert.doesNotMatch(implementationPage, new RegExp(forbidden.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), `unsafe primitive leaked into owner-control page: ${forbidden}`);
}

console.log("sovereign owner-control proof: PASS");
