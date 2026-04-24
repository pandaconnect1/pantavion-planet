// core/intelligence/prime-ai-orchestrator.ts

export type PrimeAITaskType =
  | 'answer'
  | 'deep-research'
  | 'code'
  | 'build'
  | 'translation'
  | 'voice'
  | 'vision'
  | 'media'
  | 'planning'
  | 'memory'
  | 'safety-review'
  | 'routing'
  | 'automation'
  | 'unknown';

export type PrimeAICapabilityFamily =
  | 'reasoning'
  | 'deep-research'
  | 'coding'
  | 'app-build'
  | 'translation'
  | 'speech-to-text'
  | 'text-to-speech'
  | 'vision-understanding'
  | 'image-generation'
  | 'video-generation'
  | 'audio-generation'
  | 'summarization'
  | 'memory-retrieval'
  | 'workflow-planning'
  | 'agent-orchestration'
  | 'safety-classification'
  | 'policy-analysis'
  | 'cost-control'
  | 'local-sovereign-execution'
  | 'unknown';

export type PrimeAITruthZone =
  | 'deterministic'
  | 'verified'
  | 'generative'
  | 'mixed';

export type PrimeAIMemoryWriteAccess =
  | 'none'
  | 'ephemeral-only'
  | 'session'
  | 'project'
  | 'governor-reviewed'
  | 'forbidden';

export type PrimeAIRiskLevel =
  | 'low'
  | 'medium'
  | 'high'
  | 'critical';

export type PrimeAIExecutionDisposition =
  | 'allow'
  | 'allow-with-constraints'
  | 'review-required'
  | 'deny';

export type PrimeAIProviderKey =
  | 'openai'
  | 'anthropic'
  | 'google'
  | 'microsoft'
  | 'meta'
  | 'xai'
  | 'mistral'
  | 'cohere'
  | 'perplexity'
  | 'deepseek'
  | 'qwen'
  | 'baidu'
  | 'tencent'
  | 'stability'
  | 'elevenlabs'
  | 'local-sovereign'
  | 'pantavion-future-intelligence-bridge';

export interface PrimeAIActorContext {
  actorId?: string;
  actorType: 'human' | 'agent' | 'service' | 'kernel';
  role?: string;
  trustTier?: 'untrusted' | 'basic' | 'trusted' | 'high-trust' | 'system';
  scopes?: string[];
  delegatedBy?: string;
  workspaceId?: string;
  orgId?: string;
}

export interface PrimeAIRequest {
  id: string;
  createdAt: string;
  title: string;
  input: string;
  taskType: PrimeAITaskType;
  requestedCapabilities: PrimeAICapabilityFamily[];
  truthZone: PrimeAITruthZone;
  memoryWriteAccess: PrimeAIMemoryWriteAccess;
  sensitivity: 'public' | 'internal' | 'confidential' | 'restricted';
  riskLevel: PrimeAIRiskLevel;
  locale?: string;
  targetSurface?: string;
  actor: PrimeAIActorContext;
  metadata: Record<string, unknown>;
}

export interface PrimeAIProviderProfile {
  providerKey: PrimeAIProviderKey;
  displayName: string;
  enabled: boolean;
  providerClass:
    | 'frontier-model'
    | 'research-answer-engine'
    | 'open-model'
    | 'media-model'
    | 'voice-model'
    | 'sovereign-local'
    | 'future-bridge';

  capabilityFamilies: PrimeAICapabilityFamily[];

  strengths: string[];
  constraints: string[];

  realtimeCapable: boolean;
  multimodalCapable: boolean;
  codeCapable: boolean;
  researchCapable: boolean;
  voiceCapable: boolean;
  mediaCapable: boolean;
  localOrSovereignCapable: boolean;

  maxRiskAllowed: PrimeAIRiskLevel;
  defaultTruthZone: PrimeAITruthZone;
  memoryWriteAccess: PrimeAIMemoryWriteAccess;

  relativeCost: number;
  relativeLatency: number;
  reliabilityScore: number;
  governanceScore: number;
  qualityScore: number;

  complianceSensitive: boolean;
  requiresHumanReviewForRestricted: boolean;
  notes: string[];
}

export interface PrimeAIProviderScore {
  providerKey: PrimeAIProviderKey;
  displayName: string;
  score: number;
  reasons: string[];
  blockers: string[];
  matchedCapabilities: PrimeAICapabilityFamily[];
}

export interface PrimeAIGovernanceDecision {
  disposition: PrimeAIExecutionDisposition;
  riskLevel: PrimeAIRiskLevel;
  allowedCapabilities: PrimeAICapabilityFamily[];
  blockedCapabilities: PrimeAICapabilityFamily[];
  constraints: string[];
  requiredApprovals: string[];
  appliedRules: string[];
  reasons: string[];
}

export interface PrimeAIExecutionPlanStep {
  id: string;
  label: string;
  capability: PrimeAICapabilityFamily;
  providerKey?: PrimeAIProviderKey;
  state:
    | 'queued'
    | 'ready'
    | 'running'
    | 'input-required'
    | 'auth-required'
    | 'completed'
    | 'failed'
    | 'blocked';
  requiresEvidence: boolean;
  requiresHumanReview: boolean;
  rollbackAvailable: boolean;
}

export interface PrimeAIExecutionPlan {
  id: string;
  requestId: string;
  primaryProvider?: PrimeAIProviderKey;
  fallbackProviders: PrimeAIProviderKey[];
  executionMode:
    | 'route-packet-only'
    | 'single-provider'
    | 'multi-provider'
    | 'local-sovereign'
    | 'blocked';
  steps: PrimeAIExecutionPlanStep[];
  estimatedCostClass: 'low' | 'medium' | 'high' | 'unknown';
  estimatedLatencyClass: 'fast' | 'normal' | 'slow' | 'unknown';
  requiresEvidence: boolean;
  requiresHumanReview: boolean;
  canResume: boolean;
  canFallback: boolean;
}

