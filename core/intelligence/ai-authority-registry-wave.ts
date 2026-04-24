// core/intelligence/ai-authority-registry-wave.ts

import { listAIProviders, getAIProviderRegistrySnapshot } from './ai-provider-registry';
import { listAICapabilityAuthorities, getAICapabilityAuthoritySnapshot } from './ai-capability-authority';
import { listAILocaleAuthorities, getAILocaleAuthoritySnapshot } from './ai-locale-authority';
import { listAIGovernanceProfiles, getAIGovernanceProfileSnapshot } from './ai-governance-profile';
import { saveKernelState } from '../storage/kernel-state-store';

export interface PantavionAIAuthorityRegistryWaveOutput {
  generatedAt: string;
  providerSnapshot: ReturnType<typeof getAIProviderRegistrySnapshot>;
  capabilityAuthoritySnapshot: ReturnType<typeof getAICapabilityAuthoritySnapshot>;
  localeAuthoritySnapshot: ReturnType<typeof getAILocaleAuthoritySnapshot>;
  governanceProfileSnapshot: ReturnType<typeof getAIGovernanceProfileSnapshot>;
  rendered: string;
}

function nowIso(): string {
  return new Date().toISOString();
}

function renderWave(output: PantavionAIAuthorityRegistryWaveOutput): string {
  const providers = listAIProviders();
  const authorities = listAICapabilityAuthorities();
  const locales = listAILocaleAuthorities();
  const profiles = listAIGovernanceProfiles();

  return [
    'PANTAVION AI AUTHORITY REGISTRY WAVE',
    `generatedAt=${output.generatedAt}`,
    '',
    'PROVIDERS',
    `providerCount=${output.providerSnapshot.providerCount}`,
    `activeCount=${output.providerSnapshot.activeCount}`,
    `seededCount=${output.providerSnapshot.seededCount}`,
    `plannedCount=${output.providerSnapshot.plannedCount}`,
    `sovereignCount=${output.providerSnapshot.sovereignCount}`,
    `futureBridgeCount=${output.providerSnapshot.futureBridgeCount}`,
    '',
    ...providers.flatMap((item) => [
      `${item.providerKey}`,
      `providerClass=${item.providerClass}`,
      `status=${item.status}`,
      `latencyTier=${item.latencyTier}`,
      `costTier=${item.costTier}`,
      `trustTier=${item.trustTier}`,
      `deploymentMode=${item.deploymentMode}`,
      '',
    ]),
    'CAPABILITY AUTHORITIES',
    `authorityCount=${output.capabilityAuthoritySnapshot.authorityCount}`,
    `governorGatedCount=${output.capabilityAuthoritySnapshot.governorGatedCount}`,
    `providerPrimaryCount=${output.capabilityAuthoritySnapshot.providerPrimaryCount}`,
    `hybridCount=${output.capabilityAuthoritySnapshot.hybridCount}`,
    '',
    ...authorities.flatMap((item) => [
      `${item.capabilityKey}:${item.operationKey}`,
      `primaryProviderKey=${item.primaryProviderKey}`,
      `finalAuthorityMode=${item.finalAuthorityMode}`,
      '',
    ]),
    'LOCALE AUTHORITIES',
    `localeCount=${output.localeAuthoritySnapshot.localeCount}`,
    `stableBackboneCount=${output.localeAuthoritySnapshot.stableBackboneCount}`,
    `tier2Count=${output.localeAuthoritySnapshot.tier2Count}`,
    `nativeCount=${output.localeAuthoritySnapshot.nativeCount}`,
    `strongCount=${output.localeAuthoritySnapshot.strongCount}`,
    '',
    ...locales.slice(0, 8).flatMap((item) => [
      `${item.localeKey}`,
      `tier=${item.tier}`,
      `supportStrength=${item.supportStrength}`,
      `primaryVoiceProviderKey=${item.primaryVoiceProviderKey}`,
      '',
    ]),
    'GOVERNANCE PROFILES',
    `profileCount=${output.governanceProfileSnapshot.profileCount}`,
    `realtimeCapableCount=${output.governanceProfileSnapshot.realtimeCapableCount}`,
    `promotionEligibleCount=${output.governanceProfileSnapshot.promotionEligibleCount}`,
    `complianceSensitiveCount=${output.governanceProfileSnapshot.complianceSensitiveCount}`,
    `futureReadyCount=${output.governanceProfileSnapshot.futureReadyCount}`,
    '',
    ...profiles.flatMap((item) => [
      `${item.providerKey}`,
      `realtimeCapable=${item.realtimeCapable ? 'yes' : 'no'}`,
      `memoryWriteAccess=${item.memoryWriteAccess}`,
      `promotionEligible=${item.promotionEligible ? 'yes' : 'no'}`,
      `postAIFutureReady=${item.postAIFutureReady ? 'yes' : 'no'}`,
      '',
    ]),
  ].join('\n');
}

export async function runAIAuthorityRegistryWave(): Promise<PantavionAIAuthorityRegistryWaveOutput> {
  const providerSnapshot = getAIProviderRegistrySnapshot();
  const capabilityAuthoritySnapshot = getAICapabilityAuthoritySnapshot();
  const localeAuthoritySnapshot = getAILocaleAuthoritySnapshot();
  const governanceProfileSnapshot = getAIGovernanceProfileSnapshot();

  const output: PantavionAIAuthorityRegistryWaveOutput = {
    generatedAt: nowIso(),
    providerSnapshot,
    capabilityAuthoritySnapshot,
    localeAuthoritySnapshot,
    governanceProfileSnapshot,
    rendered: '',
  };

  output.rendered = renderWave(output);

  saveKernelState({
    key: 'intelligence.ai-authority-registry.latest',
    kind: 'report',
    payload: {
      providerSnapshot: output.providerSnapshot,
      capabilityAuthoritySnapshot: output.capabilityAuthoritySnapshot,
      localeAuthoritySnapshot: output.localeAuthoritySnapshot,
      governanceProfileSnapshot: output.governanceProfileSnapshot,
      providers: listAIProviders(),
      capabilityAuthorities: listAICapabilityAuthorities(),
      localeAuthorities: listAILocaleAuthorities(),
      governanceProfiles: listAIGovernanceProfiles(),
    },
    tags: ['intelligence', 'ai-authority', 'registry', 'latest'],
    metadata: {
      providerCount: output.providerSnapshot.providerCount,
      localeCount: output.localeAuthoritySnapshot.localeCount,
      capabilityAuthorityCount: output.capabilityAuthoritySnapshot.authorityCount,
      futureBridgeCount: output.providerSnapshot.futureBridgeCount,
    },
  });

  return output;
}

export default runAIAuthorityRegistryWave;
