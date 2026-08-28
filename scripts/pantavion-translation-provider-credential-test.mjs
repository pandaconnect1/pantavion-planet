import assert from "node:assert/strict";
import { getPantavionTranslationProviderStatus } from "../core/translation/pantavion-translation-provider-adapters.ts";

const keys = [
  "PANTAVION_TRANSLATE_PROVIDER",
  "PANTAVION_TRANSLATE_ENDPOINT",
  "PANTAVION_TRANSLATE_API_KEY",
  "DEEPL_API_KEY",
  "GOOGLE_TRANSLATE_API_KEY",
  "AZURE_TRANSLATOR_KEY",
  "AZURE_TRANSLATOR_REGION",
];

const original = Object.fromEntries(keys.map((key) => [key, process.env[key]]));

function clearTranslationEnv() {
  for (const key of keys) delete process.env[key];
}

try {
  clearTranslationEnv();
  process.env.PANTAVION_TRANSLATE_PROVIDER = "google";
  process.env.DEEPL_API_KEY = "deepl-only-test-key";
  assert.equal(getPantavionTranslationProviderStatus().provider, "google");
  assert.equal(getPantavionTranslationProviderStatus().apiKeyConfigured, false);

  process.env.GOOGLE_TRANSLATE_API_KEY = "google-test-key";
  assert.equal(getPantavionTranslationProviderStatus().apiKeyConfigured, true);

  clearTranslationEnv();
  process.env.PANTAVION_TRANSLATE_PROVIDER = "azure";
  process.env.GOOGLE_TRANSLATE_API_KEY = "google-only-test-key";
  assert.equal(getPantavionTranslationProviderStatus().apiKeyConfigured, false);
  process.env.AZURE_TRANSLATOR_KEY = "azure-test-key";
  assert.equal(getPantavionTranslationProviderStatus().apiKeyConfigured, true);

  clearTranslationEnv();
  process.env.PANTAVION_TRANSLATE_PROVIDER = "deepl";
  process.env.AZURE_TRANSLATOR_KEY = "azure-only-test-key";
  assert.equal(getPantavionTranslationProviderStatus().apiKeyConfigured, false);
  process.env.DEEPL_API_KEY = "deepl-test-key";
  assert.equal(getPantavionTranslationProviderStatus().apiKeyConfigured, true);

  clearTranslationEnv();
  process.env.PANTAVION_TRANSLATE_PROVIDER = "google";
  process.env.PANTAVION_TRANSLATE_API_KEY = "explicit-pantavion-override";
  assert.equal(getPantavionTranslationProviderStatus().apiKeyConfigured, true);

  console.log("Pantavion translation provider credential contract: PASS");
  console.log(JSON.stringify({
    crossProviderKeyLeakageBlocked: true,
    providerSpecificKeysBound: true,
    explicitPantavionOverrideSupported: true,
  }, null, 2));
} finally {
  clearTranslationEnv();
  for (const [key, value] of Object.entries(original)) {
    if (typeof value === "string") process.env[key] = value;
  }
}
