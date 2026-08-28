export type PantavionGatewayFailure = {
  errorClass?: string;
  errorCode?: string;
  httpStatus?: number;
  causes?: PantavionGatewayFailure[];
};

export const PANTAVION_GATEWAY_RATE_LIMIT_COOLDOWN_MS = 15_000;

let gatewayCircuitOpenUntilMs = 0;
let gatewayLastRateLimitedAtMs = 0;

export function isPantavionGatewayRateLimitFailure(
  failure: PantavionGatewayFailure | null | undefined,
): boolean {
  if (!failure) return false;
  if (failure.httpStatus === 429) return true;
  if (failure.errorClass === "GatewayRateLimitError") return true;
  return failure.causes?.some((cause) => isPantavionGatewayRateLimitFailure(cause)) ?? false;
}

export function markPantavionGatewayRateLimited(
  nowMs = Date.now(),
  cooldownMs = PANTAVION_GATEWAY_RATE_LIMIT_COOLDOWN_MS,
) {
  const boundedCooldown = Number.isFinite(cooldownMs) && cooldownMs > 0
    ? Math.min(cooldownMs, 60_000)
    : PANTAVION_GATEWAY_RATE_LIMIT_COOLDOWN_MS;

  gatewayLastRateLimitedAtMs = nowMs;
  gatewayCircuitOpenUntilMs = Math.max(gatewayCircuitOpenUntilMs, nowMs + boundedCooldown);

  return getPantavionGatewayRateLimitCircuit(nowMs);
}

export function getPantavionGatewayRateLimitCircuit(nowMs = Date.now()) {
  const remainingMs = Math.max(0, gatewayCircuitOpenUntilMs - nowMs);
  return {
    open: remainingMs > 0,
    remainingMs,
    openUntilMs: gatewayCircuitOpenUntilMs,
    lastRateLimitedAtMs: gatewayLastRateLimitedAtMs,
    scope: "runtime_instance" as const,
  };
}

export function resetPantavionGatewayRateLimitCircuitForTest() {
  gatewayCircuitOpenUntilMs = 0;
  gatewayLastRateLimitedAtMs = 0;
}
