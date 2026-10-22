// Read-only release safety checks for sensitive product routes.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync("core/pantavion/route-status-registry.ts", "utf8");
const entries = [...source.matchAll(/\{\s*path:\s*"([^"]+)",([\s\S]*?)\n\s*\},/g)];
assert.ok(entries.length >= 16, "Registry parsing incomplete: fail closed");

function field(block, key) {
  const match = block.match(new RegExp("\\b" + key + ':\\s*"([^"]+)"'));
  assert.ok(match, "Missing " + key + " in registry record");
  return match[1];
}
const routes = new Map(entries.map(([,path,body]) => [path, {
  status: field(body, "status"),
  risk: field(body, "riskClass"),
  notes: field(body, "notes"),
}]));
for (const path of ["/sos-interpreter", "/pricing", "/import-world", "/legal"]) {
  assert.ok(routes.has(path), "Missing sensitive route: " + path);
}
assert.notEqual(routes.get("/sos-interpreter").status, "LIVE", "Emergency backend must not be claimed live without operational verification");
assert.match(routes.get("/sos-interpreter").notes, /not yet claimed/i, "Emergency route must disclose backend limitations");
assert.notEqual(routes.get("/pricing").status, "LIVE", "Pricing must not claim live charging before gates");
assert.match(routes.get("/pricing").notes, /non-charging/i, "Pricing must disclose non-charging state");
assert.equal(routes.get("/import-world").status, "LEGAL_REVIEW", "Cross-platform import requires legal review");
assert.match(routes.get("/import-world").notes, /consent/i, "Import route must require consent");
assert.equal(routes.get("/import-world").risk, "CRITICAL", "Cross-platform import must retain critical risk classification");
console.log("PASS: sensitive route claims and consent safeguards (registry only)");
