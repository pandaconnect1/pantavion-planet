import { activateEphemeralAgent, canAgentUseCapability, createEphemeralAgent } from "../core/sovereign/ephemeral-agent-swarm.ts";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const created = createEphemeralAgent({
  id: "agent_expiry_test",
  parentIntentId: "intent_expiry_test",
  role: "verifier",
  capabilities: [
    { capability: "classify", scope: "recovery/corpus", expiresAt: "2026-08-28T20:00:00.000Z" },
  ],
  budget: 2,
  createdAt: "2026-08-27T20:00:00.000Z",
  expiresAt: "2026-08-28T20:00:00.000Z",
});

assert(
  !canAgentUseCapability(created, "classify", "recovery/corpus", new Date("2026-08-27T21:00:00.000Z")),
  "A created ephemeral agent must not execute before activation.",
);

const active = activateEphemeralAgent(created, new Date("2026-08-27T21:00:00.000Z"));
assert(
  canAgentUseCapability(active, "classify", "recovery/corpus", new Date("2026-08-27T21:00:00.000Z")),
  "An activated agent must use its explicitly granted capability and scope.",
);
assert(
  !canAgentUseCapability(active, "classify", "recovery/other", new Date("2026-08-27T21:00:00.000Z")),
  "An activated agent must not escape its granted scope.",
);
assert(
  !canAgentUseCapability(active, "classify", "recovery/corpus", new Date("2026-08-28T20:00:01.000Z")),
  "An expired ephemeral agent capability must fail closed.",
);
assert(
  !canAgentUseCapability(active, "classify", "recovery/corpus", new Date("2026-08-29T00:00:00.000Z")),
  "An agent beyond its lifetime must fail closed.",
);

console.log("sovereign ephemeral-agent expiry boundary: ok");
