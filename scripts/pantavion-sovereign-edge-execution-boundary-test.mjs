import assert from "node:assert/strict";
import {
  createDisconnectedExecutionPacket,
  verifyDisconnectedExecutionPacket,
} from "../core/sovereign/edge-execution.ts";

const policy = {
  allowedCapabilities: ["local.index"],
  maximumPayloadBytes: 256,
};

const task = {
  id: "edge-task-1",
  intentId: "intent-1",
  capability: "local.index",
  payload: { query: "pantavion", limit: 5 },
  deterministic: true,
  reversible: true,
  requiresNetwork: false,
  writesProduction: false,
  issuedAt: "2026-09-05T20:00:00.000Z",
  expiresAt: "2026-09-05T21:00:00.000Z",
};

const packet = createDisconnectedExecutionPacket(task, policy);
assert.equal(packet.version, "pantavion_edge_execution_v1");
assert.equal(packet.executionMode, "disconnected");
assert.equal(packet.payloadDigest.length, 64);

const valid = verifyDisconnectedExecutionPacket(
  packet,
  "2026-09-05T20:30:00.000Z",
  policy,
);
assert.deepEqual(valid, { valid: true, reasons: [] });

const replay = verifyDisconnectedExecutionPacket(
  packet,
  "2026-09-05T20:30:00.000Z",
  policy,
  new Set([packet.payloadDigest]),
);
assert.equal(replay.valid, false);
assert.ok(replay.reasons.includes("packet_replay_detected"));

const tampered = {
  ...packet,
  task: { ...packet.task, payload: { query: "tampered" } },
};
const tamperResult = verifyDisconnectedExecutionPacket(
  tampered,
  "2026-09-05T20:30:00.000Z",
  policy,
);
assert.equal(tamperResult.valid, false);
assert.ok(tamperResult.reasons.includes("packet_digest_mismatch"));

assert.throws(
  () =>
    createDisconnectedExecutionPacket(
      { ...task, requiresNetwork: true },
      policy,
    ),
  /cannot require network access/,
);
assert.throws(
  () =>
    createDisconnectedExecutionPacket(
      { ...task, writesProduction: true },
      policy,
    ),
  /cannot write production/,
);
assert.throws(
  () =>
    createDisconnectedExecutionPacket(
      { ...task, reversible: false },
      policy,
    ),
  /must be reversible/,
);

const expired = verifyDisconnectedExecutionPacket(
  packet,
  "2026-09-05T21:00:00.000Z",
  policy,
);
assert.equal(expired.valid, false);
assert.ok(expired.reasons.includes("packet_expired"));

console.log("sovereign edge execution boundary contract: PASS");
