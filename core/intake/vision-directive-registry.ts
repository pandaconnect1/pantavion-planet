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
    | 'economy';
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
