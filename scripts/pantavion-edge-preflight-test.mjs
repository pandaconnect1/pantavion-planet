import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  EDGE_PREFLIGHT_POLICY,
  EDGE_PREFLIGHT_SCHEMA,
  createFounderEdgePreflight,
  parseEdgePreflight,
} from "../core/sovereign/founder-edge-preflight.ts";

let assertions = 0;
function check(condition, message) {
  assert.ok(condition, message);
  assertions += 1;
}
function equal(actual, expected, message) {
  assert.equal(actual, expected, message);
  assertions += 1;
}
function rejects(input, fragment) {
  assert.throws(() => parseEdgePreflight(input), new RegExp(fragment));
  assertions += 1;
}

const base = {
  taskId: "edge-task-001",
  intentId: "intent-001",
  capability: "verify_evidence",
  payload: { batch: 7, items: ["a", "b"], safe: true },
  deterministic: true,
  reversible: true,
  requiresNetwork: false,
  writesProduction: false,
  issuedAt: "2026-09-09T10:00:00.000Z",
  expiresAt: "2026-09-09T18:00:00.000Z",
  allowedCapabilities: ["verify_evidence"],
  maximumPayloadBytes: 16_384,
  verificationAt: "2026-09-09T12:00:00.000Z",
  consumedDigests: [],
};

const ready = createFounderEdgePreflight(base);
equal(ready.schema, EDGE_PREFLIGHT_SCHEMA, "schema");
equal(ready.policyVersion, EDGE_PREFLIGHT_POLICY, "policy");
equal(ready.preflight.readyForOwnerReview, true, "valid preflight");
equal(ready.preflight.reasons.length, 0, "valid reasons");
check(/^[a-f0-9]{64}$/.test(ready.preflight.payloadDigest ?? ""), "payload digest");
check(/^[a-f0-9]{64}$/.test(ready.receiptSha256), "receipt digest");
equal(ready.handoffIssued, false, "handoff withheld");
equal(ready.assessmentOnly, true, "assessment only");
equal(ready.executionAllowed, false, "execution denied");
equal(ready.productionWriteAllowed, false, "production write denied");
equal(ready.authorizationEffect, "none", "no authorization");

const repeated = createFounderEdgePreflight(structuredClone(base));
equal(repeated.receiptSha256, ready.receiptSha256, "deterministic receipt");
equal(repeated.preflight.payloadDigest, ready.preflight.payloadDigest, "deterministic payload digest");

const reordered = createFounderEdgePreflight({
  ...base,
  payload: { safe: true, items: ["a", "b"], batch: 7 },
});
equal(reordered.preflight.payloadDigest, ready.preflight.payloadDigest, "canonical object keys");

const changed = createFounderEdgePreflight({ ...base, payload: { batch: 8 } });
check(changed.receiptSha256 !== ready.receiptSha256, "payload-bound receipt");

const replay = createFounderEdgePreflight({
  ...base,
  consumedDigests: [ready.preflight.payloadDigest],
});
equal(replay.preflight.readyForOwnerReview, false, "replay blocked");
check(replay.preflight.reasons.includes("packet_replay_detected"), "replay reason");
equal(replay.handoffIssued, false, "replay cannot issue handoff");

const network = createFounderEdgePreflight({ ...base, requiresNetwork: true });
equal(network.preflight.readyForOwnerReview, false, "network dependency blocked");
check(network.preflight.reasons[0].includes("cannot_require_network_access"), "network reason");
equal(network.executionAllowed, false, "network failure cannot execute");

const production = createFounderEdgePreflight({ ...base, writesProduction: true });
equal(production.preflight.readyForOwnerReview, false, "production write blocked");
check(production.preflight.reasons[0].includes("cannot_write_production"), "production reason");

const irreversible = createFounderEdgePreflight({ ...base, reversible: false });
check(irreversible.preflight.reasons[0].includes("must_be_reversible"), "rollback reason");

const nondeterministic = createFounderEdgePreflight({ ...base, deterministic: false });
check(nondeterministic.preflight.reasons[0].includes("must_be_deterministic"), "determinism reason");

const expired = createFounderEdgePreflight({
  ...base,
  verificationAt: "2026-09-09T18:00:00.000Z",
});
check(expired.preflight.reasons.includes("packet_expired"), "expiry reason");

const tooLargePolicy = createFounderEdgePreflight({ ...base, maximumPayloadBytes: 1 });
check(tooLargePolicy.preflight.reasons[0].includes("payload_exceeds_policy"), "payload policy reason");

rejects(null, "object_required");
rejects({ ...base, extra: true }, "unknown_field");
rejects({ ...base, payload: [] }, "payload_object_required");
rejects({ ...base, allowedCapabilities: [] }, "allowedCapabilities");
rejects({ ...base, allowedCapabilities: ["x", "x"] }, "allowedCapabilities");
rejects({ ...base, maximumPayloadBytes: 16_385 }, "maximumPayloadBytes");
rejects({ ...base, maximumPayloadBytes: 10.5 }, "maximumPayloadBytes");
rejects({ ...base, deterministic: "true" }, "deterministic_must_be_boolean");
rejects({ ...base, issuedAt: "invalid" }, "issuedAt");
rejects({ ...base, taskId: "" }, "taskId_length");
rejects({ ...base, payload: { constructor: "blocked" } }, "payload_key");

const route = readFileSync("app/api/owner/edge-preflight/route.ts", "utf8");
check(route.includes("requireFounderIdentity(auth.user.id)"), "API founder gate");
check(route.includes('currentLevel !== "aal2"'), "API AAL2 gate");
check(route.includes("MAX_REQUEST_BYTES = 24_576"), "API request limit");
check(route.includes('"Cache-Control": "no-store, max-age=0"'), "API no-store");
check(!route.includes(".from("), "API has no database mutation");

const page = readFileSync("app/owner/control/edge-preflight/page.tsx", "utf8");
check(page.includes("requireFounderIdentity(auth.user.id)"), "page founder gate");
check(page.includes('currentLevel !== "aal2"'), "page AAL2 gate");

const client = readFileSync("app/owner/control/edge-preflight/edge-preflight-client.tsx", "utf8");
check(client.includes('aria-live="polite"'), "accessible result region");
check(client.includes("handoffIssued"), "handoff boundary visible");
check(client.includes("executionAllowed"), "execution boundary visible");
check(client.includes("productionWriteAllowed"), "production boundary visible");

console.log(`Disconnected edge preflight contract: PASS (${assertions} assertions)`);
