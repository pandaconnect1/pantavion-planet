export const GLOBAL_CAPABILITY_INTAKE_REGISTRY_VERSION = '2026-04-24.v1';

export type PantavionCapabilityFamily =
  | 'frontier-ai-assistant'
  | 'agentic-workspace'
  | 'research-evidence'
  | 'memory-knowledge-vault'
  | 'presentation-generation'
  | 'creative-design'
  | 'video-image-generation'
  | 'data-finance-intelligence'
  | 'social-distribution'
  | 'browser-assistant'
  | 'commerce-payments'
  | 'maps-geospatial'
  | 'voice-translation'
  | 'productivity-workspace'
  | 'defensive-security'
  | 'sovereign-infrastructure'
  | 'on-device-intelligence'
  | 'education-mastery'
  | 'superapp-ecosystem'
  | 'protocol-orchestration';

export type PantavionLegalIntegrationMode =
  | 'own-implementation'
  | 'official-api'
  | 'licensed-sdk'
  | 'partner-integration'
  | 'user-authorized-connector'
  | 'open-standard'
  | 'benchmark-only'
  | 'monitor-only'
  | 'reject';

export type PantavionCapabilityVisibility =
  | 'public-surface'
  | 'internal-only'
  | 'restricted'
  | 'admin-only'
  | 'benchmark-only';

export type PantavionCapabilityRiskClass =
  | 'low'
  | 'medium'
  | 'high'
  | 'critical';

export type PantavionCapabilityPriority =
  | 'p0'
  | 'p1'
  | 'p2'
  | 'p3'
  | 'p4';

export interface PantavionCapabilitySignalRecord {
  id: string;
  title: string;
  family: PantavionCapabilityFamily;
  marketExamples: string[];
  regionSignals: string[];
  pantavionSurface:
    | 'Ask'
    | 'Build'
    | 'Learn'
    | 'Research'
    | 'Create'
    | 'Voice'
    | 'People'
    | 'Compass'
    | 'Work'
    | 'Mind'
    | 'Pulse'
    | 'Security'
    | 'Kernel';
  kernelPlacement: string;
  visibility: PantavionCapabilityVisibility;
  legalIntegrationMode: PantavionLegalIntegrationMode[];
  riskClass: PantavionCapabilityRiskClass;
  priority: PantavionCapabilityPriority;
  strengthsToAbsorb: string[];
  weaknessesToInvert: string[];
  requiredKernelServices: string[];
  sovereigntyRule: string;
  implementationRule: string;
  notes: string[];
}

export interface PantavionCapabilityIntakeSnapshot {
  version: string;
  generatedAt: string;
  totalSignals: number;
  families: PantavionCapabilityFamily[];
  p0Count: number;
  p1Count: number;
  restrictedCount: number;
  adminOnlyCount: number;
  records: PantavionCapabilitySignalRecord[];
}

export const PANTAVION_CAPABILITY_INTAKE_DOCTRINE = {
  purpose:
    'Convert global technology signals into Pantavion-owned capability families without copying proprietary code, assets, UI, data, trademarks, or private workflows.',
  rules: [
    'Brands are market signals, not Pantavion dependencies.',
    'Use official APIs, licensed SDKs, partner agreements, user-authorized connectors, open standards, or own implementation.',
    'Never clone proprietary UI, private datasets, product names, logos, or protected workflows.',
    'Convert tool lists into capability families.',
    'Public Pantavion must stay clean and unified; tool complexity stays internal.',
    'All high-risk security capabilities are defensive-first, restricted, audited, and admin-governed.',
    'All data, finance, health, identity, minors, and crisis flows require policy gates.',
    'The Prime Kernel decides placement, risk, visibility, routing, and allowed execution.',
  ],
} as const;

