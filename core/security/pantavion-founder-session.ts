import "server-only";

import { createHmac, randomBytes, timingSafeEqual } from "crypto";

export const PANTAVION_FOUNDER_SESSION_COOKIE = "pantavion_founder_session";
export const PANTAVION_FOUNDER_SESSION_VERSION = "v1";
export const PANTAVION_FOUNDER_SESSION_TTL_SECONDS = 60 * 60 * 2;

const SESSION_CONTEXT = "pantavion-founder-session-v1";
const CLOCK_SKEW_SECONDS = 60;

const FOUNDER_ACCESS_CODE_ENV_KEYS = [
  "PANTAVION_FOUNDER_ACCESS_CODE",
  "PANTAVION_ADMIN_ACCESS_CODE",
  "PANTAVION_WATER_FOUNDER_ACCESS_CODE",
  "PANTAVION_WATER_ADMIN_ACCESS_CODE",
] as const;

const FOUNDER_SESSION_SECRET_ENV_KEYS = [
  "PANTAVION_FOUNDER_SESSION_SECRET",
  "PANTAVION_ADMIN_SESSION_SECRET",
  "PANTAVION_WATER_ADMIN_SESSION_SECRET",
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

export function getPantavionFounderAccessCode() {
  return firstConfiguredEnvironmentValue(FOUNDER_ACCESS_CODE_ENV_KEYS);
}

export function getPantavionFounderSessionSecret() {
  return firstConfiguredEnvironmentValue(FOUNDER_SESSION_SECRET_ENV_KEYS);
}

export function hasDedicatedPantavionFounderSessionSecret() {
  return Boolean(clean(process.env.PANTAVION_FOUNDER_SESSION_SECRET));
}

export function safeFounderSecretEqual(leftValue: string, rightValue: string) {
  const left = Buffer.from(leftValue);
  const right = Buffer.from(rightValue);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

function signPayload(secret: string, payload: string) {
  return createHmac("sha256", secret)
    .update(`${SESSION_CONTEXT}:${payload}`)
    .digest("base64url");
}

export function createPantavionFounderSessionValue(
  secret = getPantavionFounderSessionSecret(),
  nowMs = Date.now(),
  ttlSeconds = PANTAVION_FOUNDER_SESSION_TTL_SECONDS,
) {
  if (!secret) throw new Error("pantavion_founder_session_secret_required");
  if (
    !Number.isInteger(ttlSeconds) ||
    ttlSeconds <= 0 ||
    ttlSeconds > PANTAVION_FOUNDER_SESSION_TTL_SECONDS
  ) {
    throw new Error("invalid_pantavion_founder_session_ttl");
  }

  const issuedAt = Math.floor(nowMs / 1000);
  const expiresAt = issuedAt + ttlSeconds;
  const nonce = randomBytes(18).toString("base64url");
  const payload = `${issuedAt}.${expiresAt}.${nonce}`;
  const signature = signPayload(secret, payload);

  return `${PANTAVION_FOUNDER_SESSION_VERSION}.${payload}.${signature}`;
}

export function validatePantavionFounderSessionValue(
  suppliedSession: string,
  secret = getPantavionFounderSessionSecret(),
  nowMs = Date.now(),
) {
  if (!suppliedSession || !secret) return false;

  const parts = suppliedSession.split(".");
  if (parts.length !== 5) return false;

  const [version, issuedRaw, expiresRaw, nonce, signature] = parts;
  if (version !== PANTAVION_FOUNDER_SESSION_VERSION) return false;

  const issuedAt = Number(issuedRaw);
  const expiresAt = Number(expiresRaw);
  const nowSeconds = Math.floor(nowMs / 1000);

  if (!Number.isSafeInteger(issuedAt) || !Number.isSafeInteger(expiresAt)) return false;
  if (expiresAt <= issuedAt) return false;
  if (issuedAt > nowSeconds + CLOCK_SKEW_SECONDS) return false;
  if (expiresAt <= nowSeconds) return false;
  if (expiresAt - issuedAt > PANTAVION_FOUNDER_SESSION_TTL_SECONDS) return false;
  if (!/^[A-Za-z0-9_-]{20,64}$/.test(nonce)) return false;

  const payload = `${issuedAt}.${expiresAt}.${nonce}`;
  const expectedSignature = signPayload(secret, payload);
  return safeFounderSecretEqual(signature, expectedSignature);
}

function readCookie(request: Request, name: string) {
  const cookieHeader = request.headers.get("cookie") || "";

  for (const part of cookieHeader.split(";")) {
    const [rawName, ...rawValue] = part.trim().split("=");
    if (rawName === name) return decodeURIComponent(rawValue.join("="));
  }

  return "";
}

export function hasPantavionFounderSession(request: Request) {
  return validatePantavionFounderSessionValue(
    readCookie(request, PANTAVION_FOUNDER_SESSION_COOKIE),
  );
}
