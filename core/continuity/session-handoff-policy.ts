// core/continuity/session-handoff-policy.ts

export interface PantavionSessionHandoffRequest {
  accountId: string;
  sourceDeviceId: string;
  targetDeviceId: string;
  sourceSurface: string;
  targetDeviceTrusted: boolean;
  targetRecentlySeen: boolean;
}

export interface PantavionSessionHandoffDecision {
  accountId: string;
  sourceDeviceId: string;
  targetDeviceId: string;
  allowed: boolean;
  shouldPromptContinue: boolean;
  reason: string;
}

export interface PantavionSessionHandoffSnapshot {
  generatedAt: string;
  evaluatedCount: number;
  allowedCount: number;
  blockedCount: number;
  continuePromptCount: number;
}

function nowIso(): string {
  return new Date().toISOString();
}

export function evaluateSessionHandoff(
  request: PantavionSessionHandoffRequest,
): PantavionSessionHandoffDecision {
  if (!request.targetDeviceTrusted) {
    return {
      accountId: request.accountId,
      sourceDeviceId: request.sourceDeviceId,
      targetDeviceId: request.targetDeviceId,
      allowed: false,
      shouldPromptContinue: false,
      reason: 'Handoff blocked because target device is not trusted.',
    };
  }

  return {
    accountId: request.accountId,
    sourceDeviceId: request.sourceDeviceId,
    targetDeviceId: request.targetDeviceId,
    allowed: true,
    shouldPromptContinue: request.targetRecentlySeen,
    reason: request.targetRecentlySeen
      ? `Prompt continue on ${request.sourceSurface} surface.`
      : 'Handoff allowed without immediate continue prompt.',
  };
}

export function getSessionHandoffSnapshot(
  decisions: PantavionSessionHandoffDecision[],
): PantavionSessionHandoffSnapshot {
  return {
    generatedAt: nowIso(),
    evaluatedCount: decisions.length,
    allowedCount: decisions.filter((item) => item.allowed).length,
    blockedCount: decisions.filter((item) => !item.allowed).length,
    continuePromptCount: decisions.filter((item) => item.shouldPromptContinue).length,
  };
}

export default evaluateSessionHandoff;
