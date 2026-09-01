import assert from "node:assert/strict";
import {
  assessFounderIntentFirewall,
  assessFounderTechnologyLibrary,
  createFounderIntentBudgetEnvelope,
  createFounderIntentEdgeHandoff,
  createFounderIntentRecord,
} from "../core/intent/pantavion-founder-intent-workbench.ts";
import {
  createVerifiedFounderEphemeralAgentLease,
  verifyVerifiedFounderEphemeralAgentLease,
} from "../core/intent/pantavion-ephemeral-agent-security.ts";

const input = {
  title: "Secure lease chain",
  desiredOutcome: "Lease creation must require the same verified intent, firewall, edge handoff, and technology assessment.",
  acceptanceEvidence: "Unrelated or tampered technology assessments fail closed.",
  module: "disconnected_edge",
  priority: "high",
  maxActions: 8,
  maxMinutes: 120,
};
const record = await createFounderIntentRecord({ input, id: "11111111-2222-4333-8444-555555555555", createdAt: "2026-09-02T00:00:00.000Z" });
const firewall = await assessFounderIntentFirewall(record);
const budget = await createFounderIntentBudgetEnvelope(record);
const handoff = await createFounderIntentEdgeHandoff({ record, assessment: firewall, budget, nonce: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", createdAt: "2026-09-02T00:01:00.000Z" });
const technology = await assessFounderTechnologyLibrary(record, handoff);
const lease = await createVerifiedFounderEphemeralAgentLease({ record, firewall, budget, handoff, technology, agentId: "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee" });
assert.equal(await verifyVerifiedFounderEphemeralAgentLease({ record, firewall, budget, handoff, technology, lease }), true);
assert.equal(await verifyVerifiedFounderEphemeralAgentLease({ record, firewall, budget, handoff, technology: { ...technology, edgeHandoffSha256: "0".repeat(64) }, lease }), false);
assert.equal(await verifyVerifiedFounderEphemeralAgentLease({ record, firewall, budget, handoff: { ...handoff, sha256: "0".repeat(64) }, technology, lease }), false);
console.log(JSON.stringify({ marker: "pantavion_ephemeral_agent_security_test_v1", status: "passed", assertions: 3, syntheticRecordsCountedAsImplementation: 0 }, null, 2));
