import { cookies } from "next/headers";
import {
  PANTAVION_FOUNDER_SESSION_COOKIE,
  validatePantavionFounderSessionValue,
} from "@/core/security/pantavion-founder-session";
import { createAdminClient } from "@/lib/supabase/admin";

export type PlatformRole =
  | "founder"
  | "admin"
  | "moderator"
  | "editor"
  | "finance"
  | "support"
  | "institutional_operator";

export async function hasPlatformAuthority(
  userId: string | null | undefined,
  allowedRoles: PlatformRole[],
  scope = "global",
) {
  if (allowedRoles.includes("founder")) {
    try {
      const cookieStore = await cookies();
      const founderSession =
        cookieStore.get(PANTAVION_FOUNDER_SESSION_COOKIE)?.value ?? "";
      if (validatePantavionFounderSessionValue(founderSession)) {
        return {
          allowed: true as const,
          role: "founder" as PlatformRole,
          source: "pantavion_founder_session" as const,
        };
      }
    } catch {
      // Continue to migration adapters.
    }
  }

  if (!userId) {
    return { allowed: false as const, reason: "authentication_required" };
  }

  const founderUserId = process.env.PANTAVION_FOUNDER_USER_ID?.trim();
  if (founderUserId && founderUserId === userId && allowedRoles.includes("founder")) {
    return { allowed: true as const, role: "founder" as PlatformRole, source: "founder_env" as const };
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("platform_roles")
    .select("role,scope,expires_at")
    .eq("user_id", userId)
    .eq("active", true)
    .in("role", allowedRoles)
    .or(`scope.eq.${scope},scope.eq.global`)
    .limit(20);

  if (error) {
    return { allowed: false as const, reason: "authority_lookup_failed", detail: error.message };
  }

  const now = Date.now();
  const match = (data ?? []).find((row) => !row.expires_at || new Date(row.expires_at).getTime() > now);
  if (!match) return { allowed: false as const, reason: "insufficient_authority" };

  return { allowed: true as const, role: match.role as PlatformRole, source: "platform_roles" as const };
}