export interface PrimeAIRouteDecision {
  id: string;
  createdAt: string;
  request: PrimeAIRequest;
  governance: PrimeAIGovernanceDecision;
  rankedProviders: PrimeAIProviderScore[];
  selectedProvider?: PrimeAIProviderScore;
  executionPlan: PrimeAIExecutionPlan;
  explanation: {
    summary: string;
    whyThisProvider: string[];
    whyNotOthers: string[];
    safetyNotes: string[];
    missingCapabilities: string[];
    nextKernelActions: string[];
  };
}

const RISK_ORDER: PrimeAIRiskLevel[] = ['low', 'medium', 'high', 'critical'];

export const PRIME_AI_PROVIDER_PROFILES: PrimeAIProviderProfile[] = [
  {
    providerKey: 'openai',
    displayName: 'OpenAI',
    enabled: true,
    providerClass: 'frontier-model',
    capabilityFamilies: [
      'reasoning',
      'deep-research',
      'coding',
      'app-build',
      'translation',
      'vision-understanding',
      'summarization',
      'workflow-planning',
      'agent-orchestration',
      'safety-classification',
      'policy-analysis',
    ],
    strengths: [
      'general reasoning',
      'code generation',
      'multimodal orchestration',
      'tool-use planning',
    ],
    constraints: [
      'requires external provider governance',
      'must not write long-term memory without kernel approval',
    ],
    realtimeCapable: true,
    multimodalCapable: true,
    codeCapable: true,
    researchCapable: true,
    voiceCapable: true,
    mediaCapable: false,
    localOrSovereignCapable: false,
    maxRiskAllowed: 'high',
    defaultTruthZone: 'mixed',
    memoryWriteAccess: 'governor-reviewed',
    relativeCost: 0.62,
    relativeLatency: 0.42,
    reliabilityScore: 0.9,
    governanceScore: 0.86,
    qualityScore: 0.94,
    complianceSensitive: true,
    requiresHumanReviewForRestricted: true,
    notes: ['Primary general intelligence candidate.'],
  },
  {
    providerKey: 'anthropic',
    displayName: 'Anthropic',
    enabled: true,
    providerClass: 'frontier-model',
    capabilityFamilies: [
      'reasoning',
      'coding',
      'deep-research',
      'summarization',
      'policy-analysis',
      'safety-classification',
      'workflow-planning',
    ],
    strengths: [
      'long-form reasoning',
      'policy-sensitive analysis',
      'structured writing',
    ],
    constraints: [
      'external provider dependency',
      'restricted execution still needs Pantavion approval gate',
    ],
    realtimeCapable: false,
    multimodalCapable: true,
    codeCapable: true,
    researchCapable: true,
    voiceCapable: false,
    mediaCapable: false,
    localOrSovereignCapable: false,
    maxRiskAllowed: 'high',
    defaultTruthZone: 'mixed',
    memoryWriteAccess: 'governor-reviewed',
    relativeCost: 0.68,
    relativeLatency: 0.52,
    reliabilityScore: 0.88,
    governanceScore: 0.9,
    qualityScore: 0.91,
    complianceSensitive: true,
    requiresHumanReviewForRestricted: true,
    notes: ['Strong analysis and review candidate.'],
  },
  {
    providerKey: 'google',
    displayName: 'Google AI',
    enabled: true,
    providerClass: 'frontier-model',
    capabilityFamilies: [
      'reasoning',
      'deep-research',
      'translation',
      'vision-understanding',
      'summarization',
      'workflow-planning',
    ],
    strengths: [
      'web-scale ecosystem alignment',
      'multimodal reasoning',
      'translation and search-adjacent workflows',
    ],
    constraints: [
      'external provider governance required',
      'source handling must stay explicit',
    ],
    realtimeCapable: true,
    multimodalCapable: true,
    codeCapable: true,
    researchCapable: true,
    voiceCapable: true,
    mediaCapable: false,
    localOrSovereignCapable: false,
    maxRiskAllowed: 'high',
    defaultTruthZone: 'verified',
    memoryWriteAccess: 'governor-reviewed',
    relativeCost: 0.58,
    relativeLatency: 0.4,
    reliabilityScore: 0.88,
    governanceScore: 0.82,
    qualityScore: 0.89,
    complianceSensitive: true,
    requiresHumanReviewForRestricted: true,
    notes: ['Useful for search, multilingual, and multimodal routing families.'],
  },
  {
    providerKey: 'microsoft',
    displayName: 'Microsoft AI',
    enabled: true,
    providerClass: 'frontier-model',
    capabilityFamilies: [
      'reasoning',
      'coding',
      'summarization',
      'workflow-planning',
      'agent-orchestration',
      'policy-analysis',
    ],
    strengths: [
      'enterprise workflow alignment',
      'office/productivity integration patterns',
      'identity and business ecosystem fit',
    ],
    constraints: [
      'enterprise integration governance required',
      'tenant boundaries must be enforced',
    ],
    realtimeCapable: true,
    multimodalCapable: true,
    codeCapable: true,
    researchCapable: true,
    voiceCapable: false,
    mediaCapable: false,
    localOrSovereignCapable: false,
    maxRiskAllowed: 'high',
    defaultTruthZone: 'mixed',
    memoryWriteAccess: 'governor-reviewed',
    relativeCost: 0.64,
    relativeLatency: 0.48,
    reliabilityScore: 0.87,
    governanceScore: 0.88,
    qualityScore: 0.86,
    complianceSensitive: true,
    requiresHumanReviewForRestricted: true,
    notes: ['Enterprise and productivity orchestration candidate.'],
  },
  {
    providerKey: 'meta',
    displayName: 'Meta / Open Model Family',
    enabled: true,
    providerClass: 'open-model',
    capabilityFamilies: [
      'reasoning',
      'coding',
      'summarization',
      'local-sovereign-execution',
    ],
    strengths: [
      'open model ecosystem',
      'self-hosting candidate',
      'sovereign fallback potential',
    ],
    constraints: [
      'quality varies by deployed model',
      'requires local evaluation and guardrail stack',
    ],
    realtimeCapable: false,
    multimodalCapable: false,
    codeCapable: true,
    researchCapable: false,
    voiceCapable: false,
    mediaCapable: false,
    localOrSovereignCapable: true,
    maxRiskAllowed: 'medium',
    defaultTruthZone: 'generative',
    memoryWriteAccess: 'project',
    relativeCost: 0.28,
    relativeLatency: 0.35,
    reliabilityScore: 0.72,
    governanceScore: 0.78,
    qualityScore: 0.74,
    complianceSensitive: false,
    requiresHumanReviewForRestricted: true,
    notes: ['Good candidate for controlled self-hosted fallback.'],
  },
  {
    providerKey: 'xai',
    displayName: 'xAI',
    enabled: true,
    providerClass: 'frontier-model',
    capabilityFamilies: [
      'reasoning',
      'summarization',
      'workflow-planning',
    ],
    strengths: [
      'general reasoning candidate',
      'social-signal-adjacent routing candidate',
    ],
    constraints: [
      'must be evaluated against Pantavion truth and safety policy',
    ],
    realtimeCapable: true,
    multimodalCapable: true,
    codeCapable: true,
    researchCapable: false,
    voiceCapable: false,
    mediaCapable: false,
    localOrSovereignCapable: false,
    maxRiskAllowed: 'medium',
    defaultTruthZone: 'generative',
    memoryWriteAccess: 'session',
    relativeCost: 0.55,
    relativeLatency: 0.45,
    reliabilityScore: 0.75,
    governanceScore: 0.68,
    qualityScore: 0.78,
    complianceSensitive: true,
    requiresHumanReviewForRestricted: true,
    notes: ['Monitor as external model candidate, not trusted by default.'],
  },
  {
    providerKey: 'perplexity',
    displayName: 'Perplexity-style Research Engine',
    enabled: true,
    providerClass: 'research-answer-engine',
    capabilityFamilies: [
      'deep-research',
      'summarization',
      'policy-analysis',
    ],
    strengths: [
      'source-seeking answer pattern',
      'research routing',
      'comparison and evidence gathering',
    ],
    constraints: [
      'source quality must be verified by Pantavion',
      'not a memory authority',
    ],
    realtimeCapable: true,
    multimodalCapable: false,
    codeCapable: false,
    researchCapable: true,
    voiceCapable: false,
    mediaCapable: false,
    localOrSovereignCapable: false,
    maxRiskAllowed: 'medium',
    defaultTruthZone: 'verified',
    memoryWriteAccess: 'none',
    relativeCost: 0.42,
    relativeLatency: 0.32,
    reliabilityScore: 0.8,
    governanceScore: 0.74,
    qualityScore: 0.82,
    complianceSensitive: true,
    requiresHumanReviewForRestricted: true,
    notes: ['Useful for evidence-seeking, never final truth without validation.'],
  },
  {
    providerKey: 'deepseek',
    displayName: 'DeepSeek',
    enabled: true,
    providerClass: 'open-model',
    capabilityFamilies: [
      'reasoning',
      'coding',
      'summarization',
      'local-sovereign-execution',
    ],
    strengths: [
      'coding and reasoning candidate',
      'cost-sensitive fallback candidate',
    ],
    constraints: [
      'requires jurisdiction and provider-risk evaluation',
      'do not route restricted data by default',
    ],
    realtimeCapable: false,
    multimodalCapable: false,
    codeCapable: true,
    researchCapable: false,
    voiceCapable: false,
    mediaCapable: false,
    localOrSovereignCapable: true,
    maxRiskAllowed: 'medium',
    defaultTruthZone: 'generative',
    memoryWriteAccess: 'none',
    relativeCost: 0.22,
    relativeLatency: 0.38,
    reliabilityScore: 0.72,
    governanceScore: 0.62,
    qualityScore: 0.78,
    complianceSensitive: true,
    requiresHumanReviewForRestricted: true,
    notes: ['Cost-aware coding fallback candidate with strict data boundaries.'],
  },
  {
    providerKey: 'qwen',
    displayName: 'Qwen / Alibaba Model Family',
    enabled: true,
    providerClass: 'open-model',
    capabilityFamilies: [
      'reasoning',
      'coding',
      'translation',
      'summarization',
      'local-sovereign-execution',
    ],
    strengths: [
      'multilingual Asia-market candidate',
      'open deployment candidate',
    ],
    constraints: [
      'jurisdiction and provider policy review required',
      'restricted data disabled by default',
    ],
    realtimeCapable: false,
    multimodalCapable: true,
    codeCapable: true,
    researchCapable: false,
    voiceCapable: false,
    mediaCapable: false,
    localOrSovereignCapable: true,
    maxRiskAllowed: 'medium',
    defaultTruthZone: 'generative',
    memoryWriteAccess: 'none',
    relativeCost: 0.24,
    relativeLatency: 0.42,
    reliabilityScore: 0.7,
    governanceScore: 0.6,
    qualityScore: 0.76,
    complianceSensitive: true,
    requiresHumanReviewForRestricted: true,
    notes: ['Global coverage candidate, never unrestricted by default.'],
  },
  {
    providerKey: 'mistral',
    displayName: 'Mistral',
    enabled: true,
    providerClass: 'open-model',
    capabilityFamilies: [
      'reasoning',
      'coding',
      'summarization',
      'local-sovereign-execution',
    ],
    strengths: [
      'European/open model ecosystem candidate',
      'self-hosting and sovereignty path',
    ],
    constraints: [
      'model choice and deployment quality must be evaluated',
    ],
    realtimeCapable: false,
    multimodalCapable: false,
    codeCapable: true,
    researchCapable: false,
    voiceCapable: false,
    mediaCapable: false,
    localOrSovereignCapable: true,
    maxRiskAllowed: 'medium',
    defaultTruthZone: 'generative',
    memoryWriteAccess: 'project',
    relativeCost: 0.3,
    relativeLatency: 0.38,
    reliabilityScore: 0.76,
    governanceScore: 0.82,
    qualityScore: 0.78,
    complianceSensitive: false,
    requiresHumanReviewForRestricted: true,
    notes: ['Strong sovereignty-aligned candidate.'],
  },
  {
    providerKey: 'stability',
    displayName: 'Stability / Image Model Family',
    enabled: true,
    providerClass: 'media-model',
    capabilityFamilies: [
      'image-generation',
      'media',
    ].filter(isPrimeAICapabilityFamily),
    strengths: [
      'image generation candidate',
      'creative media workflow candidate',
    ],
    constraints: [
      'needs brand, likeness, safety and copyright policy gates',
    ],
    realtimeCapable: false,
    multimodalCapable: false,
    codeCapable: false,
    researchCapable: false,
    voiceCapable: false,
    mediaCapable: true,
    localOrSovereignCapable: false,
    maxRiskAllowed: 'medium',
    defaultTruthZone: 'generative',
    memoryWriteAccess: 'none',
    relativeCost: 0.46,
    relativeLatency: 0.58,
    reliabilityScore: 0.72,
    governanceScore: 0.7,
    qualityScore: 0.8,
    complianceSensitive: true,
    requiresHumanReviewForRestricted: true,
    notes: ['Media-only candidate, never used for identity-sensitive generation without review.'],
  },
  {
    providerKey: 'elevenlabs',
    displayName: 'ElevenLabs / Voice Model Family',
    enabled: true,
    providerClass: 'voice-model',
    capabilityFamilies: [
      'text-to-speech',
      'speech-to-text',
      'audio-generation',
      'translation',
    ],
    strengths: [
      'voice and speech candidate',
      'multilingual spoken output candidate',
    ],
    constraints: [
      'voice cloning and biometric-like risks require strong policy gates',
    ],
    realtimeCapable: true,
    multimodalCapable: false,
    codeCapable: false,
    researchCapable: false,
    voiceCapable: true,
    mediaCapable: true,
    localOrSovereignCapable: false,
    maxRiskAllowed: 'medium',
    defaultTruthZone: 'generative',
    memoryWriteAccess: 'none',
    relativeCost: 0.5,
    relativeLatency: 0.36,
    reliabilityScore: 0.78,
    governanceScore: 0.72,
    qualityScore: 0.85,
    complianceSensitive: true,
    requiresHumanReviewForRestricted: true,
    notes: ['Voice runtime candidate with strict consent and misuse controls.'],
  },
  {
    providerKey: 'local-sovereign',
    displayName: 'Pantavion Local Sovereign Runtime',
    enabled: true,
    providerClass: 'sovereign-local',
    capabilityFamilies: [
      'reasoning',
      'coding',
      'summarization',
      'memory-retrieval',
      'safety-classification',
      'local-sovereign-execution',
    ],
    strengths: [
      'offline or sovereign fallback',
      'sensitive routing candidate',
      'resilience against provider outages',
    ],
    constraints: [
      'quality depends on deployed local models',
      'must stay behind evaluation harness',
    ],
    realtimeCapable: false,
    multimodalCapable: false,
    codeCapable: true,
    researchCapable: false,
    voiceCapable: false,
    mediaCapable: false,
    localOrSovereignCapable: true,
    maxRiskAllowed: 'critical',
    defaultTruthZone: 'deterministic',
    memoryWriteAccess: 'governor-reviewed',
    relativeCost: 0.18,
    relativeLatency: 0.55,
    reliabilityScore: 0.7,
    governanceScore: 0.95,
    qualityScore: 0.68,
    complianceSensitive: false,
    requiresHumanReviewForRestricted: true,
    notes: ['Sovereignty and resilience lane; quality must be evaluated per model.'],
  },
  {
    providerKey: 'pantavion-future-intelligence-bridge',
    displayName: 'Pantavion Future Intelligence Bridge',
    enabled: true,
    providerClass: 'future-bridge',
    capabilityFamilies: [
      'reasoning',
      'deep-research',
      'coding',
      'app-build',
      'translation',
      'vision-understanding',
      'workflow-planning',
      'agent-orchestration',
      'memory-retrieval',
      'safety-classification',
      'policy-analysis',
      'cost-control',
    ],
    strengths: [
      'future model absorption',
      'post-current-AI compatibility',
      'constitutional continuity',
    ],
    constraints: [
      'not a real provider endpoint yet',
      'must only emit route packets until concrete adapter exists',
    ],
    realtimeCapable: true,
    multimodalCapable: true,
    codeCapable: true,
    researchCapable: true,
    voiceCapable: true,
    mediaCapable: true,
    localOrSovereignCapable: true,
    maxRiskAllowed: 'critical',
    defaultTruthZone: 'mixed',
    memoryWriteAccess: 'governor-reviewed',
    relativeCost: 0.5,
    relativeLatency: 0.5,
    reliabilityScore: 0.5,
    governanceScore: 1,
    qualityScore: 0.5,
    complianceSensitive: true,
    requiresHumanReviewForRestricted: true,
    notes: ['Placeholder bridge so Pantavion can absorb future intelligence generations safely.'],
  },
];

