import { createHash, timingSafeEqual } from "crypto";

export const WATER_ADMIN_SESSION_COOKIE = "pantavion_water_admin_session";

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
  return (
    firstConfiguredEnvironmentValue(LEGACY_ACCESS_CODE_ENV_KEYS) ||
    clean(process.env.PANTAVION_WATER_ADMIN_SESSION_SECRET)
  );
}

export function getWaterAdminSessionSecret() {
  return (
    clean(process.env.PANTAVION_WATER_ADMIN_SESSION_SECRET) ||
    firstConfiguredEnvironmentValue(LEGACY_ACCESS_CODE_ENV_KEYS)
  );
}

export function createWaterAdminSessionValue(secret: string) {
  return createHash("sha256")
    .update(`pantavion-water-admin-session-v1:${secret}`)
    .digest("hex");
}

export function safeSecretEqual(leftValue: string, rightValue: string) {
  const left = Buffer.from(leftValue);
  const right = Buffer.from(rightValue);

  if (left.length !== right.length) return false;

  return timingSafeEqual(left, right);
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
  const secret = getWaterAdminSessionSecret();

  if (!secret || !suppliedSession) return false;

  return safeSecretEqual(
    suppliedSession,
    createWaterAdminSessionValue(secret),
  );
}
