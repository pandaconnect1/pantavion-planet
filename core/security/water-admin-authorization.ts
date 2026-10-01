import "server-only";

import { hasPantavionFounderSession } from "@/core/security/pantavion-founder-session";
import { hasWaterAdminSession } from "@/core/security/water-admin-session";

/**
 * Water privileged authorization is owned by Pantavion.
 *
 * A valid global Pantavion Founder session has full Water authority.
 * The existing Water Admin session remains accepted during migration.
 * Normal users remain fail-closed and use their separately approved path.
 */
export async function hasWaterAdminAuthorization(request: Request) {
  return hasPantavionFounderSession(request) || hasWaterAdminSession(request);
}
