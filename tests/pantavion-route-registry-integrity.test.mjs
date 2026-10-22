// Read-only integrity test: no deployment, database access or external services.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const routes = readFileSync("core/pantavion/route-status-registry.ts", "utf8");
const taxonomy = readFileSync("core/pantavion/product-family-taxonomy.ts", "utf8");
const routeBlocks = [...routes.matchAll(/\{\s*path:\s*"([^"]+)",\s*label:\s*"([^"]+)",\s*status:\s*"([^"]+)",\s*riskClass:\s*"([^"]+)",\s*family:\s*"([^"]+)"/g)];
const families = [...taxonomy.matchAll(/\{\s*id:\s*"([^"]+)",\s*title:\s*"([^"]+)"/g)].map(m=>m[1]);
assert.ok(routeBlocks.length > 0, "No route records parsed; update the audit parser");
const paths = routeBlocks.map(m=>m[1]);
assert.equal(new Set(paths).size, paths.length, "Duplicate route paths");
for (const match of routeBlocks) {
  const [,path,,status,risk,family] = match;
  assert.ok(path.startsWith("/"), `Invalid route: ${path}`);
  assert.ok(["LIVE","FOUNDATION","BETA","RESTRICTED","LEGAL_REVIEW","FUTURE","BLOCKED"].includes(status), `Invalid status: ${path}`);
  assert.ok(["LOW","MEDIUM","HIGH","CRITICAL"].includes(risk), `Invalid risk: ${path}`);
  assert.ok(families.includes(family), `Unknown product family ${family} for ${path}`);
}
console.log(JSON.stringify({result:"PASS",scope:"registry structure only; not production readiness",routeCount:paths.length,familyCount:families.length},null,2));
