// core/intelligence/ai-locale-authority.ts

export type PantavionLocaleSupportStrength =
  | 'native'
  | 'strong'
  | 'mediated'
  | 'restricted';

export interface PantavionAILocaleAuthorityRecord {
  localeKey: string;
  supportStrength: PantavionLocaleSupportStrength;
  primaryReasoningProviderKey: string;
  primaryVoiceProviderKey: string;
  primaryResearchProviderKey: string;
  backupProviderKeys: string[];
  tier: 'stable-backbone' | 'tier-2-international';
  authorityReason: string;
}

export interface PantavionAILocaleAuthoritySnapshot {
  generatedAt: string;
  localeCount: number;
  stableBackboneCount: number;
  tier2Count: number;
  nativeCount: number;
  strongCount: number;
  mediatedCount: number;
}

function nowIso(): string {
  return new Date().toISOString();
}

function cloneValue<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

const LOCALE_AUTHORITIES: PantavionAILocaleAuthorityRecord[] = [
  {
    localeKey: 'el-GR',
    supportStrength: 'native',
    primaryReasoningProviderKey: 'pantavion-frontier-reasoner',
    primaryVoiceProviderKey: 'pantavion-voice-realtime',
    primaryResearchProviderKey: 'pantavion-research-intake',
    backupProviderKeys: ['pantavion-multilingual-bridge', 'pantavion-private-local-core'],
    tier: 'stable-backbone',
    authorityReason: 'Greek is a sovereign first-class locale in the Pantavion backbone.',
  },
  {
    localeKey: 'en-US',
    supportStrength: 'native',
    primaryReasoningProviderKey: 'pantavion-frontier-reasoner',
    primaryVoiceProviderKey: 'pantavion-voice-realtime',
    primaryResearchProviderKey: 'pantavion-research-intake',
    backupProviderKeys: ['pantavion-private-local-core', 'pantavion-multilingual-bridge'],
    tier: 'stable-backbone',
    authorityReason: 'English remains a global default backbone locale.',
  },
  {
    localeKey: 'fr-FR',
    supportStrength: 'native',
    primaryReasoningProviderKey: 'pantavion-frontier-reasoner',
    primaryVoiceProviderKey: 'pantavion-voice-realtime',
    primaryResearchProviderKey: 'pantavion-research-intake',
    backupProviderKeys: ['pantavion-multilingual-bridge'],
    tier: 'stable-backbone',
    authorityReason: 'French is part of the stable international backbone.',
  },
  {
    localeKey: 'de-DE',
    supportStrength: 'native',
    primaryReasoningProviderKey: 'pantavion-frontier-reasoner',
    primaryVoiceProviderKey: 'pantavion-voice-realtime',
    primaryResearchProviderKey: 'pantavion-research-intake',
    backupProviderKeys: ['pantavion-multilingual-bridge'],
    tier: 'stable-backbone',
    authorityReason: 'German is part of the stable international backbone.',
  },
  {
    localeKey: 'es-ES',
    supportStrength: 'native',
    primaryReasoningProviderKey: 'pantavion-frontier-reasoner',
    primaryVoiceProviderKey: 'pantavion-voice-realtime',
    primaryResearchProviderKey: 'pantavion-research-intake',
    backupProviderKeys: ['pantavion-multilingual-bridge'],
    tier: 'stable-backbone',
    authorityReason: 'Spanish is part of the stable international backbone.',
  },
  {
    localeKey: 'it-IT',
    supportStrength: 'native',
    primaryReasoningProviderKey: 'pantavion-frontier-reasoner',
    primaryVoiceProviderKey: 'pantavion-voice-realtime',
    primaryResearchProviderKey: 'pantavion-research-intake',
    backupProviderKeys: ['pantavion-multilingual-bridge'],
    tier: 'stable-backbone',
    authorityReason: 'Italian is part of the stable international backbone.',
  },
  {
    localeKey: 'pt-BR',
    supportStrength: 'native',
    primaryReasoningProviderKey: 'pantavion-frontier-reasoner',
    primaryVoiceProviderKey: 'pantavion-voice-realtime',
    primaryResearchProviderKey: 'pantavion-research-intake',
    backupProviderKeys: ['pantavion-multilingual-bridge'],
    tier: 'stable-backbone',
    authorityReason: 'Brazilian Portuguese is part of the stable international backbone.',
  },
  {
    localeKey: 'ar-SA',
    supportStrength: 'strong',
    primaryReasoningProviderKey: 'pantavion-frontier-reasoner',
    primaryVoiceProviderKey: 'pantavion-voice-realtime',
    primaryResearchProviderKey: 'pantavion-frontier-reasoner',
    backupProviderKeys: ['pantavion-multilingual-bridge'],
    tier: 'tier-2-international',
    authorityReason: 'Arabic is a major international lane and must remain strongly supported.',
  },
  {
    localeKey: 'tr-TR',
    supportStrength: 'strong',
    primaryReasoningProviderKey: 'pantavion-frontier-reasoner',
    primaryVoiceProviderKey: 'pantavion-voice-realtime',
    primaryResearchProviderKey: 'pantavion-frontier-reasoner',
    backupProviderKeys: ['pantavion-multilingual-bridge'],
    tier: 'tier-2-international',
    authorityReason: 'Turkish is a major international lane and must remain strongly supported.',
  },
  {
    localeKey: 'ru-RU',
    supportStrength: 'strong',
    primaryReasoningProviderKey: 'pantavion-frontier-reasoner',
    primaryVoiceProviderKey: 'pantavion-voice-realtime',
    primaryResearchProviderKey: 'pantavion-frontier-reasoner',
    backupProviderKeys: ['pantavion-multilingual-bridge'],
    tier: 'tier-2-international',
    authorityReason: 'Russian is a major international lane and must remain strongly supported.',
  },
  {
    localeKey: 'uk-UA',
    supportStrength: 'strong',
    primaryReasoningProviderKey: 'pantavion-frontier-reasoner',
    primaryVoiceProviderKey: 'pantavion-voice-realtime',
    primaryResearchProviderKey: 'pantavion-frontier-reasoner',
    backupProviderKeys: ['pantavion-multilingual-bridge'],
    tier: 'tier-2-international',
    authorityReason: 'Ukrainian is a major international lane and must remain strongly supported.',
  },
  {
    localeKey: 'hi-IN',
    supportStrength: 'strong',
    primaryReasoningProviderKey: 'pantavion-frontier-reasoner',
    primaryVoiceProviderKey: 'pantavion-voice-realtime',
    primaryResearchProviderKey: 'pantavion-frontier-reasoner',
    backupProviderKeys: ['pantavion-multilingual-bridge'],
    tier: 'tier-2-international',
    authorityReason: 'Hindi is a major international lane and must remain strongly supported.',
  },
  {
    localeKey: 'id-ID',
    supportStrength: 'strong',
    primaryReasoningProviderKey: 'pantavion-frontier-reasoner',
    primaryVoiceProviderKey: 'pantavion-voice-realtime',
    primaryResearchProviderKey: 'pantavion-frontier-reasoner',
    backupProviderKeys: ['pantavion-multilingual-bridge'],
    tier: 'tier-2-international',
    authorityReason: 'Indonesian is a major international lane and must remain strongly supported.',
  },
  {
    localeKey: 'ja-JP',
    supportStrength: 'strong',
    primaryReasoningProviderKey: 'pantavion-frontier-reasoner',
    primaryVoiceProviderKey: 'pantavion-voice-realtime',
    primaryResearchProviderKey: 'pantavion-frontier-reasoner',
    backupProviderKeys: ['pantavion-multilingual-bridge'],
    tier: 'tier-2-international',
    authorityReason: 'Japanese is a major international lane and must remain strongly supported.',
  },
  {
    localeKey: 'ko-KR',
    supportStrength: 'strong',
    primaryReasoningProviderKey: 'pantavion-frontier-reasoner',
    primaryVoiceProviderKey: 'pantavion-voice-realtime',
    primaryResearchProviderKey: 'pantavion-frontier-reasoner',
    backupProviderKeys: ['pantavion-multilingual-bridge'],
    tier: 'tier-2-international',
    authorityReason: 'Korean is a major international lane and must remain strongly supported.',
  },
  {
    localeKey: 'zh-Hans',
    supportStrength: 'strong',
    primaryReasoningProviderKey: 'pantavion-frontier-reasoner',
    primaryVoiceProviderKey: 'pantavion-voice-realtime',
    primaryResearchProviderKey: 'pantavion-frontier-reasoner',
    backupProviderKeys: ['pantavion-multilingual-bridge'],
    tier: 'tier-2-international',
    authorityReason: 'Chinese is a major international lane and must remain strongly supported.',
  },
];

export function listAILocaleAuthorities(): PantavionAILocaleAuthorityRecord[] {
  return LOCALE_AUTHORITIES.map((item) => cloneValue(item));
}

export function getAILocaleAuthority(localeKey: string): PantavionAILocaleAuthorityRecord | null {
  const item = LOCALE_AUTHORITIES.find((entry) => entry.localeKey === localeKey);
  return item ? cloneValue(item) : null;
}

export function getAILocaleAuthoritySnapshot(): PantavionAILocaleAuthoritySnapshot {
  const list = listAILocaleAuthorities();

  return {
    generatedAt: nowIso(),
    localeCount: list.length,
    stableBackboneCount: list.filter((item) => item.tier === 'stable-backbone').length,
    tier2Count: list.filter((item) => item.tier === 'tier-2-international').length,
    nativeCount: list.filter((item) => item.supportStrength === 'native').length,
    strongCount: list.filter((item) => item.supportStrength === 'strong').length,
    mediatedCount: list.filter((item) => item.supportStrength === 'mediated').length,
  };
}

export default listAILocaleAuthorities;
