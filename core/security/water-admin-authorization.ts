import "server-only";

import { hasPantavionFounderSession } from "@/core/security/pantavion-founder-session";
import { hasWaterAdminSession } from "@/core/security/water-admin-session";
import { createClient } from "@/lib/supabase/server";

/**
 * Water privileged authorization is owned by Pantavion.
 *
 * Fast path: a valid Pantavion Founder or Water Admin session cookie.
 * Recovery path: an authenticated Pantavion account that is still an active
 * founder in the canonical operator-role RPC. This makes founder access
 * self-healing when a provider/domain/deploy transition drops a derived
 * privileged cookie, while remaining fail-closed for every non-founder.
 */
export async function hasWaterAdminAuthorization(request: Request) {
  if (hasPantavionFounderSession(request) || hasWaterAdminSession(request)) {
    return true;
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) return false;

    const { data: founderStatus, error: founderError } = await supabase.rpc(
      "pantavion_is_active_founder",
    );

    return !founderError && founderStatus === true;
  } catch {
    return false;
  }
}
