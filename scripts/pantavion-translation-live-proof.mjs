import assert from "node:assert/strict";

const base = "https://pantavion.com";
const cases = [
  { sourceLanguage: "el", targetLanguage: "en", text: "Καλημέρα", forbidden: /καλημέρα/i },
  { sourceLanguage: "en", targetLanguage: "el", text: "Good evening", forbidden: /good evening/i },
];

for (const item of cases) {
  const response = await fetch(`${base}/api/pantavion/translate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...item, surface: "pantavion-translate", publicProviderConsent: true }),
    signal: AbortSignal.timeout(45000),
    cache: "no-store",
  });
  const output = await response.json().catch(() => ({}));
  const translated = typeof output.translatedText === "string" ? output.translatedText.trim() : "";
  console.log(JSON.stringify({
    route: "/api/pantavion/translate",
    direction: `${item.sourceLanguage}->${item.targetLanguage}`,
    httpStatus: response.status,
    applicationOk: output.ok === true,
    responseStatus: output.status ?? null,
    provider: output.provider ?? null,
    outputPresent: Boolean(translated),
    outputChanged: Boolean(translated && !item.forbidden.test(translated)),
  }));
  assert.equal(response.status, 200, "Production translation returned non-200");
  assert.equal(output.ok, true, "Production translation did not return ok=true");
  assert.ok(translated, "Production translation returned no translated words");
  assert.doesNotMatch(translated, item.forbidden, "Production translation echoed source language");
}
console.log("PANTAVION LIVE TEXT TRANSLATION: TWO DIRECTIONS VERIFIED");
