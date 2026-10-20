import assert from "node:assert/strict";
import { test } from "node:test";
import { createOpenAICompatibleAgentAdapter } from "../core/agents/pantavion-openai-compatible-adapter.ts";

const base = {
  id: "test-provider",
  endpoint: "https://api.openai.com/v1/chat/completions",
  model: "test-model",
  apiKey: "fake-test-key",
};
const request = {
  jobId: "job-1", systemPolicy: "Do not write production data",
  objective: "Analyze one read-only capability", evidenceRefs: ["evidence-1"],
  maxOutputTokens: 512,
};
test("refuses unapproved provider host and path", () => {
  for (const endpoint of [
    "https://evil.example/v1/chat/completions",
    "http://api.openai.com/v1/chat/completions",
    "https://api.openai.com/other",
    "https://api.openai.com/v1/chat/completions?redirect=true",
    "https://api.openai.com:8443/v1/chat/completions",
  ]) {
    assert.throws(() => createOpenAICompatibleAgentAdapter({...base, endpoint}));
  }
});
test("requires configured credentials", async () => {
  const adapter = createOpenAICompatibleAgentAdapter({...base, apiKey: undefined});
  assert.equal(await adapter.isConfigured(), false);
  await assert.rejects(adapter.infer(request), /not configured/);
});
test("sends bounded model request and returns evidence", async () => {
  let seen = false;
  const adapter = createOpenAICompatibleAgentAdapter({
    ...base,
    fetchImpl: async (url, init) => {
      seen = true;
      assert.equal(url, base.endpoint);
      assert.equal(init?.redirect, "error");
      assert.equal(init?.cache, "no-store");
      const payload = JSON.parse(String(init?.body));
      assert.equal(payload.model, base.model);
      assert.equal(payload.max_tokens, 512);
      assert.equal(payload.messages[1].role, "user");
      return new Response(JSON.stringify({
        choices: [{message: {content: "Evidence-backed result"}}],
        usage: {prompt_tokens: 10, completion_tokens: 4},
      }), {status: 200});
    },
  });
  const result = await adapter.infer(request);
  assert.equal(seen, true);
  assert.equal(result.output, "Evidence-backed result");
  assert.equal(result.usage?.outputTokens, 4);
});
test("redacts provider response bodies from errors", async () => {
  const adapter = createOpenAICompatibleAgentAdapter({
    ...base,
    fetchImpl: async () => new Response("private-secret", {status: 503}),
  });
  await assert.rejects(adapter.infer(request), error => {
    assert.match(error.message, /503/);
    assert.doesNotMatch(error.message, /private-secret/);
    return true;
  });
});
test("rejects oversized objectives without network call", async () => {
  const adapter = createOpenAICompatibleAgentAdapter({
    ...base,
    fetchImpl: async () => { throw Error("network called"); },
  });
  await assert.rejects(adapter.infer({...request,objective: "x".repeat(24001)}), /size limit/);
});
