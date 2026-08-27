export type PrivilegedRequestBoundaryReason =
  | "ok"
  | "unsupported_method"
  | "missing_origin"
  | "invalid_origin"
  | "origin_mismatch"
  | "cross_site_fetch"
  | "json_required";

export type PrivilegedRequestBoundaryDecision = {
  allowed: boolean;
  reason: PrivilegedRequestBoundaryReason;
};

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function firstForwardedValue(value: string | null) {
  return (value || "")
    .split(",")[0]
    ?.trim();
}

function expectedRequestOrigin(request: Request) {
  const requestUrl = new URL(request.url);
  const forwardedHost = firstForwardedValue(request.headers.get("x-forwarded-host"));
  const host = forwardedHost || request.headers.get("host")?.trim() || requestUrl.host;
  const forwardedProto = firstForwardedValue(request.headers.get("x-forwarded-proto"));
  const protocol = forwardedProto || requestUrl.protocol.replace(/:$/, "");

  try {
    return new URL(`${protocol}://${host}`).origin;
  } catch {
    return requestUrl.origin;
  }
}

function isJsonContentType(value: string | null) {
  if (!value) return false;
  const mediaType = value.split(";", 1)[0]?.trim().toLowerCase();
  return mediaType === "application/json" || Boolean(mediaType?.endsWith("+json"));
}

/**
 * Fail-closed browser/request boundary for privileged state-changing endpoints.
 *
 * This is intentionally independent from authorization. A request must first
 * prove that it came from the same origin and, where a body is expected, uses
 * an explicit JSON media type. Authentication/authorization is evaluated only
 * after this boundary passes.
 */
export function evaluatePrivilegedRequestBoundary(
  request: Request,
): PrivilegedRequestBoundaryDecision {
  const method = request.method.toUpperCase();
  if (!MUTATING_METHODS.has(method)) {
    return { allowed: false, reason: "unsupported_method" };
  }

  const fetchSite = (request.headers.get("sec-fetch-site") || "").trim().toLowerCase();
  if (fetchSite === "cross-site") {
    return { allowed: false, reason: "cross_site_fetch" };
  }

  const rawOrigin = request.headers.get("origin")?.trim();
  if (!rawOrigin) {
    return { allowed: false, reason: "missing_origin" };
  }

  let suppliedOrigin: string;
  try {
    const parsed = new URL(rawOrigin);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      return { allowed: false, reason: "invalid_origin" };
    }
    suppliedOrigin = parsed.origin;
  } catch {
    return { allowed: false, reason: "invalid_origin" };
  }

  if (suppliedOrigin !== expectedRequestOrigin(request)) {
    return { allowed: false, reason: "origin_mismatch" };
  }

  if ((method === "POST" || method === "PUT" || method === "PATCH")
      && !isJsonContentType(request.headers.get("content-type"))) {
    return { allowed: false, reason: "json_required" };
  }

  return { allowed: true, reason: "ok" };
}
