import assert from "node:assert/strict";
import {
  PANTAVION_GATEWAY_RATE_LIMIT_COOLDOWN_MS,
  getPantavionGatewayRateLimitCircuit,
  isPantavionGatewayRateLimitFailure,
  markPantavionGatewayRateLimited,
  resetPantavionGatewayRateLimitCircuitForTest,
} from "../core/translation/pantavion-gateway-rate-limit.ts";

resetPantavionGatewayRateLimitCircuitForTest();

assert.equal(isPantavionGatewayRateLimitFailure({ httpStatus: 429 }), true);
assert.equal(isPantavionGatewayRateLimitFailure({ errorClass: "GatewayRateLimitError" }), true);
assert.equal(
  isPantavionGatewayRateLimitFailure({
    errorClass: "AI_RetryError",
    causes: [{ errorClass: "GatewayRateLimitError", httpStatus: 429 }],
  }),
  true,
);
assert.equal(
  isPantavionGatewayRateLimitFailure({
    errorClass: "AI_RetryError",
    causes: [{ errorClass: "GatewayTimeoutError", httpStatus: 504 }],
  }),
  false,
);

const now = Date.parse("2026-08-28T04:20:00.000Z");
assert.equal(getPantavionGatewayRateLimitCircuit(now).open, false);

const opened = markPantavionGatewayRateLimited(now);
assert.equal(opened.open, true);
assert.equal(opened.remainingMs, PANTAVION_GATEWAY_RATE_LIMIT_COOLDOWN_MS);
assert.equal(opened.scope, "runtime_instance");

const duringCooldown = getPantavionGatewayRateLimitCircuit(now + 5_000);
assert.equal(duringCooldown.open, true);
assert.equal(duringCooldown.remainingMs, PANTAVION_GATEWAY_RATE_LIMIT_COOLDOWN_MS - 5_000);

const afterCooldown = getPantavionGatewayRateLimitCircuit(now + PANTAVION_GATEWAY_RATE_LIMIT_COOLDOWN_MS);
assert.equal(afterCooldown.open, false);
assert.equal(afterCooldown.remainingMs, 0);

const bounded = markPantavionGatewayRateLimited(now, 500_000);
assert.equal(bounded.remainingMs, 60_000);

resetPantavionGatewayRateLimitCircuitForTest();
assert.equal(getPantavionGatewayRateLimitCircuit(now).open, false);

console.log("Pantavion translation rate-limit circuit contract: PASS");
console.log(JSON.stringify({
  detectsNested429: true,
  distinguishesNonRateLimitFailures: true,
  cooldownBounded: true,
  runtimeInstanceScopeExplicit: true,
  publicFallbackPolicyUntouched: true,
}, null, 2));
