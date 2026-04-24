// core/continuity/cross-device-continuity-wave.ts

import { saveKernelState } from '../storage/kernel-state-store';
import { listIdentities, getIdentitySnapshot } from './identity-registry';
import { listTrustedDevices, getTrustedDeviceSnapshot } from './trusted-device-registry';
import { listCloudContinuityRecords, getCloudContinuitySnapshot } from './cloud-continuity-store';
import { listLocalSecureCaches, getLocalSecureCacheSnapshot } from './local-secure-cache-registry';
import { listSyncStates, getSyncStateSnapshot } from './sync-state-registry';
import { listOfflinePacks, getOfflinePackSnapshot } from './offline-pack-registry';
import {
  evaluateRestoreRecovery,
  getRestoreRecoverySnapshot,
  type PantavionRestoreRecoveryDecision,
  type PantavionRestoreRecoveryRequest,
} from './restore-recovery-policy';
import {
  evaluateSessionHandoff,
  getSessionHandoffSnapshot,
  type PantavionSessionHandoffDecision,
  type PantavionSessionHandoffRequest,
} from './session-handoff-policy';
import { listConflictResolutionPolicies, getConflictResolutionSnapshot } from './conflict-resolution-policy';

export interface PantavionCrossDeviceContinuityWaveOutput {
  generatedAt: string;
  identitySnapshot: ReturnType<typeof getIdentitySnapshot>;
  trustedDeviceSnapshot: ReturnType<typeof getTrustedDeviceSnapshot>;
  cloudContinuitySnapshot: ReturnType<typeof getCloudContinuitySnapshot>;
  localSecureCacheSnapshot: ReturnType<typeof getLocalSecureCacheSnapshot>;
  syncStateSnapshot: ReturnType<typeof getSyncStateSnapshot>;
  offlinePackSnapshot: ReturnType<typeof getOfflinePackSnapshot>;
  restoreRecoverySnapshot: ReturnType<typeof getRestoreRecoverySnapshot>;
  sessionHandoffSnapshot: ReturnType<typeof getSessionHandoffSnapshot>;
  conflictResolutionSnapshot: ReturnType<typeof getConflictResolutionSnapshot>;
  restoreDecisions: PantavionRestoreRecoveryDecision[];
  handoffDecisions: PantavionSessionHandoffDecision[];
  rendered: string;
}

function nowIso(): string {
  return new Date().toISOString();
}

