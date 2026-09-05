import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

const root = process.cwd();
const registryPath = join(root, "core/sovereign/implementation-registry.ts");
const statusRoutePath = join(root, "app/api/implementation-plan/route.ts");
const ownerPagePath = join(root, "app/owner/control/implementation/page.tsx");

const [registry, statusRoute, ownerPage] = await Promise.all([
  readFile(registryPath, "utf8"),
  readFile(statusRoutePath, "utf8"),
  readFile(ownerPagePath, "utf8"),
]);

const lifecycle = ["IDEA", "CODED", "TESTED", "MERGED", "DEPLOYED", "VERIFIED_LIVE"];
for (const state of lifecycle) assert.match(registry, new RegExp(`\\b${state}\\b`), `missing lifecycle state: ${state}`);
assert.match(registry, /syntheticRecordsCountedAsImplementation\s*:\s*0/);
assert.match(registry, /owner|founder/i);
assert.match(registry, /provenance|evidence/i);
assert.match(registry, /blocker/i);
assert.match(statusRoute, /NextResponse|Response/);
assert.match(statusRoute, /GET/);
assert.match(statusRoute, /status|verification|provenance|owner/i);
assert.doesNotMatch(statusRoute, /supabase\.from\(|\.insert\(|\.update\(|\.delete\(/i);
assert.doesNotMatch(statusRoute, /force-push|skip.*gate|bypass/i);
assert.match(ownerPage, /implementation|verification|owner/i);

console.log("sovereign recovery ledger contract: PASS");
