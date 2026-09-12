import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

import { createPantavionRecoveryBuildReadinessIndex } from "../core/recovery/pantavion-recovery-build-readiness.ts";

const buildOrderIndex = JSON.parse(
  await readFile("data/recovery/sovereign-build-order-index-v1.json", "utf8"),
);
const committed = JSON.parse(
  await readFile("data/recovery/sovereign-build-readiness-index-v1.json", "utf8"),
);

const regenerated = createPantavionRecoveryBuildReadinessIndex({
  source: committed.source,
  corpus: buildOrderIndex.corpus,
  orders: buildOrderIndex.orders,
});
assert.deepEqual(regenerated, committed, "Committed readiness index must equal exact regeneration.");

function canonicalJson(value) {
  if (value === null) return "null";
  if (typeof value === "string" || typeof value === "boolean") return JSON.stringify(value);
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Error("non_finite_readiness_value");
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) return "[" + value.map(canonicalJson).join(",") + "]";
  if (typeof value === "object") {
    const entries = Object.entries(value)
      .filter(([, entry]) => entry !== undefined)
      .sort(([left], [right]) => left.localeCompare(right));
    return "{" + entries
      .map(([key, entry]) => JSON.stringify(key) + ":" + canonicalJson(entry))
      .join(",") + "}";
  }
  throw new Error("unsupported_readiness_value");
}

const { indexDigest, ...unsigned } = committed;
assert.equal(
  createHash("sha256").update(canonicalJson(unsigned)).digest("hex"),
  indexDigest,
  "Readiness index digest must bind the exact canonical payload.",
);
assert.equal(committed.marker, "pantavion_recovery_build_readiness_index_v1");
assert.equal(committed.source.buildOrderIndexDigest, buildOrderIndex.indexDigest);
assert.equal(committed.corpus.sourceRecordCount, 82413);
assert.equal(committed.corpus.classifiedCandidateCount, 31779);
assert.equal(committed.corpus.nonExecutablePreservedCount, 50634);
assert.equal(committed.totals.readinessPacketCount, 279);
assert.equal(committed.totals.groupedCandidateCount, 31779);
assert.equal(committed.totals.technologyHoldCount, 279);
assert.equal(committed.totals.ownerDecisionRequiredCount, 279);
assert.equal(committed.totals.agentGrantIssuedCount, 0);
assert.equal(committed.totals.edgeEligibleCount, 0);
assert.equal(committed.totals.executionReadyCount, 0);
assert.equal(committed.packets.length, 279);

const orderById = new Map(buildOrderIndex.orders.map((order) => [order.buildOrderId, order]));
const packetIds = new Set();
let previous = null;
for (const [offset, packet] of committed.packets.entries()) {
  const order = orderById.get(packet.buildOrderId);
  assert.ok(order, "Every readiness packet must bind one exact build order.");
  assert.equal(packet.buildOrderOrdinal, offset + 1);
  assert.equal(packet.buildOrderDigest, order.buildOrderDigest);
  assert.deepEqual(packet.route, order.route);
  assert.deepEqual(packet.membership, order.membership);
  assert.equal(packet.currentImplementationState, "IDEA");
  assert.equal(packet.previousReadinessDigest, previous);
  assert.match(packet.readinessDigest, /^[0-9a-f]{64}$/);
  assert.equal(packet.technology.assessment.readiness, "hold");
  assert.ok(packet.technology.assessment.blockers.length >= 1);
  assert.equal(packet.technology.assessment.deploymentAuthorized, false);
  assert.equal(packet.agent.state, "not_issued");
  assert.equal(packet.agent.requestedBudgetLimit, 0);
  assert.equal(packet.ownerControl.state, "awaiting_owner");
  assert.equal(packet.ownerControl.approvalRecorded, false);
  assert.equal(packet.disconnectedEdge.eligible, false);
  assert.equal(packet.disconnectedEdge.productionWriteAuthorized, false);
  assert.equal(packet.verification.nextPermittedLifecycleStateAfterScopedImplementation, "CODED");
  assert.equal(packet.verification.testedPromotionRequiresExternalEvidence, true);
  for (const [key, value] of Object.entries(packet.authority)) {
    if (key === "analysis" || key === "planning") assert.equal(value, true);
    else assert.equal(value, false, "Readiness packet authority must fail closed: " + key);
  }
  assert.equal(packet.completion, false);
  assert.equal(packetIds.has(packet.buildOrderId), false, "Packet IDs must be unique.");
  packetIds.add(packet.buildOrderId);
  previous = packet.readinessDigest;
}
assert.equal(previous, committed.terminalReadinessDigest);
assert.equal(packetIds.size, buildOrderIndex.orders.length);

const tamperedOrder = {
  ...buildOrderIndex.orders[0],
  codeMutationAuthority: true,
};
assert.throws(
  () => createPantavionRecoveryBuildReadinessIndex({
    source: committed.source,
    corpus: buildOrderIndex.corpus,
    orders: [tamperedOrder, ...buildOrderIndex.orders.slice(1)],
  }),
  /authority_escalation/,
);
assert.throws(
  () => createPantavionRecoveryBuildReadinessIndex({
    source: committed.source,
    corpus: { ...buildOrderIndex.corpus, sourceRecordCount: 82412 },
    orders: buildOrderIndex.orders,
  }),
  /corpus_boundary_mismatch/,
);

console.log("PANTAVION RECOVERY BUILD READINESS: PASSED");
console.log("- 82,413 records preserved under one exact readiness boundary");
console.log("- 279 readiness packets cover all 31,779 classified members exactly once");
console.log("- risk, data class, Technology Library, agent, budget, edge and verification gates materialized");
console.log("- 279 await Founder decision; 0 grants, 0 execution-ready, 0 production authority");