const GLOBAL_CAPABILITY_SIGNALS: PantavionCapabilitySignalRecord[] = [
  {
    id: 'frontier-ai-assistant-core',
    title: 'Frontier AI Assistant Core',
    family: 'frontier-ai-assistant',
    marketExamples: [
      'ChatGPT',
      'Claude',
      'Gemini',
      'Grok',
      'Meta AI',
      'Microsoft Copilot',
      'Mistral',
      'DeepSeek',
      'Qwen',
      'Kimi',
    ],
    regionSignals: ['US', 'Europe', 'China', 'global'],
    pantavionSurface: 'Ask',
    kernelPlacement: 'core/intelligence/ai-provider-registry.ts',
    visibility: 'internal-only',
    legalIntegrationMode: [
      'official-api',
      'partner-integration',
      'benchmark-only',
      'own-implementation',
    ],
    riskClass: 'medium',
    priority: 'p0',
    strengthsToAbsorb: [
      'reasoning',
      'conversation',
      'coding support',
      'multimodal understanding',
      'tool use',
      'agent execution',
      'memory-aware work',
    ],
    weaknessesToInvert: [
      'fragmented memory',
      'unclear provenance',
      'tool exposure chaos',
      'vendor lock-in',
      'weak cross-domain continuity',
    ],
    requiredKernelServices: [
      'model-router',
      'truth-zone-governor',
      'memory-governor',
      'provider-fallback',
      'cost-control',
      'audit-log',
    ],
    sovereigntyRule:
      'Pantavion must never depend on one AI provider. Prime Kernel chooses provider by task, cost, trust, language, memory boundary, and risk.',
    implementationRule:
      'Expose one Pantavion assistant surface; hide provider complexity behind governed routing.',
    notes: [
      'This is the core intelligence layer, not a public tool list.',
      'Competitor strengths become internal benchmark targets.',
    ],
  },
  {
    id: 'agentic-workspace-long-running',
    title: 'Agentic Workspace And Long-Running Task Execution',
    family: 'agentic-workspace',
    marketExamples: [
      'ChatGPT Workspace Agents',
      'Claude agentic workflows',
      'Google Workspace Gemini',
      'Microsoft Copilot Studio',
      'Zapier agents',
    ],
    regionSignals: ['US', 'Europe', 'global enterprise'],
    pantavionSurface: 'Work',
    kernelPlacement: 'core/runtime/durable-execution.ts',
    visibility: 'public-surface',
    legalIntegrationMode: [
      'official-api',
      'user-authorized-connector',
      'own-implementation',
    ],
    riskClass: 'high',
    priority: 'p0',
    strengthsToAbsorb: [
      'long-running workflows',
      'cloud task continuation',
      'approval-aware execution',
      'business process automation',
      'team context',
    ],
    weaknessesToInvert: [
      'unclear delegation chains',
      'fragile workflow state',
      'limited rollback',
      'weak cross-agent governance',
    ],
    requiredKernelServices: [
      'durable-execution',
      'task-state-machine',
      'delegation-model',
      'approval-packets',
      'rollback-policy',
      'execution-provenance',
    ],
    sovereigntyRule:
      'No agent may execute privileged action without identity, delegation, policy, and provenance.',
    implementationRule:
      'Prime Kernel converts user intent into task graph, state machine, approvals, execution, and result.',
    notes: [
      'This is the execution OS advantage of Pantavion.',
      'Must support queued, running, input-required, auth-required, completed, failed, resumed.',
    ],
  },
  {
    id: 'research-evidence-notebook',
    title: 'Source-Grounded Research And Evidence Notebook',
    family: 'research-evidence',
    marketExamples: [
      'NotebookLM',
      'Perplexity',
      'Elicit',
      'Semantic Scholar',
      'Consensus',
      'Google Scholar',
    ],
    regionSignals: ['US', 'global academia'],
    pantavionSurface: 'Research',
    kernelPlacement: 'core/intelligence/research-evidence-registry.ts',
    visibility: 'public-surface',
    legalIntegrationMode: [
      'official-api',
      'open-standard',
      'user-authorized-connector',
      'own-implementation',
    ],
    riskClass: 'medium',
    priority: 'p0',
    strengthsToAbsorb: [
      'source upload',
      'source-grounded summaries',
      'citation-aware answers',
      'document comparison',
      'audio research summaries',
      'topic discovery',
    ],
    weaknessesToInvert: [
      'limited cross-project memory',
      'limited execution handoff',
      'source boundary confusion',
      'weak long-term project governance',
    ],
    requiredKernelServices: [
      'source-ingestion',
      'citation-governor',
      'truth-zone-governor',
      'document-memory',
      'research-workspace',
      'summary-audio-bridge',
    ],
    sovereigntyRule:
      'Research answers must declare source scope, uncertainty, freshness, and truth zone.',
    implementationRule:
      'Research surface must produce answer, evidence map, gaps, and next execution steps.',
    notes: [
      'Pantavion should become stronger than a notebook by linking research to execution.',
    ],
  },
  {
    id: 'memory-knowledge-vault-graph',
    title: 'Personal Knowledge Vault And Graph Memory',
    family: 'memory-knowledge-vault',
    marketExamples: [
      'Obsidian',
      'Notion',
      'Logseq',
      'Roam Research',
      'Capacities',
      'Mem',
    ],
    regionSignals: ['US', 'Europe', 'global creators'],
    pantavionSurface: 'Mind',
    kernelPlacement: 'core/memory/memory-thread-kernel.ts',
    visibility: 'public-surface',
    legalIntegrationMode: [
      'user-authorized-connector',
      'open-standard',
      'own-implementation',
    ],
    riskClass: 'medium',
    priority: 'p0',
    strengthsToAbsorb: [
      'backlinks',
      'graph view',
      'local-first notes',
      'markdown portability',
      'canvas thinking',
      'second-brain workflows',
    ],
    weaknessesToInvert: [
      'manual organization burden',
      'weak action execution',
      'limited identity governance',
      'limited multimodal memory governance',
    ],
    requiredKernelServices: [
      'memory-classification',
      'semantic-memory',
      'relation-memory',
      'recall-engine',
      'canonical-promotion-rules',
      'consent-aware-storage',
    ],
    sovereigntyRule:
      'User memory belongs to the user and must be scoped, explainable, recoverable, and removable.',
    implementationRule:
      'Pantavion Mind must auto-structure notes, decisions, tasks, relations, projects, and recall paths.',
    notes: [
      'This directly strengthens the Pantavion long-term continuity doctrine.',
    ],
  },
  {
    id: 'presentation-generation-studio',
    title: 'AI Presentation And Story Deck Generation',
    family: 'presentation-generation',
    marketExamples: [
      'Gamma',
      'Tome',
      'Beautiful.ai',
      'Canva Docs to Decks',
      'Microsoft PowerPoint Copilot',
    ],
    regionSignals: ['US', 'global business'],
    pantavionSurface: 'Create',
    kernelPlacement: 'core/runtime/workspace-runtime.ts',
    visibility: 'public-surface',
    legalIntegrationMode: [
      'official-api',
      'partner-integration',
      'own-implementation',
    ],
    riskClass: 'low',
    priority: 'p1',
    strengthsToAbsorb: [
      'fast deck generation',
      'visual storytelling',
      'template selection',
      'website-like presentations',
      'content-to-layout transformation',
    ],
    weaknessesToInvert: [
      'generic design',
      'weak brand governance',
      'limited factual checking',
      'weak enterprise approval flows',
    ],
    requiredKernelServices: [
      'brand-governor',
      'layout-generator',
      'source-grounding',
      'export-runtime',
      'workspace-memory',
    ],
    sovereigntyRule:
      'Pantavion-generated decks must respect brand rules, citations, truth zones, and export rights.',
    implementationRule:
      'Create surface transforms idea or research into deck, script, website, social assets, and follow-up tasks.',
    notes: [
      'This must connect to Research and Work, not remain a standalone deck tool.',
    ],
  },
  {
    id: 'creative-design-suite',
    title: 'Unified Creative Design Suite',
    family: 'creative-design',
    marketExamples: [
      'Affinity',
      'Adobe Creative Cloud',
      'Canva',
      'Figma',
      'Sketch',
      'Photopea',
    ],
    regionSignals: ['US', 'UK', 'Europe', 'global design'],
    pantavionSurface: 'Create',
    kernelPlacement: 'core/intake/media-intake-registry.ts',
    visibility: 'public-surface',
    legalIntegrationMode: [
      'official-api',
      'licensed-sdk',
      'partner-integration',
      'own-implementation',
      'benchmark-only',
    ],
    riskClass: 'medium',
    priority: 'p1',
    strengthsToAbsorb: [
      'vector editing',
      'pixel editing',
      'layout publishing',
      'brand kits',
      'collaboration',
      'non-destructive editing',
    ],
    weaknessesToInvert: [
      'subscription friction',
      'fragmented tools',
      'weak cross-workspace continuity',
      'weak AI provenance',
    ],
    requiredKernelServices: [
      'asset-storage',
      'brand-governor',
      'creative-rights-policy',
      'media-provenance',
      'export-runtime',
    ],
    sovereigntyRule:
      'Pantavion must not copy proprietary design software; it builds governed creative workflows and integrates legally where allowed.',
    implementationRule:
      'Create surface gives guided design outcomes: logo, brand kit, poster, document, UI, campaign, export.',
    notes: [
      'This absorbs the design workflow, not the protected product identity of others.',
    ],
  },
  {
    id: 'video-image-generation-engine',
    title: 'AI Video And Image Generation Engine',
    family: 'video-image-generation',
    marketExamples: [
      'Higgsfield',
      'Runway',
      'Pika',
      'Luma',
      'Kling',
      'MiniMax',
      'CapCut AI',
      'Adobe Firefly',
    ],
    regionSignals: ['US', 'China', 'global creator economy'],
    pantavionSurface: 'Create',
    kernelPlacement: 'core/intake/media-intake-registry.ts',
    visibility: 'public-surface',
    legalIntegrationMode: [
      'official-api',
      'licensed-sdk',
      'partner-integration',
      'own-implementation',
      'benchmark-only',
    ],
    riskClass: 'high',
    priority: 'p1',
    strengthsToAbsorb: [
      'text-to-video',
      'image-to-video',
      'cinematic camera motion',
      'short-form creator workflows',
      'style presets',
      'rapid iteration',
    ],
    weaknessesToInvert: [
      'deepfake risk',
      'copyright ambiguity',
      'weak provenance',
      'inconsistent identity safety',
      'cost spikes',
    ],
    requiredKernelServices: [
      'media-rights-policy',
      'synthetic-media-labeling',
      'identity-safety-guard',
      'cost-control',
      'asset-provenance',
      'moderation-gate',
    ],
    sovereigntyRule:
      'Synthetic media must be labeled, rights-aware, consent-aware, and blocked for impersonation or abuse.',
    implementationRule:
      'Prime Kernel routes generation to safest approved provider or own model, with provenance and export policy.',
    notes: [
      'This is powerful but must be governed from day one.',
    ],
  },
  {
    id: 'data-finance-intelligence-workspace',
    title: 'Data And Finance Intelligence Workspace',
    family: 'data-finance-intelligence',
    marketExamples: [
      'Rose AI',
      'Bloomberg Terminal',
      'Refinitiv',
      'TradingView',
      'Power BI',
      'Tableau',
      'Looker',
    ],
    regionSignals: ['US', 'UK', 'global finance'],
    pantavionSurface: 'Work',
    kernelPlacement: 'core/intelligence/data-finance-intelligence-registry.ts',
    visibility: 'restricted',
    legalIntegrationMode: [
      'official-api',
      'licensed-sdk',
      'partner-integration',
      'user-authorized-connector',
      'own-implementation',
    ],
    riskClass: 'high',
    priority: 'p1',
    strengthsToAbsorb: [
      'dataset discovery',
      'time-series intelligence',
      'data cleaning',
      'visualization',
      'financial research',
      'anomaly detection',
    ],
    weaknessesToInvert: [
      'expensive access',
      'data licensing complexity',
      'weak user explanation',
      'financial advice risk',
    ],
    requiredKernelServices: [
      'data-license-gate',
      'financial-risk-disclaimer',
      'source-provenance',
      'chart-generator',
      'audit-log',
      'restricted-advice-policy',
    ],
    sovereigntyRule:
      'Pantavion may analyze finance data but must separate information, research, and regulated financial advice.',
    implementationRule:
      'Work surface provides governed data analysis, not unlicensed financial advisory execution.',
    notes: [
      'This is a high-value professional capability family.',
    ],
  },
  {
    id: 'social-distribution-network-intelligence',
    title: 'Social Distribution And Community Graph Intelligence',
    family: 'social-distribution',
    marketExamples: [
      'Facebook',
      'Instagram',
      'Threads',
      'X',
      'TikTok',
      'YouTube',
      'Reddit',
      'Discord',
      'Telegram',
      'WeChat',
    ],
    regionSignals: ['US', 'China', 'Russia', 'global'],
    pantavionSurface: 'People',
    kernelPlacement: 'core/intake/user-category-registry.ts',
    visibility: 'public-surface',
    legalIntegrationMode: [
      'official-api',
      'user-authorized-connector',
      'own-implementation',
      'monitor-only',
    ],
    riskClass: 'high',
    priority: 'p1',
    strengthsToAbsorb: [
      'network effects',
      'creator distribution',
      'communities',
      'messaging habits',
      'short-form media',
      'identity discovery',
    ],
    weaknessesToInvert: [
      'engagement addiction',
      'ad-chaos',
      'outrage ranking',
      'weak memory continuity',
      'fragmented identity',
      'unsafe minors exposure',
    ],
    requiredKernelServices: [
      'social-health-ranking',
      'minor-safety-policy',
      'relationship-graph',
      'consent-aware-discovery',
      'community-governance',
      'no-core-ads-policy',
    ],
    sovereigntyRule:
      'Pantavion social layers must rank for trust, relevance, safety, and human value, not raw outrage.',
    implementationRule:
      'People and Pulse surfaces show clean social interaction without turning core experience into ad-feed chaos.',
    notes: [
      'This protects Pantavion from becoming another addictive feed.',
    ],
  },
  {
    id: 'browser-assistant-entry-layer',
    title: 'Browser Assistant And Web Entry Layer',
    family: 'browser-assistant',
    marketExamples: [
      'Opera Aria',
      'Microsoft Edge Copilot',
      'Chrome Gemini',
      'Safari Apple Intelligence',
      'Arc',
      'Perplexity Comet',
    ],
    regionSignals: ['US', 'Europe', 'global browsers'],
    pantavionSurface: 'Compass',
    kernelPlacement: 'core/protocol/external-routing-promotion-policy.ts',
    visibility: 'internal-only',
    legalIntegrationMode: [
      'official-api',
      'user-authorized-connector',
      'own-implementation',
      'monitor-only',
    ],
    riskClass: 'medium',
    priority: 'p2',
    strengthsToAbsorb: [
      'browser-side context',
      'page summarization',
      'web navigation',
      'search assistance',
      'shopping/research assistance',
    ],
    weaknessesToInvert: [
      'weak long-term memory',
      'browser lock-in',
      'privacy concerns',
      'fragmented workspace continuity',
    ],
    requiredKernelServices: [
      'web-context-boundary',
      'privacy-gate',
      'source-citation',
      'retrieval-router',
      'cross-device-continuity',
    ],
    sovereigntyRule:
      'Pantavion web assistance must be privacy-aware and user-authorized.',
    implementationRule:
      'Compass can later gain browser extension / PWA share target, but only through explicit user permission.',
    notes: [
      'This is important for future daily workflow capture.',
    ],
  },
  {
    id: 'commerce-payments-rail',
    title: 'Commerce Payments And Subscription Rail',
    family: 'commerce-payments',
    marketExamples: [
      'Stripe',
      'Revolut',
      'PayPal',
      'Adyen',
      'Shopify',
      'Apple Pay',
      'Google Pay',
    ],
    regionSignals: ['US', 'Europe', 'global fintech'],
    pantavionSurface: 'Work',
    kernelPlacement: 'core/commercial/commercial-billing-rail-wave.ts',
    visibility: 'restricted',
    legalIntegrationMode: [
      'official-api',
      'partner-integration',
      'licensed-sdk',
    ],
    riskClass: 'high',
    priority: 'p0',
    strengthsToAbsorb: [
      'subscriptions',
      'checkout',
      'payouts',
      'usage metering',
      'marketplace payments',
      'fraud controls',
    ],
    weaknessesToInvert: [
      'provider dependency',
      'country availability gaps',
      'chargeback risk',
      'tax complexity',
    ],
    requiredKernelServices: [
      'billing-truth',
      'entitlement-gate',
      'payment-event-ledger',
      'fraud-policy',
      'country-compliance',
      'audit-log',
    ],
    sovereigntyRule:
      'Billing truth must remain deterministic and cannot be guessed by AI.',
    implementationRule:
      'Commercial rail is governed infrastructure, not a UI feature.',
    notes: [
      'This is foundational for Pro, Elite, Business, Institutional, and marketplace paths.',
    ],
  },
  {
    id: 'maps-geospatial-intelligence',
    title: 'Maps Geospatial And Infrastructure Intelligence',
    family: 'maps-geospatial',
    marketExamples: [
      'Google Maps',
      'Apple Maps',
      'OpenStreetMap',
      'Mapbox',
      'HERE',
      'Baidu Maps',
      'Yandex Maps',
    ],
    regionSignals: ['US', 'Europe', 'China', 'Russia', 'global'],
    pantavionSurface: 'Compass',
    kernelPlacement: 'core/runtime/voice-geo-locale-registry.ts',
    visibility: 'public-surface',
    legalIntegrationMode: [
      'official-api',
      'open-standard',
      'licensed-sdk',
      'partner-integration',
      'own-implementation',
    ],
    riskClass: 'high',
    priority: 'p1',
    strengthsToAbsorb: [
      'places',
      'routes',
      'local discovery',
      'traffic signals',
      'service areas',
      'geospatial search',
    ],
    weaknessesToInvert: [
      'limited civic/utility intelligence',
      'data licensing constraints',
      'privacy risk',
      'weak crisis continuity',
    ],
    requiredKernelServices: [
      'geo-privacy-gate',
      'place-registry',
      'incident-state-machine',
      'utility-impact-model',
      'offline-pack-registry',
      'crisis-routing',
    ],
    sovereigntyRule:
      'Location data must be minimal, consent-aware, purpose-limited, and emergency-aware.',
    implementationRule:
      'Compass maps people, places, services, countries, infrastructure, and crisis-safe paths.',
    notes: [
      'This powers travel, SOS, utility, and local services.',
    ],
  },
  {
    id: 'voice-translation-interpreter',
    title: 'Voice Translation And Live Interpreter Runtime',
    family: 'voice-translation',
    marketExamples: [
      'Google Translate',
      'Apple Translate',
      'DeepL',
      'Microsoft Translator',
      'Whisper',
      'ElevenLabs',
    ],
    regionSignals: ['US', 'Europe', 'global language systems'],
    pantavionSurface: 'Voice',
    kernelPlacement: 'core/runtime/voice-runtime.ts',
    visibility: 'public-surface',
    legalIntegrationMode: [
      'official-api',
      'licensed-sdk',
      'own-implementation',
      'partner-integration',
    ],
    riskClass: 'high',
    priority: 'p0',
    strengthsToAbsorb: [
      'speech-to-text',
      'text-to-speech',
      'auto language detection',
      'dialect handling',
      'offline packs',
      'conversation mode',
    ],
    weaknessesToInvert: [
      'weak official-mode distinction',
      'dialect errors',
      'latency',
      'privacy concerns',
      'weak emergency flow',
    ],
    requiredKernelServices: [
      'voice-runtime-supervisor',
      'locale-priority-matrix',
      'official-language-mode',
      'natural-dialect-mode',
      'offline-pack-registry',
      'privacy-gate',
    ],
    sovereigntyRule:
      'Voice must separate casual translation from official, legal, medical, emergency, or high-stakes interpretation.',
    implementationRule:
      'Voice surface gives live translation with safety modes, confidence, and fallback text display.',
    notes: [
      'This remains one of the flagship Pantavion surfaces.',
    ],
  },
  {
    id: 'productivity-workspace-connectors',
    title: 'Productivity Workspace Connectors',
    family: 'productivity-workspace',
    marketExamples: [
      'Google Workspace',
      'Microsoft 365',
      'Gmail',
      'Outlook',
      'Google Calendar',
      'Slack',
      'Teams',
      'Notion',
      'Airtable',
    ],
    regionSignals: ['US', 'Europe', 'global enterprise'],
    pantavionSurface: 'Work',
    kernelPlacement: 'core/app/app-auth-role-session-integration-wave.ts',
    visibility: 'restricted',
    legalIntegrationMode: [
      'official-api',
      'user-authorized-connector',
      'partner-integration',
    ],
    riskClass: 'high',
    priority: 'p1',
    strengthsToAbsorb: [
      'email',
      'calendar',
      'docs',
      'team chat',
      'files',
      'task handoff',
      'enterprise identity',
    ],
    weaknessesToInvert: [
      'fragmented work state',
      'weak personal continuity',
      'permission complexity',
      'cross-tool context loss',
    ],
    requiredKernelServices: [
      'connector-permission-gate',
      'identity-delegation',
      'workspace-memory',
      'audit-log',
      'task-execution-state',
      'data-minimization',
    ],
    sovereigntyRule:
      'Pantavion must access external workspaces only with explicit user/org authorization.',
    implementationRule:
      'Work surface turns scattered emails, docs, meetings, and tasks into governed execution plans.',
    notes: [
      'This is where Pantavion becomes useful daily for professionals.',
    ],
  },
  {
    id: 'defensive-security-capability',
    title: 'Defensive Security And Risk Intelligence',
    family: 'defensive-security',
    marketExamples: [
      'Cloudflare',
      'CrowdStrike',
      'Microsoft Defender',
      'VirusTotal',
      'Snyk',
      'Wiz',
      'Burp Suite',
      'Splunk',
    ],
    regionSignals: ['US', 'Europe', 'Israel', 'global security'],
    pantavionSurface: 'Security',
    kernelPlacement: 'core/security/security-policy.ts',
    visibility: 'admin-only',
    legalIntegrationMode: [
      'official-api',
      'licensed-sdk',
      'partner-integration',
      'own-implementation',
      'benchmark-only',
    ],
    riskClass: 'critical',
    priority: 'p0',
    strengthsToAbsorb: [
      'threat detection',
      'audit trails',
      'vulnerability awareness',
      'runtime protection',
      'SIEM/log intelligence',
      'abuse prevention',
    ],
    weaknessesToInvert: [
      'offensive misuse risk',
      'false positives',
      'opaque alerts',
      'tool overload',
      'cost spikes',
    ],
    requiredKernelServices: [
      'admin-only-gating',
      'defensive-use-policy',
      'audit-integrity',
      'incident-lockdown',
      'permission-gate',
      'runtime-abuse-protection',
    ],
    sovereigntyRule:
      'Cyber/security capability is defensive-first, restricted, audit-logged, and never exposed casually.',
    implementationRule:
      'Security surface serves internal/admin protection, not public offensive tooling.',
    notes: [
      'This protects Pantavion from misuse and platform-level attacks.',
    ],
  },
  {
    id: 'sovereign-infrastructure-cloud',
    title: 'Sovereign Infrastructure And Multi-Cloud Readiness',
    family: 'sovereign-infrastructure',
    marketExamples: [
      'AWS',
      'Google Cloud',
      'Microsoft Azure',
      'Oracle Cloud',
      'Cloudflare',
      'Alibaba Cloud',
      'Tencent Cloud',
      'Huawei Cloud',
      'Yandex Cloud',
    ],
    regionSignals: ['US', 'Europe', 'China', 'Russia', 'Middle East', 'India'],
    pantavionSurface: 'Kernel',
    kernelPlacement: 'core/runtime/resilience-runtime.ts',
    visibility: 'internal-only',
    legalIntegrationMode: [
      'official-api',
      'partner-integration',
      'own-implementation',
    ],
    riskClass: 'critical',
    priority: 'p0',
    strengthsToAbsorb: [
      'global CDN',
      'multi-region compute',
      'storage',
      'identity services',
      'serverless',
      'observability',
      'resilience',
    ],
    weaknessesToInvert: [
      'single-provider dependency',
      'regional lock-in',
      'cost drift',
      'outage concentration',
      'compliance complexity',
    ],
    requiredKernelServices: [
      'resilience-runtime',
      'provider-fallback',
      'cost-control',
      'region-policy',
      'backup-recovery',
      'observability',
    ],
    sovereigntyRule:
      'Pantavion must not be architecturally hostage to one cloud, one region, or one provider.',
    implementationRule:
      'Start pragmatic, but design for multi-region and provider fallback from the kernel upward.',
    notes: [
      'This is long-term survival infrastructure.',
    ],
  },
  {
    id: 'on-device-intelligence-edge',
    title: 'On-Device Intelligence And Edge Privacy',
    family: 'on-device-intelligence',
    marketExamples: [
      'Apple Intelligence',
      'Qualcomm AI Engine',
      'NVIDIA edge AI',
      'AMD AI PC',
      'Huawei Ascend',
      'Samsung Galaxy AI',
    ],
    regionSignals: ['US', 'Korea', 'China', 'Japan', 'global devices'],
    pantavionSurface: 'Mind',
    kernelPlacement: 'core/continuity/local-secure-cache-registry.ts',
    visibility: 'internal-only',
    legalIntegrationMode: [
      'official-api',
      'licensed-sdk',
      'own-implementation',
      'monitor-only',
    ],
    riskClass: 'medium',
    priority: 'p2',
    strengthsToAbsorb: [
      'privacy-preserving inference',
      'offline availability',
      'low latency',
      'local memory cache',
      'device-aware personalization',
    ],
    weaknessesToInvert: [
      'device fragmentation',
      'hardware limits',
      'sync conflicts',
      'model update complexity',
    ],
    requiredKernelServices: [
      'local-secure-cache',
      'trusted-device-registry',
      'sync-state-registry',
      'conflict-resolution-policy',
      'offline-pack-registry',
    ],
    sovereigntyRule:
      'Sensitive personal continuity should prefer local or scoped processing when technically possible.',
    implementationRule:
      'Pantavion later uses edge/on-device paths for privacy, offline, and resilience.',
    notes: [
      'This supports the cross-device continuity doctrine.',
    ],
  },
  {
    id: 'education-mastery-paths',
    title: 'Education Guided Mastery And Career Learning',
    family: 'education-mastery',
    marketExamples: [
      'Khan Academy',
      'Coursera',
      'Duolingo',
      'Brilliant',
      'YouTube Education',
      'Udemy',
      'LinkedIn Learning',
    ],
    regionSignals: ['US', 'India', 'Europe', 'global education'],
    pantavionSurface: 'Learn',
    kernelPlacement: 'core/intake/service-category-registry.ts',
    visibility: 'public-surface',
    legalIntegrationMode: [
      'official-api',
      'partner-integration',
      'open-standard',
      'own-implementation',
    ],
    riskClass: 'medium',
    priority: 'p1',
    strengthsToAbsorb: [
      'structured lessons',
      'practice paths',
      'quizzes',
      'skill trees',
      'career tracks',
      'personalized progress',
    ],
    weaknessesToInvert: [
      'course fragmentation',
      'weak real execution',
      'low continuity after course',
      'generic guidance',
    ],
    requiredKernelServices: [
      'guided-mastery-engine',
      'progress-memory',
      'practice-generator',
      'skill-graph',
      'mentor-routing',
      'assessment-policy',
    ],
    sovereigntyRule:
      'Pantavion learning must create capability, not just content consumption.',
    implementationRule:
      'Learn surface converts goal into path, lessons, practice, projects, proof, and next steps.',
    notes: [
      'This upgrades learning from information to mastery.',
    ],
  },
  {
    id: 'superapp-ecosystem-patterns',
    title: 'Superapp Ecosystem And Regional Service Patterns',
    family: 'superapp-ecosystem',
    marketExamples: [
      'WeChat',
      'Alipay',
      'Grab',
      'Gojek',
      'Paytm',
      'Jio',
      'Line',
      'Kakao',
    ],
    regionSignals: ['China', 'India', 'Southeast Asia', 'Japan', 'Korea'],
    pantavionSurface: 'Compass',
    kernelPlacement: 'core/intake/service-category-registry.ts',
    visibility: 'internal-only',
    legalIntegrationMode: [
      'partner-integration',
      'official-api',
      'own-implementation',
      'monitor-only',
    ],
    riskClass: 'high',
    priority: 'p2',
    strengthsToAbsorb: [
      'daily-life service bundling',
      'payments',
      'messaging',
      'mini-app ecosystems',
      'local services',
      'identity utility',
    ],
    weaknessesToInvert: [
      'privacy centralization',
      'state/platform dependency',
      'service overload',
      'closed ecosystem lock-in',
    ],
    requiredKernelServices: [
      'service-registry',
      'identity-scope-control',
      'localization-policy',
      'payment-gate',
      'public-surface-simplifier',
    ],
    sovereigntyRule:
      'Pantavion may learn from superapp breadth but must remain governed, transparent, and user-sovereign.',
    implementationRule:
      'Compass and Work expose life services cleanly without turning the UI into uncontrolled mini-app chaos.',
    notes: [
      'Important for global scale outside Western app patterns.',
    ],
  },
  {
    id: 'protocol-orchestration-stack',
    title: 'Protocol Orchestration Stack',
    family: 'protocol-orchestration',
    marketExamples: [
      'MCP',
      'A2A',
      'OpenAPI',
      'ActivityPub',
      'Matrix',
      'WebRTC',
      'OAuth',
      'OIDC',
    ],
    regionSignals: ['global standards ecosystem'],
    pantavionSurface: 'Kernel',
    kernelPlacement: 'core/protocol/protocol-gateway.ts',
    visibility: 'internal-only',
    legalIntegrationMode: [
      'open-standard',
      'official-api',
      'own-implementation',
    ],
    riskClass: 'critical',
    priority: 'p0',
    strengthsToAbsorb: [
      'agent-to-tool routing',
      'agent-to-agent coordination',
      'identity protocols',
      'real-time communication',
      'federated communication',
      'standardized integration',
    ],
    weaknessesToInvert: [
      'identity gaps',
      'auth inconsistency',
      'tool impersonation risk',
      'observability gaps',
      'workflow provenance gaps',
    ],
    requiredKernelServices: [
      'protocol-gateway',
      'delegation-model',
      'tool-attestation',
      'route-decision-trace',
      'runtime-policy-evaluation',
      'execution-provenance',
    ],
    sovereigntyRule:
      'Pantavion must speak many protocols externally but keep one canonical execution language internally.',
    implementationRule:
      'Protocol Gateway is Tier-1 infrastructure, not an adapter afterthought.',
    notes: [
      'This is one of the strongest strategic layers for Pantavion.',
    ],
  },
];