export function normalizePrimeAIRequest(
  partial: Partial<PrimeAIRequest> & { input?: string; title?: string },
): PrimeAIRequest {
  const input = cleanText(partial.input, cleanText(partial.title, ''));
  const title = cleanText(partial.title, 'Prime AI request');
  const taskType = partial.taskType ?? inferTaskType(`${title} ${input}`);
  const requestedCapabilities =
    partial.requestedCapabilities && partial.requestedCapabilities.length > 0
      ? uniqueCapabilities(partial.requestedCapabilities)
      : inferCapabilities(taskType, `${title} ${input}`);

  const sensitivity = partial.sensitivity ?? inferSensitivity(`${title} ${input}`);
  const riskLevel = partial.riskLevel ?? inferRiskLevel(`${title} ${input}`, sensitivity, taskType);
  const truthZone = partial.truthZone ?? inferTruthZone(taskType, `${title} ${input}`);
  const memoryWriteAccess =
    partial.memoryWriteAccess ?? inferMemoryWriteAccess(truthZone, sensitivity, taskType);

  return {
    id: cleanText(partial.id, createPrimeAIId('pai_req')),
    createdAt: cleanText(partial.createdAt, nowIso()),
    title,
    input,
    taskType,
    requestedCapabilities,
    truthZone,
    memoryWriteAccess,
    sensitivity,
    riskLevel,
    locale: cleanOptionalText(partial.locale),
    targetSurface: cleanOptionalText(partial.targetSurface),
    actor: {
      actorId: cleanOptionalText(partial.actor?.actorId),
      actorType: partial.actor?.actorType ?? 'human',
      role: cleanOptionalText(partial.actor?.role),
      trustTier: partial.actor?.trustTier ?? 'basic',
      scopes: uniqueStrings(partial.actor?.scopes ?? []),
      delegatedBy: cleanOptionalText(partial.actor?.delegatedBy),
      workspaceId: cleanOptionalText(partial.actor?.workspaceId),
      orgId: cleanOptionalText(partial.actor?.orgId),
    },
    metadata: sanitizeMetadata(partial.metadata),
  };
}

