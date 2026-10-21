import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { translateExplicitPublicText } from "../core/translation/pantavion-consented-public-text-fallback.ts";

const mock = async (url, options) => {
  const p = new URL(url);
  assert.equal(p.origin, "https://api.mymemory.translated.net");
  assert.equal(p.pathname, "/get");
  assert.equal(p.searchParams.get("q"), "Καλημέρα");
  assert.equal(p.searchParams.get("langpair"), "el|en");
  assert.equal(options.method, "GET");
  assert.equal(options.redirect, "error");
  return new Response(JSON.stringify({ responseStatus: 200, responseData: { translatedText: "Good morning" } }), { status: 200 });
};
const input = { text: "Καλημέρα", sourceLanguage: "el", targetLanguage: "en", consent: true };
assert.deepEqual(await translateExplicitPublicText(input, mock), {
  translatedText: "Good morning", provider: "mymemory_external_explicit_consent",
});
const neverFetch = () => { throw new Error("Unconsented external request"); };
assert.equal(await translateExplicitPublicText({ ...input, consent: false }, neverFetch), null);
assert.equal(await translateExplicitPublicText({ ...input, sourceLanguage: "auto" }, neverFetch), null);
assert.equal(await translateExplicitPublicText({ ...input, text: "x".repeat(501) }, neverFetch), null);
assert.equal(await translateExplicitPublicText({ ...input, targetLanguage: "http://evil" }, neverFetch), null);
assert.equal(await translateExplicitPublicText(input, async () => new Response("{}", { status: 429 })), null);
const api = readFileSync("app/api/pantavion/translate/route.ts", "utf8");
const ui = readFileSync("app/translate/page.tsx", "utf8");
assert.match(api, /body\.publicProviderConsent === true && body\.surface === "pantavion-translate"/);
assert.match(api, /translateExplicitPublicText/);
assert.match(ui, /publicProviderConsent: publicTextFallbackConsent/);
assert.match(ui, /checked=\{publicTextFallbackConsent\}/);
console.log("Consented public text fallback: PASS");
