import { createHmac, randomBytes, timingSafeEqual } from "crypto";

export const WATER_ADMIN_SESSION_COOKIE = "pantavion_water_admin_session";
export const WATER_ADMIN_SESSION_VERSION = "v2";
export const WATER_ADMIN_SESSION_TTL_SECONDS = 60 * 60 * 2;

const SESSION_CONTEXT = "pantavion-water-admin-session-v2";
const CLOCK_SKEW_SECONDS = 60;
const LEGACY_ACCESS_CODE_ENV_KEYS = [
  "PANTAVION_WATER_ADMIN_ACCESS_CODE",
  "PANTAVION_WATER_FOUNDER_ACCESS_CODE",
  "PANTAVION_ADMIN_ACCESS_CODE",
] as const;

function clean(value: unknown, maxLength = 1000) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function firstConfiguredEnvironmentValue(keys: readonly string[]) {
  for (const key of keys) {
    const value = clean(process.env[key]);
    if (value) return value;
  }

  return "";
}

export function getWaterAdminAccessCode() {
  return firstConfiguredEnvironmentValue(LEGACY_ACCESS_CODE_ENV_KEYS);
}

export function hasDedicatedWaterAdminSessionSecret() {
  return Boolean(clean(process.env.PANTAVION_WATER_ADMIN_SESSION_SECRET));
}

export function getWaterAdminSessionSecret() {
  return (
    clean(process.env.PANTAVION_WATER_ADMIN_SESSION_SECRET) ||
    firstConfiguredEnvironmentValue(LEGACY_ACCESS_CODE_ENV_KEYS)
  );
}

export function safeSecretEqual(leftValue: string, rightValue: string) {
  const left = Buffer.from(leftValue);
  const right = Buffer.from(rightValue);

  if (left.length !== right.length) return false;

  return timingSafeEqual(left, right);
}

function signSessionPayload(secret: string, payload: string) {
  return createHmac("sha256", secret)
    .update(`${SESSION_CONTEXT}:${payload}`)
    .digest("base64url");
}

export function createWaterAdminSessionValue(
  secret: string,
  nowMs = Date.now(),
  ttlSeconds = WATER_ADMIN_SESSION_TTL_SECONDS,
) {
  if (!secret) throw new Error("water_admin_session_secret_required");
  if (!Number.isInteger(ttlSeconds) || ttlSeconds <= 0 || ttlSeconds > WATER_ADMIN_SESSION_TTL_SECONDS) {
    throw new Error("invalid_water_admin_session_ttl");
  }

  const issuedAt = Math.floor(nowMs / 1000);
  const expiresAt = issuedAt + ttlSeconds;
  const nonce = randomBytes(18).toString("base64url");
  const payload = `${issuedAt}.${expiresAt}.${nonce}`;
  const signature = signSessionPayload(secret, payload);

  return `${WATER_ADMIN_SESSION_VERSION}.${payload}.${signature}`;
}

export type WaterAdminSessionValidation = {
  valid: boolean;
  reason:
    | "ok"
    | "missing"
    | "format"
    | "version"
    | "timestamps"
    | "future_issued"
    | "expired"
    | "ttl"
    | "nonce"
    | "signature"
    | "secret";
  issuedAt?: number;
  expiresAt?: number;
};

export function validateWaterAdminSessionValue(
  suppliedSession: string,
  secret = getWaterAdminSessionSecret(),
  nowMs = Date.now(),
): WaterAdminSessionValidation {
  if (!suppliedSession) return { valid: false, reason: "missing" };
  if (!secret) return { valid: false, reason: "secret" };

  const parts = suppliedSession.split(".");
  if (parts.length !== 5) return { valid: false, reason: "format" };

  const [version, issuedRaw, expiresRaw, nonce, signature] = parts;
  if (version !== WATER_ADMIN_SESSION_VERSION) return { valid: false, reason: "version" };

  const issuedAt = Number(issuedRaw);
  const expiresAt = Number(expiresRaw);
  const nowSeconds = Math.floor(nowMs / 1000);

  if (!Number.isSafeInteger(issuedAt) || !Number.isSafeInteger(expiresAt) || expiresAt <= issuedAt) {
    return { valid: false, reason: "timestamps" };
  }
  if (issuedAt > nowSeconds + CLOCK_SKEW_SECONDS) {
    return { valid: false, reason: "future_issued", issuedAt, expiresAt };
  }
  if (expiresAt <= nowSeconds) {
    return { valid: false, reason: "expired", issuedAt, expiresAt };
  }
  if (expiresAt - issuedAt > WATER_ADMIN_SESSION_TTL_SECONDS) {
    return { valid: false, reason: "ttl", issuedAt, expiresAt };
  }
  if (!/^[A-Za-z0-9_-]{20,64}$/.test(nonce)) {
    return { valid: false, reason: "nonce", issuedAt, expiresAt };
  }

  const payload = `${issuedAt}.${expiresAt}.${nonce}`;
  const expectedSignature = signSessionPayload(secret, payload);
  if (!safeSecretEqual(signature, expectedSignature)) {
    return { valid: false, reason: "signature", issuedAt, expiresAt };
  }

  return { valid: true, reason: "ok", issuedAt, expiresAt };
}

function readCookie(request: Request, name: string) {
  const cookieHeader = request.headers.get("cookie") || "";

  for (const part of cookieHeader.split(";")) {
    const [rawName, ...rawValue] = part.trim().split("=");

    if (rawName === name) {
      return decodeURIComponent(rawValue.join("="));
    }
  }

  return "";
}

export function hasWaterAdminSession(request: Request) {
  const suppliedSession = readCookie(request, WATER_ADMIN_SESSION_COOKIE);
  return isWaterAdminSessionValue(suppliedSession);
}

export function isWaterAdminSessionValue(suppliedSession: string) {
  return validateWaterAdminSessionValue(suppliedSession).valid;
}
