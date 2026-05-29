export const PANTAVION_KERNEL_ACCESS_QUERY = "kernelToken";
export const PANTAVION_KERNEL_FOUNDER_QUERY = "founderToken";

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
}

export interface PantavionKernelAccessDeniedReport {
  ok: false;
  marker: "pantavion_kernel_access_denied_v2";
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
  };
}

const ACCEPTED_ENV_NAMES = [
  "PANTAVION_KERNEL_PANEL_TOKEN",
  "PANTAVION_FOUNDER_KERNEL_TOKEN",
];

function cleanToken(value?: string | null): string {
  return typeof value === "string" ? value.trim() : "";
}

function getRequiredToken(): string {
  for (const name of ACCEPTED_ENV_NAMES) {
    const value = cleanToken(process.env[name]);
    if (value.length >= 12) return value;
  }

  return "";
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
    };
  }

  const requiredToken = getRequiredToken();
  const providedToken = cleanToken(token);

  if (!requiredToken) {
    return {
      allowed: false,
      reason: "env-missing",
      production: true,
      envConfigured: false,
      tokenReceived: providedToken.length > 0,
      tokenLengthOk: providedToken.length >= 12,
      acceptedEnvNames: ACCEPTED_ENV_NAMES,
    };
  }

  if (!providedToken) {
    return {
      allowed: false,
      reason: "token-missing",
      production: true,
      envConfigured: true,
      tokenReceived: false,
      tokenLengthOk: false,
      acceptedEnvNames: ACCEPTED_ENV_NAMES,
    };
  }

  if (providedToken.length < 12) {
    return {
      allowed: false,
      reason: "token-too-short",
      production: true,
      envConfigured: true,
      tokenReceived: true,
      tokenLengthOk: false,
      acceptedEnvNames: ACCEPTED_ENV_NAMES,
    };
  }

  return {
    allowed: providedToken === requiredToken,
    reason: providedToken === requiredToken ? "not-production" : "token-mismatch",
    production: true,
    envConfigured: true,
    tokenReceived: true,
    tokenLengthOk: true,
    acceptedEnvNames: ACCEPTED_ENV_NAMES,
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
    marker: "pantavion_kernel_access_denied_v2",
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
    },
  };
}
