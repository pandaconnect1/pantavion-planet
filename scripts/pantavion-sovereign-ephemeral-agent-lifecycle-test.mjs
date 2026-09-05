import { activateEphemeralAgent, canAgentUseCapability, createEphemeralAgent } from "../core/sovereign/ephemeral-agent-swarm.ts";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function expectThrows(operation, message) {
  let threw = false;
  try {
    operation();
  } catch {
    threw = true;
  }
  assert(threw, message);
}

const issuedAt = "2026-08-27T20:00:00.000Z";
const expiresAt = "2026-08-27T21:00:00.000Z";
const agent = createEphemeralAgent({
  id: "agent_lifecycle_1",
  parentIntentId: "intent_lifecycle_1",
  role: "verifier",
  capabilities: [
    { capability: "classify", scope: "recovery/corpus", expiresAt },
    { capability: "read", scope: "recovery/metadata", expiresAt },
  ],
  budget: 2,
  createdAt: issuedAt,
  expiresAt,
});

assert(agent.state === "created", "New ephemeral agent must begin in created state.");
assert(
  !canAgentUseCapability(agent, "classify", "recovery/corpus", new Date("2026-08-27T20:30:00.000Z")),
  "Created ephemeral agent must not use capabilities before explicit activation.",
);

const active = activateEphemeralAgent(agent, new Date("2026-08-27T20:30:00.000Z"));
assert(active.state === "active", "Explicit activation must produce active state.");
assert(
  canAgentUseCapability(active, "classify", "recovery/corpus", new Date("2026-08-27T20:30:00.000Z")),
  "Active ephemeral agent must use only an issued capability and scope.",
);
assert(
  !canAgentUseCapability(active, "classify", "recovery/other", new Date("2026-08-27T20:30:00.000Z")),
  "Capability scope mismatch must fail closed.",
);
assert(
  !canAgentUseCapability(active, "write", "recovery/corpus", new Date("2026-08-27T20:30:00.000Z")),
  "Unissued capability must fail closed.",
);
assert(
  !canAgentUseCapability(active, "classify", "recovery/corpus", new Date("2026-08-27T21:00:00.000Z")),
  "Capability must expire at the boundary.",
);
assert(
  !canAgentUseCapability(active, "classify", "recovery/corpus", new Date("2026-08-27T21:00:01.000Z")),
  "Expired ephemeral agent must fail closed.",
);

expectThrows(
  () => activateEphemeralAgent(active, new Date("2026-08-27T20:45:00.000Z")),
  "An already active ephemeral agent must not be activated twice.",
);

console.log("Sovereign ephemeral-agent lifecycle contract: PASS");
