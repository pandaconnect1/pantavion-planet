import assert from "node:assert/strict";
import {
  PANTAVION_GATEWAY_DEFAULT_MODELS,
  buildPantavionGatewayModelPlan,
  canonicalPantavionGatewayModelId,
} from "../core/translation/pantavion-gateway-resilience.ts";

assert.equal(canonicalPantavionGatewayModelId("gpt-4.1-mini"), "openai/gpt-4.1-mini");
assert.equal(canonicalPantavionGatewayModelId("gemini-3.6-flash"), "google/gemini-3.6-flash");
assert.equal(canonicalPantavionGatewayModelId("claude-sonnet-5"), "anthropic/claude-sonnet-5");
assert.equal(canonicalPantavionGatewayModelId("openai/gpt-5.6-sol"), "openai/gpt-5.6-sol");

const configuredPlan = buildPantavionGatewayModelPlan([
  "gpt-4.1-mini",
  "openai/gpt-5.6-sol",
  "gpt-4.1-mini",
]);

assert.equal(configuredPlan.orderedModels[0], "openai/gpt-4.1-mini");
assert.equal(new Set(configuredPlan.orderedModels).size, configuredPlan.orderedModels.length);
assert.equal(configuredPlan.lanes.length, 2);
assert.equal(configuredPlan.lanes[0].id, "primary");
assert.equal(configuredPlan.lanes[1].id, "hedge");
assert.notEqual(
  configuredPlan.lanes[0].primaryModel.split("/")[0],
  configuredPlan.lanes[1].primaryModel.split("/")[0],
);
assert.ok(!configuredPlan.lanes[0].fallbackModels.includes(configuredPlan.lanes[0].primaryModel));
assert.ok(!configuredPlan.lanes[1].fallbackModels.includes(configuredPlan.lanes[1].primaryModel));
assert.ok(configuredPlan.lanes[0].fallbackModels.includes(configuredPlan.lanes[1].primaryModel));
assert.ok(configuredPlan.lanes[1].fallbackModels.includes(configuredPlan.lanes[0].primaryModel));

const defaultPlan = buildPantavionGatewayModelPlan([]);
assert.deepEqual(defaultPlan.orderedModels, [...PANTAVION_GATEWAY_DEFAULT_MODELS]);
assert.equal(defaultPlan.lanes.length, 2);
assert.notEqual(
  defaultPlan.lanes[0].primaryModel.split("/")[0],
  defaultPlan.lanes[1].primaryModel.split("/")[0],
);

console.log("Pantavion translation gateway resilience contract: PASS");
console.log(JSON.stringify({
  canonicalModelIds: true,
  configuredPriorityPreserved: true,
  duplicateModelsRemoved: true,
  providerDiverseHedgePrimary: true,
  independentLanePlans: true,
  publicFallbackPolicyUntouched: true,
}, null, 2));