export function routePrimeAIRequest(
  input: Partial<PrimeAIRequest> & { input?: string; title?: string },
): PrimeAIRouteDecision {
  const request = normalizePrimeAIRequest(input);
  const governance = evaluatePrimeAIGovernance(request);
  const rankedProviders = rankPrimeAIProviders(request, governance);
  const selectedProvider = rankedProviders.find((item) => item.blockers.length === 0);
  const executionPlan = buildPrimeAIExecutionPlan(request, governance, rankedProviders, selectedProvider);
  const explanation = buildPrimeAIExplanation(request, governance, rankedProviders, selectedProvider, executionPlan);

  return {
    id: createPrimeAIId('pai_route'),
    createdAt: nowIso(),
    request,
    governance,
    rankedProviders,
    selectedProvider,
    executionPlan,
    explanation,
  };
}

export function evaluatePrimeAIGovernance(
  request: PrimeAIRequest,
): PrimeAIGovernanceDecision {
  const blockedCapabilities: PrimeAICapabilityFamily[] = [];
  const constraints: string[] = [];
  const requiredApprovals: string[] = [];
  const appliedRules: string[] = [];
  const reasons: string[] = [];
  let disposition: PrimeAIExecutionDisposition = 'allow';

  appliedRules.push('prime-ai-no-ungoverned-provider-execution');
  constraints.push('All provider calls must pass through Kernel / Protocol Gateway.');
  constraints.push('No external provider may write long-term memory directly.');

  if (request.sensitivity === 'restricted') {
    disposition = 'review-required';
    requiredApprovals.push('security-governor-approval');
    requiredApprovals.push('identity-and-delegation-check');
    constraints.push('Restricted data must not leave approved execution boundary.');
    appliedRules.push('restricted-data-boundary');
    reasons.push('Restricted sensitivity requires review before AI routing.');
  }

  if (request.riskLevel === 'critical') {
    disposition = 'review-required';
    requiredApprovals.push('executive-or-admin-review');
    constraints.push('Critical risk task requires human authority before execution.');
    appliedRules.push('critical-risk-human-authority');
    reasons.push('Critical risk cannot be executed autonomously.');
  }

  if (request.taskType === 'safety-review') {
    constraints.push('Safety review output is advisory until confirmed by policy engine.');
    appliedRules.push('safety-review-advisory-only');
  }

  if (request.taskType === 'deep-research' || request.truthZone === 'verified') {
    constraints.push('Verified outputs require source/evidence trail.');
    constraints.push('No unsupported factual claim may be promoted to governed memory.');
    appliedRules.push('verified-truth-zone-evidence-required');
  }

  if (request.memoryWriteAccess === 'governor-reviewed') {
    constraints.push('Memory write requires governor-reviewed promotion packet.');
    appliedRules.push('memory-sovereignty-gate');
  }

  if (
    request.requestedCapabilities.includes('voice-cloning' as PrimeAICapabilityFamily) ||
    request.input.toLowerCase().includes('clone voice')
  ) {
    blockedCapabilities.push('text-to-speech');
    disposition = 'review-required';
    requiredApprovals.push('voice-consent-review');
    appliedRules.push('voice-consent-protection');
    reasons.push('Voice-cloning-like request requires explicit consent review.');
  }

  const cyberRisk =
    request.input.toLowerCase().includes('hack') ||
    request.input.toLowerCase().includes('exploit') ||
    request.input.toLowerCase().includes('malware');

  if (cyberRisk) {
    disposition = 'review-required';
    requiredApprovals.push('defensive-cyber-review');
    constraints.push('Cyber/security capability is defensive-first, audit-logged, and restricted.');
    appliedRules.push('defensive-cyber-only');
    reasons.push('Cyber-risk language detected; route only through defensive/admin guardrails.');
  }

  const allowedCapabilities = request.requestedCapabilities.filter(
    (capability) => !blockedCapabilities.includes(capability),
  );

  if (reasons.length === 0) {
    reasons.push('No hard AI routing block detected.');
  }

  if (disposition === 'allow' && constraints.length > 2) {
    disposition = 'allow-with-constraints';
  }

  return {
    disposition,
    riskLevel: request.riskLevel,
    allowedCapabilities,
    blockedCapabilities: uniqueCapabilities(blockedCapabilities),
    constraints: uniqueStrings(constraints),
    requiredApprovals: uniqueStrings(requiredApprovals),
    appliedRules: uniqueStrings(appliedRules),
    reasons: uniqueStrings(reasons),
  };
}

