// core/continuity/restore-recovery-policy.ts

export interface PantavionRestoreRecoveryRequest {
  accountId: string;
  targetDeviceId: string;
  verifiedIdentity: boolean;
  targetDeviceTrusted: boolean;
  continuityAvailable: boolean;
  restoreOfflinePacks: boolean;
}

export interface PantavionRestoreRecoveryDecision {
  accountId: string;
  targetDeviceId: string;
  allowed: boolean;
  fetchContinuity: boolean;
  restoreOfflinePacks: boolean;
  reason: string;
}

export interface PantavionRestoreRecoverySnapshot {
  generatedAt: string;
  evaluatedCount: number;
  allowedCount: number;
  blockedCount: number;
  continuityFetchCount: number;
  offlinePackRestoreCount: number;
}

function nowIso(): string {
  return new Date().toISOString();
}

export function evaluateRestoreRecovery(
  request: PantavionRestoreRecoveryRequest,
): PantavionRestoreRecoveryDecision {
  if (!request.verifiedIdentity) {
    return {
      accountId: request.accountId,
      targetDeviceId: request.targetDeviceId,
      allowed: false,
      fetchContinuity: false,
      restoreOfflinePacks: false,
      reason: 'Restore blocked until identity is verified.',
    };
  }

  if (!request.targetDeviceTrusted) {
    return {
      accountId: request.accountId,
      targetDeviceId: request.targetDeviceId,
      allowed: false,
      fetchContinuity: false,
      restoreOfflinePacks: false,
      reason: 'Restore blocked until target device is trusted.',
    };
  }

  if (!request.continuityAvailable) {
    return {
      accountId: request.accountId,
      targetDeviceId: request.targetDeviceId,
      allowed: true,
      fetchContinuity: false,
      restoreOfflinePacks: false,
      reason: 'Restore allowed, but no cloud continuity snapshot is available.',
    };
  }

  return {
    accountId: request.accountId,
    targetDeviceId: request.targetDeviceId,
    allowed: true,
    fetchContinuity: true,
    restoreOfflinePacks: request.restoreOfflinePacks,
    reason: 'Restore allowed with continuity fetch.',
  };
}

export function getRestoreRecoverySnapshot(
  decisions: PantavionRestoreRecoveryDecision[],
): PantavionRestoreRecoverySnapshot {
  return {
    generatedAt: nowIso(),
    evaluatedCount: decisions.length,
    allowedCount: decisions.filter((item) => item.allowed).length,
    blockedCount: decisions.filter((item) => !item.allowed).length,
    continuityFetchCount: decisions.filter((item) => item.fetchContinuity).length,
    offlinePackRestoreCount: decisions.filter((item) => item.restoreOfflinePacks).length,
  };
}

export default evaluateRestoreRecovery;
