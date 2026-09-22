// core/intake/vision-directive-registry.ts

export interface PantavionVisionDirectiveRecord {
  directiveKey: string;
  title: string;
  category:
    | 'mission'
    | 'region'
    | 'production'
    | 'locale'
    | 'surface'
    | 'safety'
    | 'device'
    | 'economy'
    | 'architecture'
    | 'memory'
    | 'intelligence'
    | 'security'
    | 'continuity'
    | 'innovation';
  priority: 'critical' | 'high' | 'medium';
  statement: string;
  founderLocked: boolean;
}

export interface PantavionVisionDirectiveSnapshot {
  generatedAt: string;
  directiveCount: number;
  criticalCount: number;
  founderLockedCount: number;
}

function nowIso(): string {
  return new Date().toISOString();
}

function cloneValue<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

const VISION_DIRECTIVES: PantavionVisionDirectiveRecord[] = [
  {
    directiveKey: 'mission-global-human-assistance',
    title: 'Global Human Assistance',
    category: 'mission',
    priority: 'critical',
    statement: 'Pantavion serves every human, everywhere, with continuity, intelligence and long-horizon assistance.',
    founderLocked: true,
  },
  {
    directiveKey: 'region-cyprus-mediterranean-anchor',
    title: 'Cyprus Mediterranean Anchor',
    category: 'region',
    priority: 'critical',
    statement: 'Pantavion begins from Cyprus as a Mediterranean hub with multilingual, multicultural and crisis-aware support.',
    founderLocked: true,
  },
  {
    directiveKey: 'production-paid-app-service-engine',
    title: 'Paid App and Service Engine',
    category: 'production',
    priority: 'critical',
    statement: 'Pantavion must be able to produce applications, programs, workflows and services that users can pay for.',
    founderLocked: true,
  },
  {
    directiveKey: 'locale-multilayer-priority',
    title: 'Locale Priority Matrix',
    category: 'locale',
    priority: 'critical',
    statement: 'Pantavion must support core languages first and expand globally by demand, region and mission weight.',
    founderLocked: true,
  },
  {
    directiveKey: 'surface-human-first',
    title: 'Human First Surface',
    category: 'surface',
    priority: 'critical',
    statement: 'The home surface must prioritize assistant, memory, today, voice, SOS, radio, classifieds, services and elite pathways.',
    founderLocked: true,
  },
  {
    directiveKey: 'safety-crisis-readiness',
    title: 'Safety and Crisis Readiness',
    category: 'safety',
    priority: 'high',
    statement: 'Pantavion must remain useful in emergency, war-adjacent, multilingual and low-trust situations.',
    founderLocked: true,
  },
  {
    directiveKey: 'device-universal',
    title: 'Device Universal',
    category: 'device',
    priority: 'high',
    statement: 'Pantavion must work across phones, tablets, laptops, desktops and constrained mobile environments.',
    founderLocked: true,
  },
  {
    directiveKey: 'economy-sovereign-revenue',
    title: 'Sovereign Revenue Model',
    category: 'economy',
    priority: 'high',
    statement: 'Pantavion must generate sustainable revenue through useful production, services, premium experiences and platform value.',
    founderLocked: true,
  },
  {
    directiveKey: 'architecture-multi-kernel-one-truth',
    title: 'Multi-Kernel One Truth',
    category: 'architecture',
    priority: 'critical',
    statement: 'Pantavion may execute through many kernels, agents, models and workers in parallel, but they must share one canonical truth, authority, provenance, implementation lifecycle and audit plane.',
    founderLocked: true,
  },
  {
    directiveKey: 'continuity-no-orphan-founder-vision',
    title: 'No-Orphan Founder Vision',
    category: 'continuity',
    priority: 'critical',
    statement: 'Every founder directive, historical idea, artifact, recovery record and unresolved requirement must retain provenance and an explicit canonical disposition; no idea may disappear because a thread, branch, deployment or provider changes.',
    founderLocked: true,
  },
  {
    directiveKey: 'memory-constitutional-continuity',
    title: 'Constitutional Continuity Memory',
    category: 'memory',
    priority: 'critical',
    statement: 'Pantavion memory must preserve chronology, decisions, commitments, source, confidence and supersession across hot context, warm indexed summaries and cold private immutable archives.',
    founderLocked: true,
  },
  {
    directiveKey: 'intelligence-maximum-bounded-routing',
    title: 'Maximum Bounded Intelligence',
    category: 'intelligence',
    priority: 'critical',
    statement: 'Each task should use the strongest suitable intelligence for quality, latency, trust, privacy, cost and jurisdiction while execution authority remains bounded by identity, consent, policy, risk, budget and reversibility.',
    founderLocked: true,
  },
  {
    directiveKey: 'security-zero-trust-fail-closed',
    title: 'Zero-Trust Fail-Closed Security',
    category: 'security',
    priority: 'critical',
    statement: 'Privileged operations are deny-by-default, secrets remain isolated, and uncertain authority or truth must fail closed with explicit evidence and blocker visibility.',
    founderLocked: true,
  },
  {
    directiveKey: 'innovation-continuous-modern-technology-intake',
    title: 'Continuous Modern Technology Intake',
    category: 'innovation',
    priority: 'critical',
    statement: 'Pantavion continuously evaluates relevant modern technology through research, legal and security review, benchmarking, sandboxing, comparison and canary gates before production adoption.',
    founderLocked: true,
  },
  {
    directiveKey: 'mission-lifelong-humanity-ecosystem',
    title: 'Lifelong Humanity Ecosystem',
    category: 'mission',
    priority: 'critical',
    statement: 'Pantavion must evolve into a durable human-centered ecosystem that supports each person across the life course, from protected childhood experiences through learning, relationships, work, health information, safety, ageing, legacy and end-of-life support, while preserving consent, dignity, privacy and human agency.',
    founderLocked: true,
  },
  {
    directiveKey: 'mission-seven-continent-human-unity',
    title: 'Seven-Continent Human Unity',
    category: 'mission',
    priority: 'critical',
    statement: 'Pantavion must connect all seven continents through one interoperable human network while preserving language, culture, jurisdiction, accessibility, local law and regional resilience.',
    founderLocked: true,
  },
  {
    directiveKey: 'innovation-human-benefit-invention-engine',
    title: 'Human-Benefit Innovation and Invention Engine',
    category: 'innovation',
    priority: 'critical',
    statement: 'Pantavion must continuously discover, research, benchmark and propose high-value advances in AI, science, health technology, neuroscience, healthy ageing, accessibility, security, infrastructure and other human-benefit domains, with evidence, safety and regulatory gates before adoption.',
    founderLocked: true,
  },
  {
    directiveKey: 'intelligence-lifelong-human-companion',
    title: 'Lifelong Human Capability Companion',
    category: 'intelligence',
    priority: 'critical',
    statement: 'Pantavion intelligence should become a trusted extension of human capability by combining consent-aware memory, fast and deep reasoning, specialist intelligence, deterministic truth systems, multimodal interaction and scoped agents without replacing human decision authority.',
    founderLocked: true,
  },
];

export function listVisionDirectives(): PantavionVisionDirectiveRecord[] {
  return VISION_DIRECTIVES.map((item) => cloneValue(item));
}

export function getVisionDirectiveSnapshot(): PantavionVisionDirectiveSnapshot {
  const list = listVisionDirectives();

  return {
    generatedAt: nowIso(),
    directiveCount: list.length,
    criticalCount: list.filter((item) => item.priority === 'critical').length,
    founderLockedCount: list.filter((item) => item.founderLocked).length,
  };
}

export default listVisionDirectives;