export function rankPrimeAIProviders(
  request: PrimeAIRequest,
  governance: PrimeAIGovernanceDecision,
): PrimeAIProviderScore[] {
  return PRIME_AI_PROVIDER_PROFILES
    .filter((profile) => profile.enabled)
    .map((profile) => scorePrimeAIProvider(profile, request, governance))
    .sort((left, right) => right.score - left.score);
}

export function getPrimeAIProviderProfile(
  providerKey: PrimeAIProviderKey,
): PrimeAIProviderProfile | null {
  return PRIME_AI_PROVIDER_PROFILES.find((profile) => profile.providerKey === providerKey) ?? null;
}

export function getPrimeAIProviderProfiles(): PrimeAIProviderProfile[] {
  return PRIME_AI_PROVIDER_PROFILES.map((profile) => cloneValue(profile));
}

export function getPrimeAIReadinessSnapshot(): {
  generatedAt: string;
  providerCount: number;
  enabledProviderCount: number;
  frontierProviderCount: number;
  openOrSovereignProviderCount: number;
  voiceProviderCount: number;
  mediaProviderCount: number;
  researchProviderCount: number;
  governanceReadyCount: number;
  warnings: string[];
} {
  const enabled = PRIME_AI_PROVIDER_PROFILES.filter((profile) => profile.enabled);
  const warnings: string[] = [];

  if (!enabled.some((profile) => profile.localOrSovereignCapable)) {
    warnings.push('No local sovereign provider candidate enabled.');
  }

  if (!enabled.some((profile) => profile.researchCapable)) {
    warnings.push('No research-capable provider candidate enabled.');
  }

  if (!enabled.some((profile) => profile.voiceCapable)) {
    warnings.push('No voice-capable provider candidate enabled.');
  }

  return {
    generatedAt: nowIso(),
    providerCount: PRIME_AI_PROVIDER_PROFILES.length,
    enabledProviderCount: enabled.length,
    frontierProviderCount: enabled.filter((profile) => profile.providerClass === 'frontier-model').length,
    openOrSovereignProviderCount: enabled.filter(
      (profile) => profile.providerClass === 'open-model' || profile.providerClass === 'sovereign-local',
    ).length,
    voiceProviderCount: enabled.filter((profile) => profile.voiceCapable).length,
    mediaProviderCount: enabled.filter((profile) => profile.mediaCapable).length,
    researchProviderCount: enabled.filter((profile) => profile.researchCapable).length,
    governanceReadyCount: enabled.filter((profile) => profile.governanceScore >= 0.8).length,
    warnings,
  };
}

