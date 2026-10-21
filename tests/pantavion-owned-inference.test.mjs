import assert from "node:assert/strict";
import { getOwnedInferenceConfig, answerWithOwnedInference } from "../core/ai/pantavion-owned-inference.ts";

const env = {
  PANTAVION_OWNED_AI_BASE_URL: "http://pantavion-owned-ai:10000",
  PANTAVION_OWNED_AI_MODEL: "pantavion-local",
  PANTAVION_OWNED_AI_BEARER_TOKEN: "test-only-key",
};
const config = getOwnedInferenceConfig(env);
assert.ok(config, "Expected a valid private model config");
assert.equal(config.endpoint, "http://pantavion-owned-ai:10000/v1/chat/completions");
assert.equal(config.model, "pantavion-local");
assert.equal(config.bearerToken, "test-only-key");
for (const invalid of [
  "https://api.openai.com",
  "https://ai.gateway.vercel.com",
  "http://pantavion-owned-ai.evil.com",
  "http://evil.internal",
  "http://pantavion-owned-ai:10000@evil.com",
  "file:///etc/passwd",
  "http://pantavion-owned-ai:10000/private",
]) {
  assert.equal(getOwnedInferenceConfig({ ...env, PANTAVION_OWNED_AI_BASE_URL: invalid }), null, invalid);
}
assert.equal(getOwnedInferenceConfig({ ...env, PANTAVION_OWNED_AI_BEARER_TOKEN: "" }), null);
assert.equal(getOwnedInferenceConfig({ ...env, PANTAVION_OWNED_AI_MODEL: "" }), null);
const originalFetch = globalThis.fetch;
try {
  globalThis.fetch = async (url, options) => {
    assert.equal(url, config.endpoint);
    assert.equal(options.method, "POST");
    assert.equal(options.headers.Authorization, "Bearer test-only-key");
    assert.equal(options.redirect, "error");
    const request = JSON.parse(options.body);
    assert.equal(request.model, "pantavion-local");
    assert.deepEqual(request.messages.map(x => x.role), ["system", "user"]);
    assert.equal(request.messages[1].content, "Γεια");
    return new Response(JSON.stringify({ choices: [{ message: { content: "Καλησπέρα" } }] }), { status: 200 });
  };
  assert.equal(await answerWithOwnedInference(config, "Γεια", "Helpful assistant"), "Καλησπέρα");
  globalThis.fetch = async () => new Response(JSON.stringify({ error: "sensitive" }), { status: 403 });
  await assert.rejects(answerWithOwnedInference(config, "Γεια", "Helpful assistant"), /PANTAVION_OWNED_AI_UPSTREAM_UNAVAILABLE/);
} finally {
  globalThis.fetch = originalFetch;
}
console.log("Pantavion private owned inference contract: PASSED");
