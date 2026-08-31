import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

const root = process.cwd();
const indexPath = join(root, "data/recovery/sovereign-build-order-index-v1.json");
const generatedRoot = join(root, "data/recovery/sovereign-build-dispatch-v1");
const index = JSON.parse(await readFile(indexPath, "utf8"));
const { indexDigest, ...unsignedIndex } = index;

assert.equal(index.marker, "pantavion_recovery_sovereign_build_order_index_v1");
assert.equal(
  createHash("sha256").update(JSON.stringify(unsignedIndex)).digest("hex"),
  indexDigest,
  "Committed build-order index digest must bind the exact canonical payload.",
);
assert.equal(index.source.pr, 366);
assert.equal(index.source.headRevision, "cc47f2ca9dd5bd783020ea2e2a6a09d5deb25f18");
assert.equal(index.source.artifactId, 9739867022);
assert.equal(
  index.source.artifactArchiveSha256,
  "77d4bc569f8459011c6989d5e5d304125b16422588d5196d7903f1ef269520d9",
);

assert.equal(index.corpus.sourceRecordCount, 82413);
assert.equal(index.corpus.classifiedCandidateCount, 31779);
assert.equal(index.corpus.governedHoldCount, 355);
assert.equal(index.corpus.recursiveProvenanceCount, 50279);
assert.equal(index.totals.canonicalBuildOrderCount, 279);
assert.equal(index.totals.groupedCandidateCount, 31779);
assert.equal(index.totals.awaitingOwnerCount, 279);
assert.equal(index.totals.executionReadyCount, 0);
assert.equal(index.totals.agentGrantIssuedCount, 0);
assert.equal(index.orders.length, 279);
assert.equal(index.moduleSummary.reduce((sum, row) => sum + row.buildOrderCount, 0), 279);
assert.equal(index.moduleSummary.reduce((sum, row) => sum + row.memberCount, 0), 31779);

const ids = new Set();
const digests = new Set();
let groupedMembers = 0;
for (const [offset, order] of index.orders.entries()) {
  assert.equal(order.buildOrderOrdinal, offset + 1);
  assert.match(order.buildOrderId, /^recovery_build_order_[0-9a-f]{64}$/);
  assert.match(order.buildOrderDigest, /^[0-9a-f]{64}$/);
  assert.match(order.membership.orderedMemberWorkUnitIdFingerprint, /^[0-9a-f]{64}$/);
  assert.equal(order.sovereignDisposition, "awaiting_owner");
  assert.equal(order.implementationState, "IDEA");
  assert.equal(order.ownerApprovalRequired, true);
  assert.equal(order.technologyReadiness, "hold");
  for (const field of [
    "executionAuthority",
    "codeMutationAuthority",
    "productionWriteAuthority",
    "mergeAuthority",
    "deploymentAuthority",
    "publicExposureAuthority",
    "releaseAuthority",
  ]) {
    assert.equal(order[field], false, `${field} must remain false for order ${order.buildOrderOrdinal}`);
  }
  assert.ok(order.route.module.trim());
  assert.ok(order.route.subsystem.trim());
  assert.ok(order.route.capability.trim());
  assert.ok(order.route.canonicalTarget.trim());
  assert.ok(Number.isInteger(order.membership.memberCount) && order.membership.memberCount > 0);
  groupedMembers += order.membership.memberCount;
  assert.equal(ids.has(order.buildOrderId), false, "Build-order IDs must be unique.");
  assert.equal(digests.has(order.buildOrderDigest), false, "Build-order digests must be unique.");
  ids.add(order.buildOrderId);
  digests.add(order.buildOrderDigest);
}
assert.equal(groupedMembers, 31779);
assert.equal(index.authority.visibility, "founder_only");
for (const [key, value] of Object.entries(index.authority)) {
  if (["visibility", "analysis", "planning"].includes(key)) continue;
  assert.equal(value, false, `Index authority ${key} must remain false.`);
}
assert.equal(index.completion, false);

const generatedManifest = await readFile(join(generatedRoot, "manifest.json"));
const generatedOrdersText = await readFile(join(generatedRoot, "sovereign-build-orders.ndjson"), "utf8");
assert.equal(
  createHash("sha256").update(generatedManifest).digest("hex"),
  index.source.sourceManifestSha256,
  "Committed index must bind the freshly generated dispatch manifest.",
);
assert.equal(
  createHash("sha256").update(generatedOrdersText).digest("hex"),
  index.source.sourceBuildOrderLedgerSha256,
  "Committed index must bind the freshly generated build-order ledger.",
);
const generatedOrders = generatedOrdersText.trim().split("\n").map(JSON.parse);
assert.equal(generatedOrders.length, index.orders.length);
for (let offset = 0; offset < generatedOrders.length; offset += 1) {
  const generated = generatedOrders[offset];
  const committed = index.orders[offset];
  assert.equal(committed.buildOrderId, generated.buildOrderId);
  assert.equal(committed.buildOrderDigest, generated.buildOrderDigest);
  assert.deepEqual(committed.route, generated.route);
  assert.deepEqual(committed.membership, generated.membership);
}

const page = await readFile(
  join(root, "app/owner/control/implementation/recovery-build-orders/page.tsx"),
  "utf8",
);
assert.ok(page.includes("requireFounderIdentity"), "Build-order surface must require founder identity.");
assert.ok(page.includes('currentLevel !== "aal2"'), "Build-order surface must require AAL2 MFA.");
assert.ok(page.includes('dynamic = "force-dynamic"'), "Build-order surface must never be statically exposed.");
assert.ok(
  page.includes("sovereign-build-order-index-v1.json"),
  "Build-order surface must read the exact committed index.",
);
assert.ok(
  page.includes("Authority remains fail-closed") && page.includes("execution"),
  "Build-order surface must state that review grants no execution authority.",
);

const parentPage = await readFile(join(root, "app/owner/control/implementation/page.tsx"), "utf8");
assert.ok(
  parentPage.includes('href="/owner/control/implementation/recovery-build-orders"'),
  "Implementation Truth must link to the founder-only build-order surface.",
);

console.log("PANTAVION OWNER BUILD ORDER SURFACE: PASSED");
console.log("- exact 82,413-record corpus boundary");
console.log("- 279 unique owner-gated build orders covering 31,779 classified members");
console.log("- exact artifact, manifest, ledger, route, membership and receipt bindings");
console.log("- zero execution, agent-grant, production, merge, deployment or release authority");
console.log("- founder identity + AAL2 server-side surface protection");