function scorePrimeAIProvider(
  profile: PrimeAIProviderProfile,
  request: PrimeAIRequest,
  governance: PrimeAIGovernanceDecision,
): PrimeAIProviderScore {
  const reasons: string[] = [];
  const blockers: string[] = [];
  const matchedCapabilities = request.requestedCapabilities.filter((capability) =>
    profile.capabilityFamilies.includes(capability),
  );

  if (governance.disposition === 'deny') {
    blockers.push('Governance denied this request.');
  }

  if (!riskAllowed(profile.maxRiskAllowed, request.riskLevel)) {
    blockers.push(`Provider max risk "${profile.maxRiskAllowed}" is lower than request risk "${request.riskLevel}".`);
  }

  if (request.sensitivity === 'restricted' && profile.requiresHumanReviewForRestricted) {
    blockers.push('Restricted request requires review before this provider can be used.');
  }

  if (request.sensitivity === 'restricted' && !profile.localOrSovereignCapable) {
    blockers.push('Restricted data cannot be routed to non-sovereign external provider by default.');
  }

  if (matchedCapabilities.length === 0) {
    blockers.push('No requested capability matched.');
  }

  let score = 0;

  score += matchedCapabilities.length / Math.max(1, request.requestedCapabilities.length) * 0.34;
  score += profile.qualityScore * 0.2;
  score += profile.reliabilityScore * 0.16;
  score += profile.governanceScore * 0.16;
  score += (1 - profile.relativeCost) * 0.06;
  score += (1 - profile.relativeLatency) * 0.04;

  if (request.taskType === 'deep-research' && profile.researchCapable) score += 0.08;
  if ((request.taskType === 'code' || request.taskType === 'build') && profile.codeCapable) score += 0.08;
  if ((request.taskType === 'voice' || request.taskType === 'translation') && profile.voiceCapable) score += 0.08;
  if ((request.taskType === 'vision' || request.taskType === 'media') && profile.multimodalCapable) score += 0.05;
  if (request.sensitivity === 'restricted' && profile.localOrSovereignCapable) score += 0.12;
  if (profile.providerClass === 'future-bridge') score -= 0.12;

  if (blockers.length > 0) {
    score = Math.min(score, 0.19);
  }

  if (matchedCapabilities.length > 0) {
    reasons.push(`Matched capabilities: ${matchedCapabilities.join(', ')}.`);
  }

  reasons.push(`Quality score ${profile.qualityScore.toFixed(2)}, governance score ${profile.governanceScore.toFixed(2)}.`);
  reasons.push(`Cost factor ${profile.relativeCost.toFixed(2)}, latency factor ${profile.relativeLatency.toFixed(2)}.`);

  return {
    providerKey: profile.providerKey,
    displayName: profile.displayName,
    score: clamp(score, 0, 1),
    reasons,
    blockers,
    matchedCapabilities,
  };
}

function buildPrimeAIExecutionPlan(
  request: PrimeAIRequest,
  governance: PrimeAIGovernanceDecision,
  rankedProviders: PrimeAIProviderScore[],
  selectedProvider?: PrimeAIProviderScore,
): PrimeAIExecutionPlan {
  const id = createPrimeAIId('pai_plan');
  const allowedProviders = rankedProviders.filter((provider) => provider.blockers.length === 0);
  const fallbackProviders = allowedProviders
    .filter((provider) => provider.providerKey !== selectedProvider?.providerKey)
    .slice(0, 3)
    .map((provider) => provider.providerKey);

  const blocked =
    governance.disposition === 'deny' ||
    !selectedProvider ||
    selectedProvider.blockers.length > 0;

  const executionMode = blocked
    ? 'blocked'
    : request.sensitivity === 'restricted'
      ? 'local-sovereign'
      : fallbackProviders.length > 0
        ? 'multi-provider'
        : 'single-provider';

  const steps = buildExecutionSteps(request, selectedProvider, blocked);

  return {
    id,
    requestId: request.id,
    primaryProvider: selectedProvider?.providerKey,
    fallbackProviders,
    executionMode,
    steps,
    estimatedCostClass: estimateCostClass(selectedProvider),
    estimatedLatencyClass: estimateLatencyClass(selectedProvider),
    requiresEvidence: request.truthZone === 'verified' || request.taskType === 'deep-research',
    requiresHumanReview:
      governance.disposition === 'review-required' ||
      request.sensitivity === 'restricted' ||
      request.riskLevel === 'critical',
    canResume: true,
    canFallback: fallbackProviders.length > 0,
  };
}

