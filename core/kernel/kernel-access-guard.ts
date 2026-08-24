export const PANTAVION_KERNEL_ACCESS_QUERY = "kernelToken";
export const PANTAVION_KERNEL_FOUNDER_QUERY = "founderToken";
export const PANTAVION_KERNEL_SESSION_COOKIE = "pantavion_kernel_founder_session";

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
 * Server-side guard for founder-only Kernel routes.
 *
 * The panel establishes a short-lived, httpOnly founder cookie.  API routes
 * must honour that cookie as well as the one-time query token, otherwise a
 * real signed-in founder can see the panel while its live API calls fail.
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

export function createPantavionKernelAccessDeniedReport(): PantavionKernelAccessDeniedReport {
  return {
    ok: false,
    marker: "pantavion_kernel_access_denied_v1",
    status: "restricted",
    message: "Kernel control routes are internal and require founder authorization.",
    publicSafe: true,
  };
}
