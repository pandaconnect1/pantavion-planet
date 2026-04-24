// core/intake/kernel-intake-expansion-wave.ts

import { saveKernelState } from '../storage/kernel-state-store';
import { listVisionDirectives, getVisionDirectiveSnapshot } from './vision-directive-registry';
import { listUserCategories, getUserCategorySnapshot } from './user-category-registry';
import { listAICategories, getAICategorySnapshot } from './ai-category-registry';
import { listLocalePriorityRecords, getLocalePrioritySnapshot } from './locale-priority-matrix';
import { listAppCategories, getAppCategorySnapshot } from './app-category-registry';
import { listServiceCategories, getServiceCategorySnapshot } from './service-category-registry';
import { listSurfaceCategories, getSurfaceCategorySnapshot } from './surface-category-registry';
import { listMediaIntakeRecords, getMediaIntakeSnapshot } from './media-intake-registry';
import { listToolCapabilities, getToolCapabilitySnapshot } from './tool-capability-registry';
import { listBrandAssets, getBrandAssetSnapshot } from './brand-asset-registry';
import { listDeviceCapabilities, getDeviceCapabilitySnapshot } from './device-capability-registry';
import { listProjectLineageRecords, getProjectLineageSnapshot } from './project-lineage-registry';

export interface PantavionKernelIntakeExpansionWaveOutput {
  generatedAt: string;
  visionSnapshot: ReturnType<typeof getVisionDirectiveSnapshot>;
  userSnapshot: ReturnType<typeof getUserCategorySnapshot>;
  aiSnapshot: ReturnType<typeof getAICategorySnapshot>;
  localeSnapshot: ReturnType<typeof getLocalePrioritySnapshot>;
  appSnapshot: ReturnType<typeof getAppCategorySnapshot>;
  serviceSnapshot: ReturnType<typeof getServiceCategorySnapshot>;
  surfaceSnapshot: ReturnType<typeof getSurfaceCategorySnapshot>;
  mediaSnapshot: ReturnType<typeof getMediaIntakeSnapshot>;
  toolSnapshot: ReturnType<typeof getToolCapabilitySnapshot>;
  brandSnapshot: ReturnType<typeof getBrandAssetSnapshot>;
  deviceSnapshot: ReturnType<typeof getDeviceCapabilitySnapshot>;
  lineageSnapshot: ReturnType<typeof getProjectLineageSnapshot>;
  rendered: string;
}

function nowIso(): string {
  return new Date().toISOString();
}

function renderWave(output: PantavionKernelIntakeExpansionWaveOutput): string {
  return [
    'PANTAVION KERNEL INTAKE EXPANSION WAVE',
    `generatedAt=${output.generatedAt}`,
    '',
    'VISION',
    `directiveCount=${output.visionSnapshot.directiveCount}`,
    `criticalCount=${output.visionSnapshot.criticalCount}`,
    `founderLockedCount=${output.visionSnapshot.founderLockedCount}`,
    '',
    'USERS',
    `categoryCount=${output.userSnapshot.categoryCount}`,
    `coreCount=${output.userSnapshot.coreCount}`,
    `residentForeignCount=${output.userSnapshot.residentForeignCount}`,
    `visitorCount=${output.userSnapshot.visitorCount}`,
    `safetySensitiveCount=${output.userSnapshot.safetySensitiveCount}`,
    '',
    'AI',
    `categoryCount=${output.aiSnapshot.categoryCount}`,
    `criticalCount=${output.aiSnapshot.criticalCount}`,
    `voiceCapableCount=${output.aiSnapshot.voiceCapableCount}`,
    `multilingualCapableCount=${output.aiSnapshot.multilingualCapableCount}`,
    `premiumEligibleCount=${output.aiSnapshot.premiumEligibleCount}`,
    '',
    'LOCALES',
    `localeCount=${output.localeSnapshot.localeCount}`,
    `ring0Count=${output.localeSnapshot.ring0Count}`,
    `rtlCount=${output.localeSnapshot.rtlCount}`,
    `coreReadyTranslationCount=${output.localeSnapshot.coreReadyTranslationCount}`,
    `coreReadyVoiceCount=${output.localeSnapshot.coreReadyVoiceCount}`,
    '',
    'APPS',
    `categoryCount=${output.appSnapshot.categoryCount}`,
    `monetizableCount=${output.appSnapshot.monetizableCount}`,
    `safetyCriticalCount=${output.appSnapshot.safetyCriticalCount}`,
    `multilingualCount=${output.appSnapshot.multilingualCount}`,
    '',
    'SERVICES',
    `categoryCount=${output.serviceSnapshot.categoryCount}`,
    `paidEligibleCount=${output.serviceSnapshot.paidEligibleCount}`,
    `emergencyLinkedCount=${output.serviceSnapshot.emergencyLinkedCount}`,
    `humanAssistRecommendedCount=${output.serviceSnapshot.humanAssistRecommendedCount}`,
    '',
    'SURFACES',
    `categoryCount=${output.surfaceSnapshot.categoryCount}`,
    `humanFirstCount=${output.surfaceSnapshot.humanFirstCount}`,
    `deepRoleCount=${output.surfaceSnapshot.deepRoleCount}`,
    `publicFacingCount=${output.surfaceSnapshot.publicFacingCount}`,
    `coreToHomeCount=${output.surfaceSnapshot.coreToHomeCount}`,
    '',
    'MEDIA INTAKE',
    `intakeCount=${output.mediaSnapshot.intakeCount}`,
    `extractionRequiredCount=${output.mediaSnapshot.extractionRequiredCount}`,
    `memoryWriteRequiredCount=${output.mediaSnapshot.memoryWriteRequiredCount}`,
    `safetyEvaluationRequiredCount=${output.mediaSnapshot.safetyEvaluationRequiredCount}`,
    '',
    'TOOLS',
    `toolCount=${output.toolSnapshot.toolCount}`,
    `criticalTrustCount=${output.toolSnapshot.criticalTrustCount}`,
    `sensitiveDataToolCount=${output.toolSnapshot.sensitiveDataToolCount}`,
    `humanApprovalRequiredCount=${output.toolSnapshot.humanApprovalRequiredCount}`,
    '',
    'BRAND',
    `assetCount=${output.brandSnapshot.assetCount}`,
    `canonicalCount=${output.brandSnapshot.canonicalCount}`,
    `refinementNeededCount=${output.brandSnapshot.refinementNeededCount}`,
    `activeCount=${output.brandSnapshot.activeCount}`,
    '',
    'DEVICES',
    `deviceCount=${output.deviceSnapshot.deviceCount}`,
    `touchPrimaryCount=${output.deviceSnapshot.touchPrimaryCount}`,
    `lowBandwidthRequiredCount=${output.deviceSnapshot.lowBandwidthRequiredCount}`,
    `accessibilityBaselineRequiredCount=${output.deviceSnapshot.accessibilityBaselineRequiredCount}`,
    '',
    'PROJECT LINEAGE',
    `lineageCount=${output.lineageSnapshot.lineageCount}`,
    `criticalCount=${output.lineageSnapshot.criticalCount}`,
    `recoveryCandidateCount=${output.lineageSnapshot.recoveryCandidateCount}`,
    `legacyFragmentCount=${output.lineageSnapshot.legacyFragmentCount}`,
  ].join('\n');
}