function buildExecutionSteps(
  request: PrimeAIRequest,
  selectedProvider: PrimeAIProviderScore | undefined,
  blocked: boolean,
): PrimeAIExecutionPlanStep[] {
  const baseCapabilities =
    request.requestedCapabilities.length > 0
      ? request.requestedCapabilities
      : inferCapabilities(request.taskType, request.input);

  return baseCapabilities.map((capability, index) => ({
    id: createPrimeAIId(`pai_step_${index + 1}`),
    label: labelForCapability(capability),
    capability,
    providerKey: selectedProvider?.providerKey,
    state: blocked ? 'blocked' : 'ready',
    requiresEvidence:
      capability === 'deep-research' ||
      capability === 'policy-analysis' ||
      request.truthZone === 'verified',
    requiresHumanReview:
      request.riskLevel === 'critical' ||
      request.sensitivity === 'restricted' ||
      capability === 'safety-classification',
    rollbackAvailable:
      capability === 'agent-orchestration' ||
      capability === 'workflow-planning' ||
      capability === 'app-build',
  }));
}

function buildPrimeAIExplanation(
  request: PrimeAIRequest,
  governance: PrimeAIGovernanceDecision,
  rankedProviders: PrimeAIProviderScore[],
  selectedProvider: PrimeAIProviderScore | undefined,
  executionPlan: PrimeAIExecutionPlan,
): PrimeAIRouteDecision['explanation'] {
  const missingCapabilities = request.requestedCapabilities.filter(
    (capability) => !rankedProviders.some((provider) => provider.matchedCapabilities.includes(capability)),
  );

  return {
    summary: selectedProvider
      ? `Prime AI selected ${selectedProvider.displayName} with ${executionPlan.executionMode} mode.`
      : 'Prime AI could not select a provider without review or additional capability coverage.',
    whyThisProvider: selectedProvider
      ? selectedProvider.reasons
      : ['No provider passed all governance and capability gates.'],
    whyNotOthers: rankedProviders
      .filter((provider) => provider.providerKey !== selectedProvider?.providerKey)
      .slice(0, 5)
      .flatMap((provider) =>
        provider.blockers.length > 0
          ? [`${provider.displayName}: ${provider.blockers.join(' | ')}`]
          : [`${provider.displayName}: lower score ${provider.score.toFixed(2)}.`],
      ),
    safetyNotes: uniqueStrings([
      ...governance.constraints,
      ...governance.reasons,
    ]),
    missingCapabilities,
    nextKernelActions: buildNextKernelActions(governance, executionPlan, missingCapabilities),
  };
}

function buildNextKernelActions(
  governance: PrimeAIGovernanceDecision,
  executionPlan: PrimeAIExecutionPlan,
  missingCapabilities: PrimeAICapabilityFamily[],
): string[] {
  const actions: string[] = [];

  if (governance.disposition === 'review-required') {
    actions.push('create-ai-approval-packet');
  }

  if (executionPlan.executionMode === 'blocked') {
    actions.push('do-not-dispatch-provider-call');
    actions.push('return-to-kernel-policy-review');
  } else {
    actions.push('emit-prime-ai-route-packet');
    actions.push('record-provider-decision-trace');
  }

  if (executionPlan.requiresEvidence) {
    actions.push('attach-evidence-requirement');
  }

  if (executionPlan.canFallback) {
    actions.push('enable-provider-fallback-policy');
  }

  if (missingCapabilities.length > 0) {
    actions.push('register-missing-ai-capability-gap');
  }

  return uniqueStrings(actions);
}

function inferTaskType(text: string): PrimeAITaskType {
  const source = text.toLowerCase();

  if (hasAny(source, ['deep research', 'research', 'verify', 'sources', 'evidence'])) return 'deep-research';
  if (hasAny(source, ['code', 'typescript', 'tsx', 'function', 'class'])) return 'code';
  if (hasAny(source, ['build', 'app', 'website', 'implementation', 'kernel'])) return 'build';
  if (hasAny(source, ['translate', 'translation', 'language'])) return 'translation';
  if (hasAny(source, ['voice', 'speech', 'stt', 'tts', 'interpreter'])) return 'voice';
  if (hasAny(source, ['image', 'screenshot', 'vision', 'photo'])) return 'vision';
  if (hasAny(source, ['video', 'music', 'audio', 'media'])) return 'media';
  if (hasAny(source, ['plan', 'strategy', 'roadmap'])) return 'planning';
  if (hasAny(source, ['memory', 'remember', 'continuity'])) return 'memory';
  if (hasAny(source, ['safety', 'policy', 'risk', 'security'])) return 'safety-review';
  if (hasAny(source, ['route', 'dispatch', 'orchestrate'])) return 'routing';
  if (hasAny(source, ['automation', 'workflow', 'agent'])) return 'automation';

  return 'answer';
}

