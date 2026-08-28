import assert from "node:assert/strict";
import {
  PANTAVION_GATEWAY_DEFAULT_MODELS,
  buildPantavionGatewayModelPlan,
  canonicalPantavionGatewayModelId,
} from "../core/translation/pantavion-gateway-resilience.ts";

assert.equal(canonicalPantavionGatewayModelId("gpt-4.1-mini"), "openai/gpt-4.1-mini");
assert.equal(canonicalPantavionGatewayModelId("gemini-3.6-flash"), "google/gemini-3.6-flash");
assert.equal(canonicalPantavionGatewayModelId("claude-sonnet-5"), "anthropic/claude-sonnet-5");

const plan = buildPantavionGatewayModelPlan(
  ["gpt-4.1-mini", "anthropic/claude-sonnet-5", "gpt-4.1-mini"],
  "google/gemini-3.6-flash, openai/gpt-5.6-sol",
);

assert.equal(plan.primaryModel, "openai/gpt-4.1-mini");
assert.equal(new Set(plan.orderedModels).size, plan.orderedModels.length);
assert.ok(plan.fallbackModels.length >= 2);
assert.ok(plan.fallbackModels.some((model) => model.startsWith("google/")));
assert.ok(plan.fallbackModels.some((model) => model.startsWith("anthropic/")));
assert.deepEqual(
  buildPantavionGatewayModelPlan([], "").orderedModels,
  [...PANTAVION_GATEWAY_DEFAULT_MODELS],
);

console.log("Pantavion translation gateway resilience contract: PASS");