export async function runKernelIntakeExpansionWave(): Promise<PantavionKernelIntakeExpansionWaveOutput> {
  const output: PantavionKernelIntakeExpansionWaveOutput = {
    generatedAt: nowIso(),
    visionSnapshot: getVisionDirectiveSnapshot(),
    userSnapshot: getUserCategorySnapshot(),
    aiSnapshot: getAICategorySnapshot(),
    localeSnapshot: getLocalePrioritySnapshot(),
    appSnapshot: getAppCategorySnapshot(),
    serviceSnapshot: getServiceCategorySnapshot(),
    surfaceSnapshot: getSurfaceCategorySnapshot(),
    mediaSnapshot: getMediaIntakeSnapshot(),
    toolSnapshot: getToolCapabilitySnapshot(),
    brandSnapshot: getBrandAssetSnapshot(),
    deviceSnapshot: getDeviceCapabilitySnapshot(),
    lineageSnapshot: getProjectLineageSnapshot(),
    rendered: '',
  };

  output.rendered = renderWave(output);

  saveKernelState({
    key: 'intake.kernel-expansion.latest',
    kind: 'report',
    payload: {
      visionDirectives: listVisionDirectives(),
      userCategories: listUserCategories(),
      aiCategories: listAICategories(),
      localePriorityMatrix: listLocalePriorityRecords(),
      appCategories: listAppCategories(),
      serviceCategories: listServiceCategories(),
      surfaceCategories: listSurfaceCategories(),
      mediaIntake: listMediaIntakeRecords(),
      toolCapabilities: listToolCapabilities(),
      brandAssets: listBrandAssets(),
      deviceCapabilities: listDeviceCapabilities(),
      projectLineage: listProjectLineageRecords(),
      snapshots: {
        vision: output.visionSnapshot,
        users: output.userSnapshot,
        ai: output.aiSnapshot,
        locales: output.localeSnapshot,
        apps: output.appSnapshot,
        services: output.serviceSnapshot,
        surfaces: output.surfaceSnapshot,
        media: output.mediaSnapshot,
        tools: output.toolSnapshot,
        brand: output.brandSnapshot,
        devices: output.deviceSnapshot,
        lineage: output.lineageSnapshot,
      },
    },
    tags: ['kernel', 'intake', 'categories', 'vision', 'locales', 'devices', 'lineage', 'latest'],
    metadata: {
      directiveCount: output.visionSnapshot.directiveCount,
      userCategoryCount: output.userSnapshot.categoryCount,
      aiCategoryCount: output.aiSnapshot.categoryCount,
      localeCount: output.localeSnapshot.localeCount,
      surfaceCount: output.surfaceSnapshot.categoryCount,
    },
  });

  return output;
}

export default runKernelIntakeExpansionWave;
