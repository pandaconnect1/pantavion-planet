import assert from "node:assert/strict";
import {
  answerWithOwnedInference,
  getOwnedInferenceConfig,
} from "../core/ai/pantavion-owned-inference.ts";

const env = {
  PANTAVION_OWNED_AI_BASE_URL: "http://pantavion-model.internal:8080",
  PANTAVION_OWNED_AI_MODEL: "pantavion-approved-model",
};
const config = getOwnedInferenceConfig(env);
assert.ok(config);
assert.equal(config.endpoint, "http://pantavion-model.internal:8080/v1/chat/completions");
assert.equal(config.model, "pantavion-approved-model");
assert.equal(config.bearerToken, "");

for (const badUrl of [
  "https://api.openai.com",
  "https://pantavion-model.internal.evil.test",
  "ftp://pantavion-model.internal",
  "http://evil.com",
  "http://pantavion-model.internal:8080@evil.com",
]) {
  assert.equal(
    getOwnedInferenceConfig({ ...env, PANTAVION_OWNED_AI_BASE_URL: badUrl }),
    null,
    `Unowned origin accepted: ${badUrl}`,
  );
}
assert.equal(getOwnedInferenceConfig({ PANTAVION_OWNED_AI_MODEL: "local" }), null);
assert.equal(
  getOwnedInferenceConfig({ ...env, PANTAVION_OWNED_AI_BASE_URL: "https://ai.pantavion.com" })?.endpoint,
  "https://ai.pantavion.com/v1/chat/completions",
);

const originalFetch = globalThis.fetch;
try {
  globalThis.fetch = async (url, options) => {
    assert.equal(url, config.endpoint);
    assert.equal(options.method, "POST");
    assert.equal(options.headers.Authorization, undefined);
    const body = JSON.parse(options.body);
    assert.equal(body.model, "pantavion-approved-model");
    assert.deepEqual(body.messages.map((item) => item.role), ["system", "user"]);
    assert.equal(body.messages[1].content, "γεια");
    return new Response(JSON.stringify({ choices: [{ message: { content: "Καλησπέρα!" } }] }), { status: 200 });
  };
  const response = await answerWithOwnedInference(config, "γεια", "Be helpful");
  assert.equal(response, "Καλησπέρα!");

  globalThis.fetch = async () => new Response(JSON.stringify({ error: "internal detail" }), { status: 503 });
  await assert.rejects(answerWithOwnedInference(config, "γεια", "Be helpful"), /PANTAVION_OWNED_AI_UPSTREAM_UNAVAILABLE/);
} finally {
  globalThis.fetch = originalFetch;
}
console.log("pantavion-owned-inference: passed");
