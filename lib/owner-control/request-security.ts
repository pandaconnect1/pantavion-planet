export function requireSameOriginRequest(headers: Headers) {
  const fetchSite = headers.get("sec-fetch-site");
  if (fetchSite && fetchSite !== "same-origin") throw new Error("cross_origin_forbidden");

  const origin = headers.get("origin");
  const directHost = headers.get("host")?.trim();
  const forwardedHost = headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const expectedHost = (directHost || forwardedHost)?.toLowerCase();
  if (!origin || !expectedHost) throw new Error("same_origin_required");

  let originHost = "";
  try {
    originHost = new URL(origin).host;
  } catch {
    throw new Error("origin_invalid");
  }
  if (originHost.toLowerCase() !== expectedHost) throw new Error("cross_origin_forbidden");
}
