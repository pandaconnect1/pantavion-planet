import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

const root = process.cwd();
const packageJson = JSON.parse(await readFile(join(root, "package.json"), "utf8"));
const scripts = packageJson.scripts ?? {};

const requiredScripts = [
  "verify:runtime-safety",
  "audit:implementation",
  "audit:scheduled-worker",
  "test:sovereign-factory-contract",
  "test:sovereign-kernel-integration",
  "test:owner-release-gate",
];

for (const scriptName of requiredScripts) {
  assert.equal(typeof scripts[scriptName], "string", `missing verification script: ${scriptName}`);
}

const runtimeSafety = scripts["verify:runtime-safety"];
for (const requiredFragment of [
  "npm run lint",
  "npm run typecheck",
  "npm run build",
  "npm run audit:implementation",
  "npm run audit:scheduled-worker",
]) {
  assert.match(runtimeSafety, new RegExp(requiredFragment.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&")), `runtime safety chain missing ${requiredFragment}`);
}

const statusRoute = await readFile(
  join(root, "app/api/implementation-plan/route.ts"),
  "utf8",
);
for (const marker of [
  "NextResponse",
  "runtime",
  "status",
  "blocker",
  "provenance",
  "owner",
  "verification",
]) {
  assert.match(statusRoute, new RegExp(marker), `status route missing visible marker: ${marker}`);
}

for (const unsafePrimitive of [
  "supabase.from(",
  "supabase.rpc(",
  "insert into",
  "update ",
  "delete from",
  "force-push",
  "DROP TABLE",
]) {
  assert.equal(
    statusRoute.toLowerCase().includes(unsafePrimitive.toLowerCase()),
    false,
    `status route contains unsafe primitive: ${unsafePrimitive}`,
  );
}

const lifecycle = [
  "IDEA",
  "CODED",
  "TESTED",
  "MERGED",
  "DEPLOYED",
  "VERIFIED_LIVE",
];
const factoryContract = await readFile(
  join(root, "scripts/pantavion-sovereign-factory-contract-test.mjs"),
  "utf8",
);
let previousIndex = -1;
for (const state of lifecycle) {
  const index = factoryContract.indexOf(state);
  assert.ok(index > previousIndex, `lifecycle order missing or out of order: ${state}`);
  previousIndex = index;
}

assert.equal(
  /syntheticRecordsCountedAsImplementation\\s*:\\s*0/.test(factoryContract),
  true,
  "synthetic recovery records must remain excluded from implementation counts",
);

console.log("sovereign evidence-chain contract: PASS");
