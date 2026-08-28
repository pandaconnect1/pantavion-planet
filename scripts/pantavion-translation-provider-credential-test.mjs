import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const adapterFile = path.join(
  process.cwd(),
  "core/translation/pantavion-translation-provider-adapters.ts",
);
const directFile = path.join(
  process.cwd(),
  "core/translation/pantavion-direct-openai-translation.ts",
);
const source = fs.readFileSync(adapterFile, "utf8");
const directSource = fs.readFileSync(directFile, "utf8");

assert.match(
  source,
  /const explicitPantavionOverride = process\.env\.PANTAVION_TRANSLATE_API_KEY \|\| "";/,
);
assert.match(
  source,
  /if \(provider === "deepl"\) return process\.env\.DEEPL_API_KEY \|\| "";/,
);
assert.match(
  source,
  /if \(provider === "google"\) return process\.env\.GOOGLE_TRANSLATE_API_KEY \|\| "";/,
);
assert.match(
  source,
  /if \(provider === "azure"\) return process\.env\.AZURE_TRANSLATOR_KEY \|\| "";/,
);
assert.match(
  source,
  /process\.env\.PANTAVION_OPENAI_API_KEY \|\| process\.env\.OPENAI_API_KEY \|\| ""/,
);
assert.match(
  source,
  /getPantavionDirectOpenAITranslationStatus\(\)\.configured/,
);
assert.match(source, /if \(provider === "openai"\) return callOpenAI\(request\);/);
assert.match(source, /const apiKey = apiKeyFor\(provider\);/);

assert.doesNotMatch(
  source,
  /process\.env\.DEEPL_API_KEY\s*\|\|\s*process\.env\.GOOGLE_TRANSLATE_API_KEY/,
);
assert.doesNotMatch(
  source,
  /process\.env\.GOOGLE_TRANSLATE_API_KEY\s*\|\|\s*process\.env\.AZURE_TRANSLATOR_KEY/,
);
assert.doesNotMatch(
  source,
  /process\.env\.AZURE_TRANSLATOR_KEY\s*\|\|\s*process\.env\.OPENAI_API_KEY/,
);

assert.match(directSource, /https:\/\/api\.openai\.com\/v1\/responses/);
assert.match(directSource, /AbortSignal\.timeout\(DIRECT_OPENAI_TIMEOUT_MS\)/);
assert.match(directSource, /configured: Boolean\(directOpenAIKey\(\)\)/);
assert.doesNotMatch(directSource, /apiKey:\s*directOpenAIKey\(\)/);
assert.doesNotMatch(directSource, /return\s+\{[^}]*apiKey/s);

console.log("Pantavion translation provider credential contract: PASS");
console.log(JSON.stringify({
  crossProviderKeyLeakageBlocked: true,
  providerSpecificKeysBound: true,
  existingOpenAIPrivateKeyPathSupported: true,
  directOpenAISecretNotReturned: true,
  boundedDirectOpenAITimeout: true,
}, null, 2));