function renderWave(output: PantavionCrossDeviceContinuityWaveOutput): string {
  return [
    'PANTAVION CROSS DEVICE CONTINUITY WAVE',
    `generatedAt=${output.generatedAt}`,
    '',
    'IDENTITY',
    `identityCount=${output.identitySnapshot.identityCount}`,
    `verifiedCount=${output.identitySnapshot.verifiedCount}`,
    `accessibilityEnhancedCount=${output.identitySnapshot.accessibilityEnhancedCount}`,
    `eliteOrHigherCount=${output.identitySnapshot.eliteOrHigherCount}`,
    '',
    'TRUSTED DEVICES',
    `deviceCount=${output.trustedDeviceSnapshot.deviceCount}`,
    `phoneCount=${output.trustedDeviceSnapshot.phoneCount}`,
    `tabletCount=${output.trustedDeviceSnapshot.tabletCount}`,
    `revokedCount=${output.trustedDeviceSnapshot.revokedCount}`,
    `elevatedTrustCount=${output.trustedDeviceSnapshot.elevatedTrustCount}`,
    '',
    'CLOUD CONTINUITY',
    `continuityCount=${output.cloudContinuitySnapshot.continuityCount}`,
    `memoryTimelineReadyCount=${output.cloudContinuitySnapshot.memoryTimelineReadyCount}`,
    `travelOrEmergencyModeCount=${output.cloudContinuitySnapshot.travelOrEmergencyModeCount}`,
    `totalReminderCount=${output.cloudContinuitySnapshot.totalReminderCount}`,
    '',
    'LOCAL SECURE CACHE',
    `cacheCount=${output.localSecureCacheSnapshot.cacheCount}`,
    `encryptedCount=${output.localSecureCacheSnapshot.encryptedCount}`,
    `offlineQueuePendingDeviceCount=${output.localSecureCacheSnapshot.offlineQueuePendingDeviceCount}`,
    `totalTranslatorPackCount=${output.localSecureCacheSnapshot.totalTranslatorPackCount}`,
    `sensitiveModeLockedCount=${output.localSecureCacheSnapshot.sensitiveModeLockedCount}`,
    '',
    'SYNC STATES',
    `syncCount=${output.syncStateSnapshot.syncCount}`,
    `readyCount=${output.syncStateSnapshot.readyCount}`,
    `completedCount=${output.syncStateSnapshot.completedCount}`,
    `handoffCount=${output.syncStateSnapshot.handoffCount}`,
    `offlineReplayCount=${output.syncStateSnapshot.offlineReplayCount}`,
    '',
    'OFFLINE PACKS',
    `packCount=${output.offlinePackSnapshot.packCount}`,
    `downloadedCount=${output.offlinePackSnapshot.downloadedCount}`,
    `emergencyPackCount=${output.offlinePackSnapshot.emergencyPackCount}`,
    `translatorPackCount=${output.offlinePackSnapshot.translatorPackCount}`,
    '',
    'RESTORE RECOVERY',
    `evaluatedCount=${output.restoreRecoverySnapshot.evaluatedCount}`,
    `allowedCount=${output.restoreRecoverySnapshot.allowedCount}`,
    `blockedCount=${output.restoreRecoverySnapshot.blockedCount}`,
    `continuityFetchCount=${output.restoreRecoverySnapshot.continuityFetchCount}`,
    `offlinePackRestoreCount=${output.restoreRecoverySnapshot.offlinePackRestoreCount}`,
    '',
    ...output.restoreDecisions.flatMap((item) => [
      `${item.accountId} -> ${item.targetDeviceId}`,
      `allowed=${item.allowed ? 'yes' : 'no'}`,
      `fetchContinuity=${item.fetchContinuity ? 'yes' : 'no'}`,
      `restoreOfflinePacks=${item.restoreOfflinePacks ? 'yes' : 'no'}`,
      `reason=${item.reason}`,
      '',
    ]),
    'SESSION HANDOFF',
    `evaluatedCount=${output.sessionHandoffSnapshot.evaluatedCount}`,
    `allowedCount=${output.sessionHandoffSnapshot.allowedCount}`,
    `blockedCount=${output.sessionHandoffSnapshot.blockedCount}`,
    `continuePromptCount=${output.sessionHandoffSnapshot.continuePromptCount}`,
    '',
    ...output.handoffDecisions.flatMap((item) => [
      `${item.accountId} :: ${item.sourceDeviceId} -> ${item.targetDeviceId}`,
      `allowed=${item.allowed ? 'yes' : 'no'}`,
      `shouldPromptContinue=${item.shouldPromptContinue ? 'yes' : 'no'}`,
      `reason=${item.reason}`,
      '',
    ]),
    'CONFLICT RESOLUTION',
    `conflictCount=${output.conflictResolutionSnapshot.conflictCount}`,
    `mergeCount=${output.conflictResolutionSnapshot.mergeCount}`,
    `manualReviewCount=${output.conflictResolutionSnapshot.manualReviewCount}`,
    `highSeverityCount=${output.conflictResolutionSnapshot.highSeverityCount}`,
  ].join('\n');
}

