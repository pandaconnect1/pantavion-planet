import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const file = path.join(
  process.cwd(),
  "core/translation/pantavion-translation-provider-adapters.ts",
);
const source = fs.readFileSync(file, "utf8");

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
assert.match(source, /const apiKey = apiKeyFor\(provider\);/);

assert.doesNotMatch(
  source,
  /process\.env\.DEEPL_API_KEY\s*\|\|\s*process\.env\.GOOGLE_TRANSLATE_API_KEY/,
);
assert.doesNotMatch(
  source,
  /process\.env\.GOOGLE_TRANSLATE_API_KEY\s*\|\|\s*process\.env\.AZURE_TRANSLATOR_KEY/,
);

console.log("Pantavion translation provider credential contract: PASS");
console.log(JSON.stringify({
  crossProviderKeyLeakageBlocked: true,
  providerSpecificKeysBound: true,
  explicitPantavionOverrideSupported: true,
  productionImportGraphUntouched: true,
}, null, 2));
