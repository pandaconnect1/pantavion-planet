import assert from "node:assert/strict";

import {
  createPantavionFounderSessionValue,
  getPantavionFounderAccessCode,
  getPantavionFounderSessionSecret,
  hasDedicatedPantavionFounderSessionSecret,
  safeFounderSecretEqual,
  validatePantavionFounderSessionValue,
  PANTAVION_FOUNDER_SESSION_TTL_SECONDS,
  PANTAVION_FOUNDER_SESSION_VERSION,
} from "../core/security/pantavion-founder-session.ts";

const saved = {
  founderAccess: process.env.PANTAVION_FOUNDER_ACCESS_CODE,
  adminAccess: process.env.PANTAVION_ADMIN_ACCESS_CODE,
  waterAccess: process.env.PANTAVION_WATER_ADMIN_ACCESS_CODE,
  founderSession: process.env.PANTAVION_FOUNDER_SESSION_SECRET,
  adminSession: process.env.PANTAVION_ADMIN_SESSION_SECRET,
  waterSession: process.env.PANTAVION_WATER_ADMIN_SESSION_SECRET,
};

try {
  process.env.PANTAVION_FOUNDER_ACCESS_CODE = "founder-test-access-code";
  process.env.PANTAVION_FOUNDER_SESSION_SECRET =
    "founder-test-session-secret-that-is-distinct-and-long";
  delete process.env.PANTAVION_ADMIN_ACCESS_CODE;
  delete process.env.PANTAVION_ADMIN_SESSION_SECRET;

  assert.equal(getPantavionFounderAccessCode(), "founder-test-access-code");
  assert.equal(hasDedicatedPantavionFounderSessionSecret(), true);
  assert.equal(
    getPantavionFounderSessionSecret(),
    "founder-test-session-secret-that-is-distinct-and-long",
  );
  assert.equal(safeFounderSecretEqual("same-secret", "same-secret"), true);
  assert.equal(safeFounderSecretEqual("same-secret", "other-secret"), false);

  const now = Date.parse("2026-10-01T04:00:00.000Z");
  const secret = getPantavionFounderSessionSecret();
  const tokenA = createPantavionFounderSessionValue(secret, now);
  const tokenB = createPantavionFounderSessionValue(secret, now);

  assert.equal(tokenA.startsWith(`${PANTAVION_FOUNDER_SESSION_VERSION}.`), true);
  assert.notEqual(tokenA, tokenB, "Founder session must use a random nonce");
  assert.equal(validatePantavionFounderSessionValue(tokenA, secret, now + 1000), true);

  const tampered = `${tokenA.slice(0, -1)}${tokenA.endsWith("A") ? "B" : "A"}`;
  assert.equal(validatePantavionFounderSessionValue(tampered, secret, now + 1000), false);

  const expiredAt = now + PANTAVION_FOUNDER_SESSION_TTL_SECONDS * 1000;
  assert.equal(validatePantavionFounderSessionValue(tokenA, secret, expiredAt), false);

  assert.throws(
    () =>
      createPantavionFounderSessionValue(
        secret,
        now,
        PANTAVION_FOUNDER_SESSION_TTL_SECONDS + 1,
      ),
    /invalid_pantavion_founder_session_ttl/,
  );

  delete process.env.PANTAVION_FOUNDER_SESSION_SECRET;
  process.env.PANTAVION_WATER_ADMIN_SESSION_SECRET =
    "migration-fallback-session-secret-is-long-enough";
  assert.equal(hasDedicatedPantavionFounderSessionSecret(), false);
  assert.equal(
    getPantavionFounderSessionSecret(),
    "migration-fallback-session-secret-is-long-enough",
    "existing Water signing secret may be used only as migration fallback",
  );

  console.log("Pantavion Founder session security contract PASSED.");
  console.log("Verified HMAC signature, 2h expiry, nonce uniqueness, tamper rejection, and migration fallback.");
} finally {
  const entries = {
    PANTAVION_FOUNDER_ACCESS_CODE: saved.founderAccess,
    PANTAVION_ADMIN_ACCESS_CODE: saved.adminAccess,
    PANTAVION_WATER_ADMIN_ACCESS_CODE: saved.waterAccess,
    PANTAVION_FOUNDER_SESSION_SECRET: saved.founderSession,
    PANTAVION_ADMIN_SESSION_SECRET: saved.adminSession,
    PANTAVION_WATER_ADMIN_SESSION_SECRET: saved.waterSession,
  };

  for (const [key, value] of Object.entries(entries)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
}
