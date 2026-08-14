#!/usr/bin/env node

const assert = require("node:assert/strict");
const path = require("node:path");

const ROOT = process.cwd();
const routePath = path.join(ROOT, ".next/server/app/api/translate/universal/route.js");
const isolatedKeys = [
  "PANTAVION_TRANSLATE_PROVIDER",
  "PANTAVION_TRANSLATE_ENDPOINT",
  "PANTAVION_TRANSLATE_API_KEY",
  "PANTAVION_TRANSLATE_ALLOW_PUBLIC_FALLBACK",
  "DEEPL_API_KEY",
  "GOOGLE_TRANSLATE_API_KEY",
  "AZURE_TRANSLATOR_KEY",
  "AZURE_TRANSLATOR_REGION",
];

async function post(route, body) {
  const response = await route.routeModule.userland.POST(
    new Request("http://localhost/api/translate/universal", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
  );

  return response.json();
}

async function main() {
  const originalEnvironment = new Map(isolatedKeys.map((key) => [key, process.env[key]]));

  try {
    for (const key of isolatedKeys) delete process.env[key];

    const route = require(routePath);
    const defaultResult = await post(route, {
      text: "No external request should be made in this test.",
      sourceLanguage: "en",
      targetLanguage: "el",
    });
    assert.equal(defaultResult.status, "provider_pending");
    assert.equal(defaultResult.provider, "provider_not_configured");

    process.env.PANTAVION_TRANSLATE_PROVIDER = "mymemory";
    const disabledFallbackResult = await post(route, {
      text: "No external request should be made in this test.",
      sourceLanguage: "en",
      targetLanguage: "el",
    });
    assert.equal(disabledFallbackResult.status, "provider_pending");
    assert.match(disabledFallbackResult.message, /Public translation fallback is disabled/);

    console.log("PASS: compiled public translation fallback stays disabled without explicit opt-in; no provider request made.");
  } finally {
    for (const key of isolatedKeys) {
      const value = originalEnvironment.get(key);
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
