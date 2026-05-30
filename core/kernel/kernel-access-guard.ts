export const PANTAVION_KERNEL_ACCESS_QUERY = "kernelToken";
export const PANTAVION_KERNEL_FOUNDER_QUERY = "founderToken";
export const PANTAVION_KERNEL_SESSION_COOKIE = "pantavion_kernel_founder_session";

export type PantavionKernelAccessDeniedReason =
  | "not-production"
  | "env-missing"
  | "token-missing"
  | "token-too-short"
  | "token-mismatch";

export interface PantavionKernelAccessDecision {
  allowed: boolean;
  reason: PantavionKernelAccessDeniedReason;
  production: boolean;
  envConfigured: boolean;
  tokenReceived: boolean;
  tokenLengthOk: boolean;
  acceptedEnvNames: string[];
  activeEnvName: string | null;
  requiredTokenLength: number;
  providedTokenLength: number;
  sameLength: boolean;
  firstMismatchIndex: number | null;
}

export interface PantavionKernelAccessDeniedReport {
  ok: false;
  marker: "pantavion_kernel_access_denied_v3";
  status: "restricted";
  message: "Kernel control routes are internal and require founder authorization.";
  publicSafe: true;
  diagnostics: {
    reason: PantavionKernelAccessDeniedReason;
    production: boolean;
    envConfigured: boolean;
    tokenReceived: boolean;
    tokenLengthOk: boolean;
    acceptedEnvNames: string[];
    activeEnvName: string | null;
    requiredTokenLength: number;
    providedTokenLength: number;
    sameLength: boolean;
    firstMismatchIndex: number | null;
  };
}

const ACCEPTED_ENV_NAMES = [
  "PANTAVION_KERNEL_PANEL_TOKEN",
  "PANTAVION_FOUNDER_KERNEL_TOKEN",
];

function cleanToken(value?: string | null): string {
  return typeof value === "string" ? value.trim() : "";
}

function getRequiredTokenRecord(): { token: string; envName: string | null } {
  for (const name of ACCEPTED_ENV_NAMES) {
    const value = cleanToken(process.env[name]);
    if (value.length >= 12) {
      return { token: value, envName: name };
    }
  }

  return { token: "", envName: null };
}

function findFirstMismatchIndex(a: string, b: string): number | null {
  const max = Math.max(a.length, b.length);

  for (let index = 0; index < max; index += 1) {
    if (a[index] !== b[index]) return index;
  }

  return null;
}

export function evaluatePantavionKernelAccess(token?: string | null): PantavionKernelAccessDecision {
  const production = process.env.NODE_ENV === "production";

  if (!production) {
    return {
      allowed: true,
      reason: "not-production",
      production: false,
      envConfigured: true,
      tokenReceived: true,
      tokenLengthOk: true,
      acceptedEnvNames: ACCEPTED_ENV_NAMES,
      activeEnvName: "local-development",
      requiredTokenLength: 0,
      providedTokenLength: cleanToken(token).length,
      sameLength: true,
      firstMismatchIndex: null,
    };
  }

  const required = getRequiredTokenRecord();
  const requiredToken = required.token;
  const providedToken = cleanToken(token);

  const base = {
    production: true,
    acceptedEnvNames: ACCEPTED_ENV_NAMES,
    activeEnvName: required.envName,
    requiredTokenLength: requiredToken.length,
    providedTokenLength: providedToken.length,
    sameLength: requiredToken.length === providedToken.length,
    firstMismatchIndex:
      requiredToken && providedToken
        ? findFirstMismatchIndex(requiredToken, providedToken)
        : null,
  };

  if (!requiredToken) {
    return {
      allowed: false,
      reason: "env-missing",
      envConfigured: false,
      tokenReceived: providedToken.length > 0,
      tokenLengthOk: providedToken.length >= 12,
      ...base,
    };
  }

  if (!providedToken) {
    return {
      allowed: false,
      reason: "token-missing",
      envConfigured: true,
      tokenReceived: false,
      tokenLengthOk: false,
      ...base,
    };
  }

  if (providedToken.length < 12) {
    return {
      allowed: false,
      reason: "token-too-short",
      envConfigured: true,
      tokenReceived: true,
      tokenLengthOk: false,
      ...base,
    };
  }

  const allowed = providedToken === requiredToken;

  return {
    allowed,
    reason: allowed ? "not-production" : "token-mismatch",
    envConfigured: true,
    tokenReceived: true,
    tokenLengthOk: true,
    ...base,
  };
}

export function isPantavionKernelAccessAllowed(token?: string | null): boolean {
  return evaluatePantavionKernelAccess(token).allowed;
}

export function createPantavionKernelAccessDeniedReport(
  token?: string | null,
): PantavionKernelAccessDeniedReport {
  const decision = evaluatePantavionKernelAccess(token);

  return {
    ok: false,
    marker: "pantavion_kernel_access_denied_v3",
    status: "restricted",
    message: "Kernel control routes are internal and require founder authorization.",
    publicSafe: true,
    diagnostics: {
      reason: decision.reason,
      production: decision.production,
      envConfigured: decision.envConfigured,
      tokenReceived: decision.tokenReceived,
      tokenLengthOk: decision.tokenLengthOk,
      acceptedEnvNames: decision.acceptedEnvNames,
      activeEnvName: decision.activeEnvName,
      requiredTokenLength: decision.requiredTokenLength,
      providedTokenLength: decision.providedTokenLength,
      sameLength: decision.sameLength,
      firstMismatchIndex: decision.firstMismatchIndex,
    },
  };
}
