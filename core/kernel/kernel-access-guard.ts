import "server-only";

import { timingSafeEqual } from "node:crypto";

import { requireFounderIdentity } from "@/lib/owner-control/decision-queue";
import { createClient } from "@/lib/supabase/server";

export const PANTAVION_KERNEL_ACCESS_QUERY = "kernelToken";
export const PANTAVION_KERNEL_FOUNDER_QUERY = "founderToken";
export const PANTAVION_KERNEL_SESSION_COOKIE = "pantavion_kernel_founder_session";


function safeTokenEqual(left: string, right: string): boolean {
  const leftBytes = Buffer.from(left);
  const rightBytes = Buffer.from(right);
  if (leftBytes.length !== rightBytes.length) return false;
  return timingSafeEqual(leftBytes, rightBytes);
}

/**
 * Dedicated machine boundary for the Founder ChatGPT -> Pantavion Governor
 * bridge. This token is server-only and deliberately does not grant arbitrary
 * browser founder identity. Routes must opt in explicitly to this boundary.
 */
export function isPantavionGovernorBridgeRequestAllowed(request: Request): boolean {
  const requiredToken = process.env.PANTAVION_GOVERNOR_BRIDGE_TOKEN?.trim() || "";
  if (requiredToken.length < 32) return false;

  const authorization = request.headers.get("authorization") || "";
  const bearer = authorization.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length).trim()
    : "";
  const headerToken =
    request.headers.get("x-pantavion-governor-token")?.trim() || "";
  const supplied = bearer || headerToken;

  return supplied.length > 0 && safeTokenEqual(supplied, requiredToken);
}

export interface PantavionKernelAccessDeniedReport {
  ok: false;
  marker: "pantavion_kernel_access_denied_v1";
  status: "restricted";
  message: "Kernel control routes are internal and require founder authorization.";
  publicSafe: true;
}

export function isPantavionKernelAccessAllowed(token?: string | null): boolean {
  if (process.env.NODE_ENV !== "production") return true;

  const requiredToken = process.env.PANTAVION_KERNEL_PANEL_TOKEN;

  if (!requiredToken || requiredToken.length < 12) return false;

  return token === requiredToken;
}

function readCookieValue(cookieHeader: string, name: string): string | null {
  const item = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));

  if (!item) return null;

  try {
    return decodeURIComponent(item.slice(name.length + 1));
  } catch {
    return null;
  }
}

/**
 * Secret/session boundary for internal Kernel routes.
 * This is deliberately not sufficient on its own for founder-level access;
 * production callers must also pass the authenticated founder + AAL2 check.
 */
export function isPantavionKernelRequestAllowed(request: Request): boolean {
  const url = new URL(request.url);
  const queryToken =
    url.searchParams.get(PANTAVION_KERNEL_FOUNDER_QUERY) ??
    url.searchParams.get(PANTAVION_KERNEL_ACCESS_QUERY);
  const sessionToken = readCookieValue(
    request.headers.get("cookie") ?? "",
    PANTAVION_KERNEL_SESSION_COOKIE,
  );

  return (
    isPantavionKernelAccessAllowed(queryToken) ||
    isPantavionKernelAccessAllowed(sessionToken)
  );
}

export async function isPantavionKernelFounderIdentityAllowed(): Promise<boolean> {
  if (process.env.NODE_ENV !== "production") return true;

  try {
    const supabase = await createClient();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return false;

    requireFounderIdentity(auth.user.id);

    const { data: assurance } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    return assurance?.currentLevel === "aal2";
  } catch {
    return false;
  }
}

export async function isPantavionKernelFounderRequestAllowed(
  request: Request,
): Promise<boolean> {
  if (!isPantavionKernelRequestAllowed(request)) return false;
  return isPantavionKernelFounderIdentityAllowed();
}

export function createPantavionKernelAccessDeniedReport(): PantavionKernelAccessDeniedReport {
  return {
    ok: false,
    marker: "pantavion_kernel_access_denied_v1",
    status: "restricted",
    message: "Kernel control routes are internal and require founder authorization.",
    publicSafe: true,
  };
}
