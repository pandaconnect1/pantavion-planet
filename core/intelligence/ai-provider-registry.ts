// core/intelligence/ai-provider-registry.ts

export type PantavionIntelligenceProviderClass =
  | 'reasoning-frontier'
  | 'voice-realtime'
  | 'research-retrieval'
  | 'translation-multilingual'
  | 'report-generation'
  | 'private-local'
  | 'compliance-specialist'
  | 'future-intelligence-bridge';

export type PantavionProviderLatencyTier =
  | 'low'
  | 'medium'
  | 'high';

export type PantavionProviderCostTier =
  | 'low'
  | 'medium'
  | 'high';

export type PantavionProviderTrustTier =
  | 'restricted'
  | 'standard'
  | 'high'
  | 'sovereign';

export type PantavionProviderDeploymentMode =
  | 'external-api'
  | 'private-hosted'
  | 'hybrid'
  | 'future-abstracted';

export type PantavionProviderStatus =
  | 'active'
  | 'seeded'
  | 'planned';

export interface PantavionAIProviderRecord {
  providerKey: string;
  title: string;
  providerClass: PantavionIntelligenceProviderClass;
  modelFamilies: string[];
  supportsLocales: string[];
  latencyTier: PantavionProviderLatencyTier;
  costTier: PantavionProviderCostTier;
  trustTier: PantavionProviderTrustTier;
  deploymentMode: PantavionProviderDeploymentMode;
  status: PantavionProviderStatus;
  notes: string[];
}

export interface PantavionAIProviderRegistrySnapshot {
  generatedAt: string;
  providerCount: number;
  activeCount: number;
  seededCount: number;
  plannedCount: number;
  sovereignCount: number;
  futureBridgeCount: number;
}

function nowIso(): string {
  return new Date().toISOString();
}

function cloneValue<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

