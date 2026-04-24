// core/inspector/intelligence-visibility-inspector.ts

import { listAIProviders } from '../intelligence/ai-provider-registry';
import { listAICapabilityAuthorities } from '../intelligence/ai-capability-authority';
import { listAILocaleAuthorities } from '../intelligence/ai-locale-authority';
import { listAIGovernanceProfiles } from '../intelligence/ai-governance-profile';

export interface PantavionIntelligenceVisibilitySnapshot {
  generatedAt: string;
  providerCount: number;
  activeProviderCount: number;
  seededProviderCount: number;
  plannedProviderCount: number;
  capabilityAuthorityCount: number;
  localeAuthorityCount: number;
  nativeLocaleCount: number;
  strongLocaleCount: number;
  futureBridgeCount: number;
  governorGatedCount: number;
  realtimeProviderCount: number;
  sovereignProviderCount: number;
}

function nowIso(): string {
  return new Date().toISOString();
}

export function buildIntelligenceVisibilitySnapshot(): PantavionIntelligenceVisibilitySnapshot {
  const providers = listAIProviders();
  const authorities = listAICapabilityAuthorities();
  const locales = listAILocaleAuthorities();
  const governanceProfiles = listAIGovernanceProfiles();

  return {
    generatedAt: nowIso(),
    providerCount: providers.length,
    activeProviderCount: providers.filter((item) => item.status === 'active').length,
    seededProviderCount: providers.filter((item) => item.status === 'seeded').length,
    plannedProviderCount: providers.filter((item) => item.status === 'planned').length,
    capabilityAuthorityCount: authorities.length,
    localeAuthorityCount: locales.length,
    nativeLocaleCount: locales.filter((item) => item.supportStrength === 'native').length,
    strongLocaleCount: locales.filter((item) => item.supportStrength === 'strong').length,
    futureBridgeCount: providers.filter((item) => item.providerClass === 'future-intelligence-bridge').length,
    governorGatedCount: authorities.filter((item) => item.finalAuthorityMode === 'governor-gated').length,
    realtimeProviderCount: governanceProfiles.filter((item) => item.realtimeCapable).length,
    sovereignProviderCount: providers.filter((item) => item.trustTier === 'sovereign').length,
  };
}

export default buildIntelligenceVisibilitySnapshot;
