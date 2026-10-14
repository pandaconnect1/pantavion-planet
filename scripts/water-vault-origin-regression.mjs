import assert from "node:assert/strict";

import { isAllowedWaterVaultOrigin } from "../core/security/water-vault-origin.ts";

// Canonical Pantavion request can arrive at Next.js via Render's different
// internal host. Origin must be checked against exact trusted browser origins.
assert.equal(isAllowedWaterVaultOrigin("https://pantavion.com", "production"), true);
assert.equal(isAllowedWaterVaultOrigin("https://pantavion-planet.onrender.com", "production"), true);

// Host spoofing, lookalikes, downgrade, trailing paths, and opaque origins fail.
for (const bad of [
  null, "", "null", "https://chatgpt.com", "https://example.com",
  "https://pantavion.com.evil.test", "https://evil.test.pantavion.com",
  "http://pantavion.com", "https://www.pantavion.com",
  "https://pantavion.com:444", "https://pantavion.com/",
  "https://pantavion.com/extra", "https://pantavion.com?x=1",
  "https://pantavion.com#fragment", "https://pantavion.com@evil.test",
  "https://pantavion-planet.onrender.com.evil.test",
  "http://localhost:3000",
]) {
  assert.equal(
    isAllowedWaterVaultOrigin(bad, "production"),
    false,
    `disallowed production Origin: ${bad}`,
  );
}

assert.equal(isAllowedWaterVaultOrigin("http://localhost:3000", "development"), true);
assert.equal(isAllowedWaterVaultOrigin("http://127.0.0.1:3000", "test"), true);
assert.equal(isAllowedWaterVaultOrigin("https://evil.test", "development"), false);

console.log("water vault origin regression: PASS (exact trusted origins, deny by default)");
