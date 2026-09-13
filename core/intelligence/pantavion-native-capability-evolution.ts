export const PANTAVION_NATIVE_EVOLUTION_VERSION = '2026-09-09.1' as const;

export type EvolutionFamily =
  | 'FOUNDATION' | 'COMMUNICATION' | 'PEOPLE-GRAPH' | 'PERSONAL-AI' | 'AGENTS'
  | 'APP-SERVICE-CREATION' | 'INVENTION' | 'TECHNOLOGY-FACTORY' | 'PRODUCT-ABSORPTION'
  | 'LANGUAGE' | 'SOS-RESILIENCE' | 'TRUST-SECURITY' | 'MEMORY-CONTINUITY'
  | 'GLOBAL-POLICY' | 'DEVICES-IOT' | 'MARKET-WORK' | 'INSTITUTIONAL' | 'HUMAN-ADAPTATION';

export type EvolutionStage =
  | 'DISCOVER' | 'EVIDENCE' | 'ATTACK' | 'GAP' | 'DESIGN' | 'SIMULATE'
  | 'BENCHMARK' | 'SECURE' | 'POLICY' | 'BUILD' | 'TEST' | 'DEPLOY' | 'OBSERVE' | 'IMPROVE';

export interface CapabilityEvolutionRequest {
  intent: string;
  family: EvolutionFamily;
  userContext?: Record<string, unknown>;
  jurisdiction?: string;
  deviceClass?: string;
  evidenceRefs?: string[];
}

export interface CapabilityEvolutionDecision {
  route: EvolutionStage[];
  perspectives: string[];
  authority: 'AUTONOMOUS_SAFE' | 'STRATEGIC_REVIEW_REQUIRED';
  noveltyState: 'UNVERIFIED';
  rules: string[];
}

/**
 * Pantavion-native adaptation of common AI-stack patterns.
 * This is deliberately NOT a claim that RAG, agents, LLM routing, MCP or evals are novel.
 * The differentiator under evaluation is the governed cross-family capability-evolution loop.
 */
export function planCapabilityEvolution(req: CapabilityEvolutionRequest): CapabilityEvolutionDecision {
  const strategic = ['GLOBAL-POLICY', 'TRUST-SECURITY', 'SOS-RESILIENCE', 'INSTITUTIONAL'].includes(req.family);
  return {
    route: ['DISCOVER','EVIDENCE','ATTACK','GAP','DESIGN','SIMULATE','BENCHMARK','SECURE','POLICY','BUILD','TEST','DEPLOY','OBSERVE','IMPROVE'],
    perspectives: [
      'root-cause',
      'competitor-attack',
      'blind-spot',
      'hidden-opportunity',
      'pattern-and-trend',
      'technical-feasibility',
      'human-adaptation',
      'security-and-privacy',
      'jurisdiction-and-rights',
      'resilience-and-failover',
      'commercial-value',
      'prior-art-challenge',
      'evidence-and-truth'
    ],
    authority: strategic ? 'STRATEGIC_REVIEW_REQUIRED' : 'AUTONOMOUS_SAFE',
    noveltyState: 'UNVERIFIED',
    rules: [
      'Preserve original human intent and source provenance.',
      'Do not equate a common technology component with Pantavion novelty.',
      'Prefer provider-neutral adapters and maintain a Pantavion-native migration path.',
      'Never allow AI output to override deterministic identity, age, consent, jurisdiction, billing, security authorization or emergency truth.',
      'Keep private communication out of public/social/training/search graphs unless explicitly authorized.',
      'Require measurable benchmark evidence before replacement or deployment.',
      'Require rollback and observability for every deployed evolution.',
      'Escalate only genuinely strategic, disputed, high-risk, rights-affecting or irreversible decisions.'
    ]
  };
}

export const pantavionNativeStack = {
  intent: 'human intent + context + rights + device + jurisdiction',
  orchestration: 'multi-kernel routing with bounded specialist agents',
  knowledge: 'canonical knowledge + provenance + scoped memory + retrieval',
  intelligence: 'provider-neutral model router + deterministic routes where authoritative truth is required',
  tools: 'capability-scoped tools/adapters with explicit authority',
  creation: 'need-to-capability compilation for apps, services and workflows',
  evolution: 'evidence -> adversarial review -> sandbox -> benchmark -> governed build -> observation -> improvement',
  resilience: 'offline/failover/emergency-aware paths where the capability requires them',
  truth: 'IDEA != CODED != TESTED != DEPLOYED != VERIFIED_LIVE'
} as const;