const AI_PROVIDERS: PantavionAIProviderRecord[] = [
  {
    providerKey: 'pantavion-frontier-reasoner',
    title: 'Pantavion Frontier Reasoner',
    providerClass: 'reasoning-frontier',
    modelFamilies: ['reasoning-core', 'planning-core', 'analysis-core'],
    supportsLocales: ['el-GR', 'en-US', 'fr-FR', 'de-DE', 'es-ES', 'it-IT', 'pt-BR', 'ar-SA', 'tr-TR', 'ru-RU', 'uk-UA', 'hi-IN', 'id-ID', 'ja-JP', 'ko-KR', 'zh-Hans'],
    latencyTier: 'medium',
    costTier: 'high',
    trustTier: 'high',
    deploymentMode: 'hybrid',
    status: 'active',
    notes: [
      'Primary governed reasoning lane for complex cognitive operations.',
      'Must remain governor-gated for sensitive final decisions.',
    ],
  },
  {
    providerKey: 'pantavion-voice-realtime',
    title: 'Pantavion Voice Realtime',
    providerClass: 'voice-realtime',
    modelFamilies: ['voice-stream', 'speech-turn', 'realtime-voice'],
    supportsLocales: ['el-GR', 'en-US', 'fr-FR', 'de-DE', 'es-ES', 'it-IT', 'pt-BR', 'ar-SA', 'tr-TR', 'ru-RU', 'uk-UA', 'hi-IN', 'id-ID', 'ja-JP', 'ko-KR', 'zh-Hans'],
    latencyTier: 'low',
    costTier: 'medium',
    trustTier: 'high',
    deploymentMode: 'hybrid',
    status: 'active',
    notes: [
      'Primary voice runtime authority for live turn processing.',
      'Optimized for low latency and streaming conversation continuity.',
    ],
  },
  {
    providerKey: 'pantavion-research-intake',
    title: 'Pantavion Research Intake',
    providerClass: 'research-retrieval',
    modelFamilies: ['retrieval-core', 'evidence-pack', 'source-collector'],
    supportsLocales: ['el-GR', 'en-US', 'fr-FR', 'de-DE', 'es-ES', 'it-IT', 'pt-BR'],
    latencyTier: 'medium',
    costTier: 'medium',
    trustTier: 'high',
    deploymentMode: 'hybrid',
    status: 'active',
    notes: [
      'Primary research and evidence collection provider lane.',
      'Should preserve traceable source reasoning.',
    ],
  },
  {
    providerKey: 'pantavion-multilingual-bridge',
    title: 'Pantavion Multilingual Bridge',
    providerClass: 'translation-multilingual',
    modelFamilies: ['locale-bridge', 'translation-core', 'dialect-router'],
    supportsLocales: ['el-GR', 'en-US', 'fr-FR', 'de-DE', 'es-ES', 'it-IT', 'pt-BR', 'ar-SA', 'tr-TR', 'ru-RU', 'uk-UA', 'hi-IN', 'id-ID', 'ja-JP', 'ko-KR', 'zh-Hans'],
    latencyTier: 'low',
    costTier: 'medium',
    trustTier: 'high',
    deploymentMode: 'hybrid',
    status: 'active',
    notes: [
      'Supports locale, translation and cross-language continuity.',
      'Critical for global language sovereignty.',
    ],
  },
  {
    providerKey: 'pantavion-reporting-export',
    title: 'Pantavion Reporting Export',
    providerClass: 'report-generation',
    modelFamilies: ['export-render', 'summary-render', 'report-formatter'],
    supportsLocales: ['el-GR', 'en-US', 'fr-FR', 'de-DE', 'es-ES', 'it-IT', 'pt-BR'],
    latencyTier: 'medium',
    costTier: 'medium',
    trustTier: 'high',
    deploymentMode: 'private-hosted',
    status: 'active',
    notes: [
      'Specialized for report export and deterministic rendering.',
      'Should remain formatting-strong and predictable.',
    ],
  },
  {
    providerKey: 'pantavion-private-local-core',
    title: 'Pantavion Private Local Core',
    providerClass: 'private-local',
    modelFamilies: ['local-reasoner', 'private-runtime'],
    supportsLocales: ['en-US', 'el-GR'],
    latencyTier: 'low',
    costTier: 'low',
    trustTier: 'sovereign',
    deploymentMode: 'private-hosted',
    status: 'seeded',
    notes: [
      'Seed path for private and sovereign deployments.',
      'Important for future trillion-scale distributed ownership.',
    ],
  },
  {
    providerKey: 'pantavion-compliance-sentinel',
    title: 'Pantavion Compliance Sentinel',
    providerClass: 'compliance-specialist',
    modelFamilies: ['policy-guard', 'compliance-checker'],
    supportsLocales: ['en-US', 'el-GR', 'fr-FR', 'de-DE'],
    latencyTier: 'medium',
    costTier: 'medium',
    trustTier: 'sovereign',
    deploymentMode: 'private-hosted',
    status: 'planned',
    notes: [
      'Planned specialist provider for compliance-sensitive flows.',
      'Should govern policy and sensitive action boundaries.',
    ],
  },
  {
    providerKey: 'pantavion-future-intelligence-bridge',
    title: 'Pantavion Future Intelligence Bridge',
    providerClass: 'future-intelligence-bridge',
    modelFamilies: ['post-llm-bridge', 'future-cognition-abstraction'],
    supportsLocales: ['global'],
    latencyTier: 'medium',
    costTier: 'high',
    trustTier: 'sovereign',
    deploymentMode: 'future-abstracted',
    status: 'seeded',
    notes: [
      "Abstraction layer for future intelligences beyond today's AI families.",
      'Protects the constitution from provider-era lock-in.',
    ],
  },
];

export function listAIProviders(): PantavionAIProviderRecord[] {
  return AI_PROVIDERS.map((item) => cloneValue(item));
}

export function getAIProvider(providerKey: string): PantavionAIProviderRecord | null {
  const item = AI_PROVIDERS.find((entry) => entry.providerKey === providerKey);
  return item ? cloneValue(item) : null;
}

export function getAIProviderRegistrySnapshot(): PantavionAIProviderRegistrySnapshot {
  const list = listAIProviders();

  return {
    generatedAt: nowIso(),
    providerCount: list.length,
    activeCount: list.filter((item) => item.status === 'active').length,
    seededCount: list.filter((item) => item.status === 'seeded').length,
    plannedCount: list.filter((item) => item.status === 'planned').length,
    sovereignCount: list.filter((item) => item.trustTier === 'sovereign').length,
    futureBridgeCount: list.filter((item) => item.providerClass === 'future-intelligence-bridge').length,
  };
}

export default listAIProviders;

