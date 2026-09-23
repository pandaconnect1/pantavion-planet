import "server-only";

import { createClient } from "@/lib/supabase/server";
import { hasWaterAdminSession } from "@/core/security/water-admin-session";

/**
 * Canonical Water privileged authorization.
 *
 * Accepts either:
 * 1) the legacy short-lived Water admin session cookie, or
 * 2) the authenticated Pantavion founder session at AAL2.
 *
 * Normal users remain fail-closed and still require explicit approved-device
 * access for Water data.
 */
export async function hasWaterAdminAuthorization(request: Request) {
  if (hasWaterAdminSession(request)) return true;

  try {
    const supabase = await createClient();
    const [{ data: auth }, { data: founder }, { data: assurance }] = await Promise.all([
      supabase.auth.getUser(),
      supabase.rpc("pantavion_is_active_founder"),
      supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
    ]);

    return Boolean(
      auth.user &&
        founder === true &&
        assurance?.currentLevel === "aal2",
    );
  } catch {
    return false;
  }
}
