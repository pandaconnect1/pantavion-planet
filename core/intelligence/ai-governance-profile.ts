// core/intelligence/ai-governance-profile.ts

export type PantavionMemoryWriteAccess =
  | 'none'
  | 'thread-only'
  | 'fact-proposed'
  | 'governor-reviewed';

export interface PantavionAIGovernanceProfileRecord {
  providerKey: string;
  realtimeCapable: boolean;
  memoryWriteAccess: PantavionMemoryWriteAccess;
  maxSuggestedLatencyMs: number;
  promotionEligible: boolean;
  demotionEligible: boolean;
  complianceSensitive: boolean;
  postAIFutureReady: boolean;
  notes: string[];
}

export interface PantavionAIGovernanceProfileSnapshot {
  generatedAt: string;
  profileCount: number;
  realtimeCapableCount: number;
  promotionEligibleCount: number;
  complianceSensitiveCount: number;
  futureReadyCount: number;
}

function nowIso(): string {
  return new Date().toISOString();
}

function cloneValue<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

const GOVERNANCE_PROFILES: PantavionAIGovernanceProfileRecord[] = [
  {
    providerKey: 'pantavion-frontier-reasoner',
    realtimeCapable: false,
    memoryWriteAccess: 'governor-reviewed',
    maxSuggestedLatencyMs: 3500,
    promotionEligible: true,
    demotionEligible: true,
    complianceSensitive: true,
    postAIFutureReady: true,
    notes: [
      'Reasoning providers may propose memory facts but should not write canonical memory directly.',
    ],
  },
  {
    providerKey: 'pantavion-voice-realtime',
    realtimeCapable: true,
    memoryWriteAccess: 'thread-only',
    maxSuggestedLatencyMs: 700,
    promotionEligible: true,
    demotionEligible: true,
    complianceSensitive: false,
    postAIFutureReady: true,
    notes: [
      'Realtime voice may append thread continuity events but should not create canonical facts directly.',
    ],
  },
  {
    providerKey: 'pantavion-research-intake',
    realtimeCapable: false,
    memoryWriteAccess: 'fact-proposed',
    maxSuggestedLatencyMs: 4000,
    promotionEligible: true,
    demotionEligible: true,
    complianceSensitive: true,
    postAIFutureReady: true,
    notes: [
      'Research intake may propose evidence facts for canonical review.',
    ],
  },
  {
    providerKey: 'pantavion-multilingual-bridge',
    realtimeCapable: true,
    memoryWriteAccess: 'thread-only',
    maxSuggestedLatencyMs: 900,
    promotionEligible: true,
    demotionEligible: true,
    complianceSensitive: false,
    postAIFutureReady: true,
    notes: [
      'Multilingual bridge preserves continuity and locale transitions.',
    ],
  },
  {
    providerKey: 'pantavion-reporting-export',
    realtimeCapable: false,
    memoryWriteAccess: 'none',
    maxSuggestedLatencyMs: 5000,
    promotionEligible: true,
    demotionEligible: true,
    complianceSensitive: false,
    postAIFutureReady: true,
    notes: [
      'Reporting export should remain output-oriented and not mutate memory.',
    ],
  },
  {
    providerKey: 'pantavion-private-local-core',
    realtimeCapable: true,
    memoryWriteAccess: 'governor-reviewed',
    maxSuggestedLatencyMs: 1200,
    promotionEligible: true,
    demotionEligible: true,
    complianceSensitive: true,
    postAIFutureReady: true,
    notes: [
      'Private local core is a sovereign fallback and future primary candidate.',
    ],
  },
  {
    providerKey: 'pantavion-compliance-sentinel',
    realtimeCapable: false,
    memoryWriteAccess: 'none',
    maxSuggestedLatencyMs: 2500,
    promotionEligible: false,
    demotionEligible: false,
    complianceSensitive: true,
    postAIFutureReady: true,
    notes: [
      'Compliance sentinel governs, audits and constrains; it should not act as freeform memory writer.',
    ],
  },
  {
    providerKey: 'pantavion-future-intelligence-bridge',
    realtimeCapable: false,
    memoryWriteAccess: 'governor-reviewed',
    maxSuggestedLatencyMs: 3000,
    promotionEligible: true,
    demotionEligible: true,
    complianceSensitive: true,
    postAIFutureReady: true,
    notes: [
      'Future bridge exists to protect constitutional continuity across intelligence eras.',
    ],
  },
];

export function listAIGovernanceProfiles(): PantavionAIGovernanceProfileRecord[] {
  return GOVERNANCE_PROFILES.map((item) => cloneValue(item));
}

export function getAIGovernanceProfile(providerKey: string): PantavionAIGovernanceProfileRecord | null {
  const item = GOVERNANCE_PROFILES.find((entry) => entry.providerKey === providerKey);
  return item ? cloneValue(item) : null;
}

export function getAIGovernanceProfileSnapshot(): PantavionAIGovernanceProfileSnapshot {
  const list = listAIGovernanceProfiles();

  return {
    generatedAt: nowIso(),
    profileCount: list.length,
    realtimeCapableCount: list.filter((item) => item.realtimeCapable).length,
    promotionEligibleCount: list.filter((item) => item.promotionEligible).length,
    complianceSensitiveCount: list.filter((item) => item.complianceSensitive).length,
    futureReadyCount: list.filter((item) => item.postAIFutureReady).length,
  };
}

export default listAIGovernanceProfiles;
