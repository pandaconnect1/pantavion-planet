// core/intelligence/ai-capability-authority.ts

import type { PantavionIntelligenceProviderClass } from './ai-provider-registry';

export type PantavionFinalAuthorityMode =
  | 'provider-primary'
  | 'governor-gated'
  | 'hybrid';

export interface PantavionAICapabilityAuthorityRecord {
  capabilityKey: string;
  operationKey: string;
  allowedProviderClasses: PantavionIntelligenceProviderClass[];
  primaryProviderKey: string;
  backupProviderKeys: string[];
  forbiddenProviderKeys: string[];
  finalAuthorityMode: PantavionFinalAuthorityMode;
  authorityReason: string;
}

export interface PantavionAICapabilityAuthoritySnapshot {
  generatedAt: string;
  authorityCount: number;
  governorGatedCount: number;
  providerPrimaryCount: number;
  hybridCount: number;
}

function nowIso(): string {
  return new Date().toISOString();
}

function cloneValue<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

const CAPABILITY_AUTHORITIES: PantavionAICapabilityAuthorityRecord[] = [
  {
    capabilityKey: 'external-provider-routing',
    operationKey: 'dispatch-to-provider',
    allowedProviderClasses: ['reasoning-frontier', 'private-local', 'future-intelligence-bridge'],
    primaryProviderKey: 'pantavion-frontier-reasoner',
    backupProviderKeys: ['pantavion-private-local-core', 'pantavion-future-intelligence-bridge'],
    forbiddenProviderKeys: ['pantavion-reporting-export'],
    finalAuthorityMode: 'hybrid',
    authorityReason:
      'External provider routing should prefer a frontier reasoning lane, while preserving sovereign and future abstraction backups.',
  },
  {
    capabilityKey: 'voice-turn-processing',
    operationKey: 'process-turn',
    allowedProviderClasses: ['voice-realtime', 'translation-multilingual', 'private-local'],
    primaryProviderKey: 'pantavion-voice-realtime',
    backupProviderKeys: ['pantavion-multilingual-bridge', 'pantavion-private-local-core'],
    forbiddenProviderKeys: ['pantavion-reporting-export'],
    finalAuthorityMode: 'provider-primary',
    authorityReason:
      'Voice turn processing must prefer a realtime voice provider with multilingual continuity backup.',
  },
  {
    capabilityKey: 'research-intake',
    operationKey: 'collect-sources',
    allowedProviderClasses: ['research-retrieval', 'reasoning-frontier', 'future-intelligence-bridge'],
    primaryProviderKey: 'pantavion-research-intake',
    backupProviderKeys: ['pantavion-frontier-reasoner', 'pantavion-future-intelligence-bridge'],
    forbiddenProviderKeys: [],
    finalAuthorityMode: 'hybrid',
    authorityReason:
      'Research intake should prioritize retrieval/evidence strength while preserving high-order reasoning backup.',
  },
  {
    capabilityKey: 'report-export',
    operationKey: 'export',
    allowedProviderClasses: ['report-generation', 'reasoning-frontier', 'private-local'],
    primaryProviderKey: 'pantavion-reporting-export',
    backupProviderKeys: ['pantavion-frontier-reasoner', 'pantavion-private-local-core'],
    forbiddenProviderKeys: [],
    finalAuthorityMode: 'provider-primary',
    authorityReason:
      'Report export should prefer deterministic report-generation lanes with reasoning fallback where needed.',
  },
  {
    capabilityKey: 'kernel-decisioning',
    operationKey: 'decide',
    allowedProviderClasses: ['reasoning-frontier', 'compliance-specialist', 'private-local'],
    primaryProviderKey: 'pantavion-frontier-reasoner',
    backupProviderKeys: ['pantavion-private-local-core', 'pantavion-compliance-sentinel'],
    forbiddenProviderKeys: ['pantavion-voice-realtime'],
    finalAuthorityMode: 'governor-gated',
    authorityReason:
      'Kernel decisioning may use advanced reasoning, but final authority must remain governor-gated and policy-controlled.',
  },
];

export function listAICapabilityAuthorities(): PantavionAICapabilityAuthorityRecord[] {
  return CAPABILITY_AUTHORITIES.map((item) => cloneValue(item));
}

export function getAICapabilityAuthority(
  capabilityKey: string,
  operationKey: string,
): PantavionAICapabilityAuthorityRecord | null {
  const item = CAPABILITY_AUTHORITIES.find(
    (entry) =>
      entry.capabilityKey === capabilityKey &&
      entry.operationKey === operationKey,
  );

  return item ? cloneValue(item) : null;
}

export function getAICapabilityAuthoritySnapshot(): PantavionAICapabilityAuthoritySnapshot {
  const list = listAICapabilityAuthorities();

  return {
    generatedAt: nowIso(),
    authorityCount: list.length,
    governorGatedCount: list.filter((item) => item.finalAuthorityMode === 'governor-gated').length,
    providerPrimaryCount: list.filter((item) => item.finalAuthorityMode === 'provider-primary').length,
    hybridCount: list.filter((item) => item.finalAuthorityMode === 'hybrid').length,
  };
}

export default listAICapabilityAuthorities;
