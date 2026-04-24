// core/intake/ai-category-registry.ts

export interface PantavionAICategoryRecord {
  aiCategoryKey: string;
  title: string;
  purpose: string;
  safetyTier: 'standard' | 'high' | 'critical';
  voiceCapable: boolean;
  multilingualCapable: boolean;
  premiumEligible: boolean;
  defaultUserCategories: string[];
}

export interface PantavionAICategorySnapshot {
  generatedAt: string;
  categoryCount: number;
  criticalCount: number;
  voiceCapableCount: number;
  multilingualCapableCount: number;
  premiumEligibleCount: number;
}

function nowIso(): string {
  return new Date().toISOString();
}

function cloneValue<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

const AI_CATEGORIES: PantavionAICategoryRecord[] = [
  {
    aiCategoryKey: 'assistant-ai',
    title: 'Assistant AI',
    purpose: 'General human assistance and orchestration',
    safetyTier: 'high',
    voiceCapable: true,
    multilingualCapable: true,
    premiumEligible: false,
    defaultUserCategories: ['local-resident', 'foreign-resident', 'tourist', 'worker-community'],
  },
  {
    aiCategoryKey: 'memory-ai',
    title: 'Memory AI',
    purpose: 'Continuity, recall and thread persistence',
    safetyTier: 'high',
    voiceCapable: false,
    multilingualCapable: true,
    premiumEligible: false,
    defaultUserCategories: ['local-resident', 'foreign-resident', 'family-household'],
  },
  {
    aiCategoryKey: 'translation-ai',
    title: 'Translation AI',
    purpose: 'Language bridging and multilingual understanding',
    safetyTier: 'high',
    voiceCapable: true,
    multilingualCapable: true,
    premiumEligible: false,
    defaultUserCategories: ['foreign-resident', 'tourist', 'worker-community', 'crisis-sensitive'],
  },
  {
    aiCategoryKey: 'voice-ai',
    title: 'Voice AI',
    purpose: 'Speech-first interaction and accessibility',
    safetyTier: 'high',
    voiceCapable: true,
    multilingualCapable: true,
    premiumEligible: false,
    defaultUserCategories: ['elderly-sensitive', 'tourist'],
  },
  {
    aiCategoryKey: 'sos-ai',
    title: 'SOS AI',
    purpose: 'Emergency guidance, crisis triage and urgent assistance',
    safetyTier: 'critical',
    voiceCapable: true,
    multilingualCapable: true,
    premiumEligible: false,
    defaultUserCategories: ['tourist', 'worker-community', 'crisis-sensitive', 'elderly-sensitive'],
  },
  {
    aiCategoryKey: 'radio-ai',
    title: 'Radio and Live Info AI',
    purpose: 'Live bulletins, radio context and broadcast intelligence',
    safetyTier: 'high',
    voiceCapable: true,
    multilingualCapable: true,
    premiumEligible: false,
    defaultUserCategories: ['worker-community', 'crisis-sensitive', 'tourist'],
  },
  {
    aiCategoryKey: 'classifieds-ai',
    title: 'Classifieds AI',
    purpose: 'Listings, posting assistance and trusted marketplace guidance',
    safetyTier: 'high',
    voiceCapable: false,
    multilingualCapable: true,
    premiumEligible: true,
    defaultUserCategories: ['local-resident', 'foreign-resident', 'business-owner'],
  },
  {
    aiCategoryKey: 'services-ai',
    title: 'Services AI',
    purpose: 'Local services, utility access and practical assistance',
    safetyTier: 'high',
    voiceCapable: true,
    multilingualCapable: true,
    premiumEligible: false,
    defaultUserCategories: ['local-resident', 'foreign-resident', 'tourist', 'worker-community'],
  },
  {
    aiCategoryKey: 'elite-concierge-ai',
    title: 'Elite Concierge AI',
    purpose: 'High-touch premium planning and concierge support',
    safetyTier: 'high',
    voiceCapable: true,
    multilingualCapable: true,
    premiumEligible: true,
    defaultUserCategories: ['elite-vip'],
  },
  {
    aiCategoryKey: 'operator-ai',
    title: 'Operator AI',
    purpose: 'Operational monitoring, routing and controlled intervention',
    safetyTier: 'critical',
    voiceCapable: false,
    multilingualCapable: true,
    premiumEligible: false,
    defaultUserCategories: ['operator', 'founder'],
  },
  {
    aiCategoryKey: 'governance-ai',
    title: 'Governance AI',
    purpose: 'Policy analysis, authority mapping and constitutional assistance',
    safetyTier: 'critical',
    voiceCapable: false,
    multilingualCapable: true,
    premiumEligible: false,
    defaultUserCategories: ['operator', 'founder'],
  },
  {
    aiCategoryKey: 'app-builder-ai',
    title: 'App Builder AI',
    purpose: 'Application and program generation for paid production',
    safetyTier: 'high',
    voiceCapable: false,
    multilingualCapable: true,
    premiumEligible: true,
    defaultUserCategories: ['founder', 'operator'],
  },
];

export function listAICategories(): PantavionAICategoryRecord[] {
  return AI_CATEGORIES.map((item) => cloneValue(item));
}

export function getAICategorySnapshot(): PantavionAICategorySnapshot {
  const list = listAICategories();

  return {
    generatedAt: nowIso(),
    categoryCount: list.length,
    criticalCount: list.filter((item) => item.safetyTier === 'critical').length,
    voiceCapableCount: list.filter((item) => item.voiceCapable).length,
    multilingualCapableCount: list.filter((item) => item.multilingualCapable).length,
    premiumEligibleCount: list.filter((item) => item.premiumEligible).length,
  };
}

export default listAICategories;
