import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { canUsePantaAiAssistant, PANTAVION_AI_ASSISTANTS } from "../core/ai/pantavion-ai-command-center.ts";

assert.equal(canUsePantaAiAssistant("publicGuide", false), true);
assert.equal(canUsePantaAiAssistant("sosLanguageGuardian", false), true);
assert.equal(canUsePantaAiAssistant("workIncomeAssistant", false), true);
assert.equal(canUsePantaAiAssistant("creatorMediaAssistant", false), true);
assert.equal(canUsePantaAiAssistant("personalUserAssistant", false), false);
assert.equal(canUsePantaAiAssistant("personalUserAssistant", true), true);
assert.equal(canUsePantaAiAssistant("internalGuardian", false), false);
assert.equal(canUsePantaAiAssistant("internalGuardian", true), false);
for (const invalid of ["constructor", "__proto__", "toString", "ghost", "", null, {}, 42]) {
  assert.equal(canUsePantaAiAssistant(invalid, true), false, String(invalid));
}
assert.equal(PANTAVION_AI_ASSISTANTS.internalGuardian.visibleToPublic, false);

const source = readFileSync("app/api/pantavion/ai/route.ts", "utf8");
assert.match(source, /canUsePantaAiAssistant\(assistantKey, false\)/);
assert.match(source, /supabase\.auth\.getUser\(\)/);
assert.match(source, /canUsePantaAiAssistant\(assistantKey, authenticated\)/);
assert.match(source, /PANTAVION_AI_ASSISTANT_FORBIDDEN/);
assert.match(source, /AbortSignal\.timeout/);
assert.doesNotMatch(source, /providerResponse\s*:/);
console.log("Pantavion public AI privilege boundary: PASS");
