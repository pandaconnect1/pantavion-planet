/**
 * Founder/Admin canonical DWG upload CSRF origin policy.
 *
 * A browser request can pass from pantavion.com through Render's reverse proxy.
 * Next.js's internal request.url hostname is not guaranteed to match the
 * browser's Origin, so checking request.url against Origin incorrectly blocks
 * legitimate production sessions.
 *
 * The policy allows only EXACT, trusted HTTPS application origins. Unknown
 * and opaque ("null") origins remain denied, regardless of proxy headers.
 * This check complements (never replaces) the founder/admin session gate.
 */
const PRODUCTION_ORIGINS = new Set([
  "https://pantavion.com",
  "https://pantavion-planet.onrender.com",
]);

export function isAllowedWaterVaultOrigin(
  originHeader: string | null,
  runtimeMode = process.env.NODE_ENV,
): boolean {
  if (!originHeader) return false;

  try {
    const value = new URL(originHeader);
    // Origin must be a pure scheme://host[:port], not an arbitrary URL.
    if (originHeader !== value.origin) return false;

    if (PRODUCTION_ORIGINS.has(value.origin)) return true;

    // Local test/development only. Never grant HTTP origins in production.
    if (
      runtimeMode !== "production" &&
      value.protocol === "http:" &&
      (value.hostname === "localhost" || value.hostname === "127.0.0.1")
    ) {
      return true;
    }
    return false;
  } catch {
    return false;
  }
}