function inferCapabilities(
  taskType: PrimeAITaskType,
  text: string,
): PrimeAICapabilityFamily[] {
  const source = text.toLowerCase();
  const out: PrimeAICapabilityFamily[] = [];

  switch (taskType) {
    case 'deep-research':
      out.push('deep-research', 'summarization', 'policy-analysis');
      break;
    case 'code':
      out.push('coding', 'reasoning');
      break;
    case 'build':
      out.push('app-build', 'coding', 'workflow-planning', 'agent-orchestration');
      break;
    case 'translation':
      out.push('translation', 'reasoning');
      break;
    case 'voice':
      out.push('speech-to-text', 'text-to-speech', 'translation');
      break;
    case 'vision':
      out.push('vision-understanding', 'reasoning');
      break;
    case 'media':
      out.push('image-generation', 'video-generation', 'audio-generation');
      break;
    case 'planning':
      out.push('workflow-planning', 'reasoning');
      break;
    case 'memory':
      out.push('memory-retrieval', 'summarization');
      break;
    case 'safety-review':
      out.push('safety-classification', 'policy-analysis');
      break;
    case 'routing':
      out.push('agent-orchestration', 'workflow-planning', 'cost-control');
      break;
    case 'automation':
      out.push('agent-orchestration', 'workflow-planning');
      break;
    default:
      out.push('reasoning', 'summarization');
      break;
  }

  if (source.includes('cost')) out.push('cost-control');
  if (source.includes('local') || source.includes('offline') || source.includes('sovereign')) {
    out.push('local-sovereign-execution');
  }

  return uniqueCapabilities(out);
}

function inferSensitivity(text: string): PrimeAIRequest['sensitivity'] {
  const source = text.toLowerCase();

  if (hasAny(source, ['restricted', 'admin-only', 'classified', 'secret'])) return 'restricted';
  if (hasAny(source, ['confidential', 'private', 'personal data', 'identity'])) return 'confidential';
  if (hasAny(source, ['public'])) return 'public';

  return 'internal';
}

function inferRiskLevel(
  text: string,
  sensitivity: PrimeAIRequest['sensitivity'],
  taskType: PrimeAITaskType,
): PrimeAIRiskLevel {
  const source = text.toLowerCase();

  if (sensitivity === 'restricted') return 'critical';
  if (hasAny(source, ['sos', 'emergency', 'medical', 'legal', 'child', 'minor', 'biometric'])) return 'high';
  if (hasAny(source, ['security', 'policy', 'billing', 'identity', 'delegation'])) return 'high';
  if (taskType === 'safety-review' || taskType === 'automation') return 'medium';

  return 'low';
}

function inferTruthZone(
  taskType: PrimeAITaskType,
  text: string,
): PrimeAITruthZone {
  const source = text.toLowerCase();

  if (taskType === 'deep-research' || hasAny(source, ['verify', 'evidence', 'sources'])) {
    return 'verified';
  }

  if (taskType === 'code' || taskType === 'build' || taskType === 'routing') {
    return 'mixed';
  }

  if (hasAny(source, ['creative', 'draft', 'generate', 'image', 'video', 'music'])) {
    return 'generative';
  }

  return 'mixed';
}

function inferMemoryWriteAccess(
  truthZone: PrimeAITruthZone,
  sensitivity: PrimeAIRequest['sensitivity'],
  taskType: PrimeAITaskType,
): PrimeAIMemoryWriteAccess {
  if (sensitivity === 'restricted') return 'governor-reviewed';
  if (taskType === 'memory') return 'governor-reviewed';
  if (truthZone === 'verified') return 'project';
  if (truthZone === 'generative') return 'ephemeral-only';
  return 'session';
}

function riskAllowed(maxAllowed: PrimeAIRiskLevel, requested: PrimeAIRiskLevel): boolean {
  return RISK_ORDER.indexOf(requested) <= RISK_ORDER.indexOf(maxAllowed);
}

function estimateCostClass(provider?: PrimeAIProviderScore): 'low' | 'medium' | 'high' | 'unknown' {
  if (!provider) return 'unknown';
  const profile = getPrimeAIProviderProfile(provider.providerKey);
  if (!profile) return 'unknown';
  if (profile.relativeCost < 0.34) return 'low';
  if (profile.relativeCost < 0.67) return 'medium';
  return 'high';
}

function estimateLatencyClass(provider?: PrimeAIProviderScore): 'fast' | 'normal' | 'slow' | 'unknown' {
  if (!provider) return 'unknown';
  const profile = getPrimeAIProviderProfile(provider.providerKey);
  if (!profile) return 'unknown';
  if (profile.relativeLatency < 0.34) return 'fast';
  if (profile.relativeLatency < 0.67) return 'normal';
  return 'slow';
}

function labelForCapability(capability: PrimeAICapabilityFamily): string {
  return capability
    .split('-')
    .map((part) => part.slice(0, 1).toUpperCase() + part.slice(1))
    .join(' ');
}

function isPrimeAICapabilityFamily(value: string): value is PrimeAICapabilityFamily {
  const allowed: PrimeAICapabilityFamily[] = [
    'reasoning',
    'deep-research',
    'coding',
    'app-build',
    'translation',
    'speech-to-text',
    'text-to-speech',
    'vision-understanding',
    'image-generation',
    'video-generation',
    'audio-generation',
    'summarization',
    'memory-retrieval',
    'workflow-planning',
    'agent-orchestration',
    'safety-classification',
    'policy-analysis',
    'cost-control',
    'local-sovereign-execution',
    'unknown',
  ];

  return allowed.includes(value as PrimeAICapabilityFamily);
}

function hasAny(text: string, fragments: string[]): boolean {
  return fragments.some((fragment) => text.includes(fragment));
}

function cleanText(value: unknown, fallback = ''): string {
  return typeof value === 'string' && value.trim().length > 0
    ? value.trim()
    : fallback;
}

function cleanOptionalText(value: unknown): string | undefined {
  const out = cleanText(value);
  return out.length > 0 ? out : undefined;
}

function sanitizeMetadata(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? { ...(value as Record<string, unknown>) }
    : {};
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function uniqueCapabilities(values: PrimeAICapabilityFamily[]): PrimeAICapabilityFamily[] {
  return [...new Set(values)];
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function cloneValue<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function createPrimeAIId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

export const primeAIOrchestrator = {
  route: routePrimeAIRequest,
  normalize: normalizePrimeAIRequest,
  evaluateGovernance: evaluatePrimeAIGovernance,
  rankProviders: rankPrimeAIProviders,
  getProvider: getPrimeAIProviderProfile,
  getProviders: getPrimeAIProviderProfiles,
  getReadinessSnapshot: getPrimeAIReadinessSnapshot,
};

export default primeAIOrchestrator;