export function listGlobalCapabilitySignals(): PantavionCapabilitySignalRecord[] {
  return GLOBAL_CAPABILITY_SIGNALS.map((item) => cloneValue(item));
}

export function getGlobalCapabilitySignal(
  id: string,
): PantavionCapabilitySignalRecord | null {
  const found = GLOBAL_CAPABILITY_SIGNALS.find((item) => item.id === id);
  return found ? cloneValue(found) : null;
}

export function listGlobalCapabilitySignalsByFamily(
  family: PantavionCapabilityFamily,
): PantavionCapabilitySignalRecord[] {
  return GLOBAL_CAPABILITY_SIGNALS
    .filter((item) => item.family === family)
    .map((item) => cloneValue(item));
}

export function listRestrictedOrAdminCapabilitySignals(): PantavionCapabilitySignalRecord[] {
  return GLOBAL_CAPABILITY_SIGNALS
    .filter(
      (item) =>
        item.visibility === 'restricted' ||
        item.visibility === 'admin-only' ||
        item.riskClass === 'critical',
    )
    .map((item) => cloneValue(item));
}

export function buildGlobalCapabilityIntakeSnapshot(): PantavionCapabilityIntakeSnapshot {
  const records = listGlobalCapabilitySignals();
  const families = Array.from(new Set(records.map((item) => item.family))).sort();

  return {
    version: GLOBAL_CAPABILITY_INTAKE_REGISTRY_VERSION,
    generatedAt: new Date().toISOString(),
    totalSignals: records.length,
    families,
    p0Count: records.filter((item) => item.priority === 'p0').length,
    p1Count: records.filter((item) => item.priority === 'p1').length,
    restrictedCount: records.filter((item) => item.visibility === 'restricted').length,
    adminOnlyCount: records.filter((item) => item.visibility === 'admin-only').length,
    records,
  };
}

export function summarizeCapabilityFamilies(): Record<PantavionCapabilityFamily, number> {
  return GLOBAL_CAPABILITY_SIGNALS.reduce(
    (acc, item) => {
      acc[item.family] = (acc[item.family] ?? 0) + 1;
      return acc;
    },
    {} as Record<PantavionCapabilityFamily, number>,
  );
}

function cloneValue<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
