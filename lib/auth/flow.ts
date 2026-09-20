export type PantavionRegistrationState =
  | "email_confirmation_pending"
  | "profile_completion_required"
  | "active"
  | "minor_protected"
  | "manual_review"
  | "rejected"
  | "suspended";

const INTERNAL_ORIGIN = "https://pantavion.invalid";

export function safeNextPath(value: string | null | undefined, fallback = "/profile") {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return fallback;
  if (value.includes("\\") || /[\u0000-\u001f\u007f]/.test(value)) return fallback;

  let decoded: string;
  try {
    decoded = decodeURIComponent(value);
  } catch {
    return fallback;
  }

  if (!decoded.startsWith("/") || decoded.startsWith("//") || decoded.includes("\\")) {
    return fallback;
  }

  const resolved = new URL(value, INTERNAL_ORIGIN);
  if (resolved.origin !== INTERNAL_ORIGIN) return fallback;

  return `${resolved.pathname}${resolved.search}${resolved.hash}`;
}

export function postSignInDestination(
  state: PantavionRegistrationState | string | null | undefined,
  requestedPath: string | null | undefined,
) {
  if (state === "email_confirmation_pending") return "/auth/check-email";
  if (state === "profile_completion_required") return "/auth/complete-profile";
  if (state === "active" || state === "minor_protected") {
    return safeNextPath(requestedPath);
  }

  return null;
}
