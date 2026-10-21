#!/usr/bin/env node
/**
 * Read-only production smoke. Never submits credentials, signup forms or data mutations.
 * Failure is loud: dead public links and accidentally exposed Water data are release blockers.
 */
const BASE = "https://pantavion.com";
const TIMEOUT_MS = 20000;
const failures = [];
async function check(path, predicate, name, redirect = "follow") {
  let response;
  try {
    response = await fetch(BASE + path, {
      method: "GET",
      redirect,
      cache: "no-store",
      headers: { "User-Agent": "Pantavion-Core-Availability-Guard/1.0" },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (error) {
    failures.push(name + ": request failed (" + (error?.name || "network") + ")");
    return;
  }
  const passed = await predicate(response).catch(() => false);
  const summary = name + ": HTTP " + response.status + (passed ? " PASS" : " FAIL");
  console.log(summary);
  if (!passed) failures.push(summary);
}

await check("/", async (r) => r.status === 200 && (await r.text()).includes("Pantavion"), "Homepage");
await check("/auth/signup", async (r) => {
  if (![301, 302, 307, 308].includes(r.status)) return false;
  const location = r.headers.get("location");
  if (!location) return false;
  const target = new URL(location, BASE);
  return target.origin === BASE && target.pathname === "/auth/register";
}, "Legacy signup redirects to guarded registration", "manual");
await check("/auth/register", async (r) => r.status === 200, "Registration page");
await check("/social", async (r) => r.status === 200, "Social");
await check("/api/social/health", async (r) => r.status === 200, "Social API");
await check("/professional/infrastructure/water/live", async (r) => r.status === 200, "Protected Water entry");
await check(
  "/api/professional/infrastructure/water/segment/bbox?minLng=33.02&minLat=34.67&maxLng=33.04&maxLat=34.69&maxFeatures=5",
  async (r) => [401, 403].includes(r.status),
  "Unauthenticated Water segment is denied",
);
if (failures.length) {
  console.error("PANTAVION PRODUCTION CORE GUARD FAILED:\n" + failures.join("\n"));
  process.exitCode = 1;
} else {
  console.log("PANTAVION PRODUCTION CORE GUARD: VERIFIED");
}
