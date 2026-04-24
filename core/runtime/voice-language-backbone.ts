// core/runtime/voice-language-backbone.ts

export interface PantavionVoiceBackboneLanguage {
  locale: string;
  language: string;
  script?: string;
  tier: 'tier-1-core' | 'tier-2-international' | 'tier-3-expansion';
  direction: 'ltr' | 'rtl';
  operationalStatus: 'stable' | 'bridge-ready' | 'watch';
  notes?: string[];
}

export interface PantavionVoiceBackboneSnapshot {
  generatedAt: string;
  count: number;
  tier1Count: number;
  tier2Count: number;
  tier3Count: number;
  locales: string[];
}

function nowIso(): string {
  return new Date().toISOString();
}

const BACKBONE_LANGUAGES: PantavionVoiceBackboneLanguage[] = [
  { locale: 'el-GR', language: 'Ελληνικά', tier: 'tier-1-core', direction: 'ltr', operationalStatus: 'stable' },
  { locale: 'en-US', language: 'English', tier: 'tier-1-core', direction: 'ltr', operationalStatus: 'stable' },
  { locale: 'fr-FR', language: 'Français', tier: 'tier-1-core', direction: 'ltr', operationalStatus: 'stable' },
  { locale: 'de-DE', language: 'Deutsch', tier: 'tier-1-core', direction: 'ltr', operationalStatus: 'stable' },
  { locale: 'es-ES', language: 'Español', tier: 'tier-1-core', direction: 'ltr', operationalStatus: 'stable' },
  { locale: 'it-IT', language: 'Italiano', tier: 'tier-1-core', direction: 'ltr', operationalStatus: 'stable' },
  { locale: 'pt-PT', language: 'Português', tier: 'tier-1-core', direction: 'ltr', operationalStatus: 'stable' },

  { locale: 'ar-SA', language: 'العربية', script: 'Arab', tier: 'tier-2-international', direction: 'rtl', operationalStatus: 'bridge-ready' },
  { locale: 'tr-TR', language: 'Türkçe', tier: 'tier-2-international', direction: 'ltr', operationalStatus: 'bridge-ready' },
  { locale: 'ru-RU', language: 'Русский', script: 'Cyrl', tier: 'tier-2-international', direction: 'ltr', operationalStatus: 'bridge-ready' },
  { locale: 'uk-UA', language: 'Українська', script: 'Cyrl', tier: 'tier-2-international', direction: 'ltr', operationalStatus: 'bridge-ready' },
  { locale: 'hi-IN', language: 'हिन्दी', script: 'Deva', tier: 'tier-2-international', direction: 'ltr', operationalStatus: 'bridge-ready' },
  { locale: 'id-ID', language: 'Bahasa Indonesia', tier: 'tier-2-international', direction: 'ltr', operationalStatus: 'bridge-ready' },
  { locale: 'ja-JP', language: '日本語', script: 'Jpan', tier: 'tier-2-international', direction: 'ltr', operationalStatus: 'bridge-ready' },
  { locale: 'ko-KR', language: '한국어', script: 'Kore', tier: 'tier-2-international', direction: 'ltr', operationalStatus: 'bridge-ready' },
  { locale: 'zh-CN', language: '中文', script: 'Hans', tier: 'tier-2-international', direction: 'ltr', operationalStatus: 'bridge-ready' },
];

export function listVoiceBackboneLanguages(): PantavionVoiceBackboneLanguage[] {
  return JSON.parse(JSON.stringify(BACKBONE_LANGUAGES)) as PantavionVoiceBackboneLanguage[];
}

export function getVoiceBackboneLanguage(locale: string): PantavionVoiceBackboneLanguage | null {
  const normalized = locale.trim().toLowerCase();
  const exact = BACKBONE_LANGUAGES.find((item) => item.locale.toLowerCase() === normalized);
  if (exact) {
    return JSON.parse(JSON.stringify(exact)) as PantavionVoiceBackboneLanguage;
  }

  const prefix = normalized.split('-')[0];
  const family = BACKBONE_LANGUAGES.find((item) => item.locale.toLowerCase().split('-')[0] === prefix);
  return family ? (JSON.parse(JSON.stringify(family)) as PantavionVoiceBackboneLanguage) : null;
}

export function getVoiceBackboneSnapshot(): PantavionVoiceBackboneSnapshot {
  const list = listVoiceBackboneLanguages();

  return {
    generatedAt: nowIso(),
    count: list.length,
    tier1Count: list.filter((item) => item.tier === 'tier-1-core').length,
    tier2Count: list.filter((item) => item.tier === 'tier-2-international').length,
    tier3Count: list.filter((item) => item.tier === 'tier-3-expansion').length,
    locales: list.map((item) => item.locale),
  };
}

export default listVoiceBackboneLanguages;
