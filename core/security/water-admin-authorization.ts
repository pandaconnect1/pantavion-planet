import "server-only";

import { createClient } from "@/lib/supabase/server";
import { hasWaterAdminSession } from "@/core/security/water-admin-session";

/**
 * Canonical Water privileged authorization.
 *
 * Accepts either:
 * 1) the legacy short-lived Water admin session cookie, or
 * 2) an authenticated Pantavion founder / trust-safety operator session at AAL2.
 *
 * This lets the real Pantavion administrator use the Water approval console
 * without depending on a separate Railway-only access code, while remaining
 * fail-closed for normal users.
 */
export async function hasWaterAdminAuthorization(request: Request) {
  if (hasWaterAdminSession(request)) return true;

  try {
    const supabase = await createClient();
    const [{ data: auth }, { data: founder }, { data: operator }, { data: assurance }] =
      await Promise.all([
        supabase.auth.getUser(),
        supabase.rpc("pantavion_is_active_founder"),
        supabase.rpc("pantavion_is_active_trust_safety_operator"),
        supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
      ]);

    return Boolean(
      auth.user &&
        (founder === true || operator === true) &&
        assurance?.currentLevel === "aal2",
    );
  } catch {
    return false;
  }
}

export async function hasWaterFounderIdentity() {
  try {
    const supabase = await createClient();
    const [{ data: auth }, { data: founder }, { data: operator }] = await Promise.all([
      supabase.auth.getUser(),
      supabase.rpc("pantavion_is_active_founder"),
      supabase.rpc("pantavion_is_active_trust_safety_operator"),
    ]);

    return Boolean(auth.user && (founder === true || operator === true));
  } catch {
    return false;
  }
}
