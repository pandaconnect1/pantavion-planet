import "server-only";

import { hasWaterAdminSession } from "@/core/security/water-admin-session";

/**
 * Water privileged authorization is owned by Pantavion.
 *
 * A caller is privileged only after Pantavion has established a short-lived,
 * signed, httpOnly Founder/Admin session. Provider identity systems must not
 * decide Pantavion Founder authority.
 *
 * Normal users remain fail-closed and require their separately approved
 * Water access path.
 */
export async function hasWaterAdminAuthorization(request: Request) {
  return hasWaterAdminSession(request);
}