export async function runCrossDeviceContinuityWave(): Promise<PantavionCrossDeviceContinuityWaveOutput> {
  const restoreRequests: PantavionRestoreRecoveryRequest[] = [
    {
      accountId: 'acct_local_user_001',
      targetDeviceId: 'device_tablet_002',
      verifiedIdentity: true,
      targetDeviceTrusted: true,
      continuityAvailable: true,
      restoreOfflinePacks: true,
    },
    {
      accountId: 'acct_elite_user_003',
      targetDeviceId: 'device_phone_old_005',
      verifiedIdentity: true,
      targetDeviceTrusted: false,
      continuityAvailable: true,
      restoreOfflinePacks: false,
    },
    {
      accountId: 'acct_founder_004',
      targetDeviceId: 'device_desktop_004',
      verifiedIdentity: true,
      targetDeviceTrusted: true,
      continuityAvailable: true,
      restoreOfflinePacks: false,
    },
  ];

  const handoffRequests: PantavionSessionHandoffRequest[] = [
    {
      accountId: 'acct_local_user_001',
      sourceDeviceId: 'device_phone_001',
      targetDeviceId: 'device_tablet_002',
      sourceSurface: 'translate',
      targetDeviceTrusted: true,
      targetRecentlySeen: true,
    },
    {
      accountId: 'acct_pro_user_002',
      sourceDeviceId: 'device_laptop_003',
      targetDeviceId: 'device_phone_001',
      sourceSurface: 'work',
      targetDeviceTrusted: true,
      targetRecentlySeen: false,
    },
    {
      accountId: 'acct_elite_user_003',
      sourceDeviceId: 'device_phone_old_005',
      targetDeviceId: 'device_phone_old_005',
      sourceSurface: 'elite',
      targetDeviceTrusted: false,
      targetRecentlySeen: false,
    },
  ];

  const restoreDecisions = restoreRequests.map((item) => evaluateRestoreRecovery(item));
  const handoffDecisions = handoffRequests.map((item) => evaluateSessionHandoff(item));

  const output: PantavionCrossDeviceContinuityWaveOutput = {
    generatedAt: nowIso(),
    identitySnapshot: getIdentitySnapshot(),
    trustedDeviceSnapshot: getTrustedDeviceSnapshot(),
    cloudContinuitySnapshot: getCloudContinuitySnapshot(),
    localSecureCacheSnapshot: getLocalSecureCacheSnapshot(),
    syncStateSnapshot: getSyncStateSnapshot(),
    offlinePackSnapshot: getOfflinePackSnapshot(),
    restoreRecoverySnapshot: getRestoreRecoverySnapshot(restoreDecisions),
    sessionHandoffSnapshot: getSessionHandoffSnapshot(handoffDecisions),
    conflictResolutionSnapshot: getConflictResolutionSnapshot(),
    restoreDecisions,
    handoffDecisions,
    rendered: '',
  };

  output.rendered = renderWave(output);

  saveKernelState({
    key: 'continuity.cross-device.latest',
    kind: 'report',
    payload: {
      identities: listIdentities(),
      trustedDevices: listTrustedDevices(),
      cloudContinuity: listCloudContinuityRecords(),
      localSecureCaches: listLocalSecureCaches(),
      syncStates: listSyncStates(),
      offlinePacks: listOfflinePacks(),
      conflictResolutionPolicies: listConflictResolutionPolicies(),
      restoreDecisions: output.restoreDecisions,
      handoffDecisions: output.handoffDecisions,
      snapshots: {
        identity: output.identitySnapshot,
        trustedDevices: output.trustedDeviceSnapshot,
        cloudContinuity: output.cloudContinuitySnapshot,
        localSecureCache: output.localSecureCacheSnapshot,
        syncStates: output.syncStateSnapshot,
        offlinePacks: output.offlinePackSnapshot,
        restoreRecovery: output.restoreRecoverySnapshot,
        sessionHandoff: output.sessionHandoffSnapshot,
        conflictResolution: output.conflictResolutionSnapshot,
      },
    },
    tags: ['continuity', 'cross-device', 'sync', 'offline', 'restore', 'trusted-devices', 'latest'],
    metadata: {
      identityCount: output.identitySnapshot.identityCount,
      trustedDeviceCount: output.trustedDeviceSnapshot.deviceCount,
      restoreAllowedCount: output.restoreRecoverySnapshot.allowedCount,
      handoffAllowedCount: output.sessionHandoffSnapshot.allowedCount,
    },
  });

  return output;
}

export default runCrossDeviceContinuityWave;
