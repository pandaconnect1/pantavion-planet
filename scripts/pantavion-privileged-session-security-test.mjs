import assert from "node:assert/strict";

import {
  createWaterAdminSessionValue,
  getWaterAdminAccessCode,
  getWaterAdminSessionSecret,
  hasDedicatedWaterAdminSessionSecret,
  hasWaterAdminSession,
  validateWaterAdminSessionValue,
  WATER_ADMIN_SESSION_COOKIE,
  WATER_ADMIN_SESSION_TTL_SECONDS,
  WATER_ADMIN_SESSION_VERSION,
} from "../core/security/water-admin-session.ts";

const saved = {
  access: process.env.PANTAVION_WATER_ADMIN_ACCESS_CODE,
  founder: process.env.PANTAVION_WATER_FOUNDER_ACCESS_CODE,
  admin: process.env.PANTAVION_ADMIN_ACCESS_CODE,
  session: process.env.PANTAVION_WATER_ADMIN_SESSION_SECRET,
};

try {
  process.env.PANTAVION_WATER_ADMIN_ACCESS_CODE = "test-access-code";
  delete process.env.PANTAVION_WATER_FOUNDER_ACCESS_CODE;
  delete process.env.PANTAVION_ADMIN_ACCESS_CODE;
  process.env.PANTAVION_WATER_ADMIN_SESSION_SECRET = "test-dedicated-session-secret-which-is-separate";

  assert.equal(getWaterAdminAccessCode(), "test-access-code");
  assert.equal(hasDedicatedWaterAdminSessionSecret(), true);
  assert.equal(
    getWaterAdminSessionSecret(),
    "test-dedicated-session-secret-which-is-separate",
    "dedicated signing secret must take precedence over access code",
  );

  const now = Date.parse("2026-08-27T16:00:00.000Z");
  const secret = getWaterAdminSessionSecret();
  const tokenA = createWaterAdminSessionValue(secret, now);
  const tokenB = createWaterAdminSessionValue(secret, now);

  assert.equal(tokenA.startsWith(`${WATER_ADMIN_SESSION_VERSION}.`), true);
  assert.notEqual(tokenA, tokenB, "random nonce must prevent deterministic session tokens");

  const valid = validateWaterAdminSessionValue(tokenA, secret, now + 1_000);
  assert.equal(valid.valid, true);
  assert.equal(valid.reason, "ok");
  assert.equal(valid.expiresAt - valid.issuedAt, WATER_ADMIN_SESSION_TTL_SECONDS);

  const tampered = `${tokenA.slice(0, -1)}${tokenA.endsWith("A") ? "B" : "A"}`;
  assert.equal(validateWaterAdminSessionValue(tampered, secret, now + 1_000).valid, false);
  assert.equal(validateWaterAdminSessionValue(tampered, secret, now + 1_000).reason, "signature");

  const expiredAt = now + WATER_ADMIN_SESSION_TTL_SECONDS * 1_000;
  assert.equal(validateWaterAdminSessionValue(tokenA, secret, expiredAt).valid, false);
  assert.equal(validateWaterAdminSessionValue(tokenA, secret, expiredAt).reason, "expired");

  assert.equal(
    validateWaterAdminSessionValue("deadbeef", secret, now).valid,
    false,
    "legacy deterministic session values must be rejected",
  );

  assert.throws(
    () => createWaterAdminSessionValue(secret, now, WATER_ADMIN_SESSION_TTL_SECONDS + 1),
    /invalid_water_admin_session_ttl/,
  );

  const liveToken = createWaterAdminSessionValue(secret);
  const request = new Request("https://pantavion.com/professional/infrastructure/water/admin", {
    headers: { cookie: `${WATER_ADMIN_SESSION_COOKIE}=${encodeURIComponent(liveToken)}` },
  });
  assert.equal(hasWaterAdminSession(request), true);

  const badRequest = new Request("https://pantavion.com/professional/infrastructure/water/admin", {
    headers: { cookie: `${WATER_ADMIN_SESSION_COOKIE}=invalid` },
  });
  assert.equal(hasWaterAdminSession(badRequest), false);

  delete process.env.PANTAVION_WATER_ADMIN_SESSION_SECRET;
  assert.equal(hasDedicatedWaterAdminSessionSecret(), false);
  assert.equal(
    getWaterAdminSessionSecret(),
    "test-access-code",
    "legacy fallback remains only for controlled migration compatibility",
  );

  console.log("Pantavion privileged-session security contract PASSED.");
  console.log("Verified v2 HMAC signature, 2h expiry, nonce uniqueness, tamper rejection, and legacy-token rejection.");
} finally {
  for (const [key, value] of Object.entries({
    PANTAVION_WATER_ADMIN_ACCESS_CODE: saved.access,
    PANTAVION_WATER_FOUNDER_ACCESS_CODE: saved.founder,
    PANTAVION_ADMIN_ACCESS_CODE: saved.admin,
    PANTAVION_WATER_ADMIN_SESSION_SECRET: saved.session,
  })) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
}
