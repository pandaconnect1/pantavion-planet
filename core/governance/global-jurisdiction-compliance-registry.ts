// core/governance/global-jurisdiction-compliance-registry.ts

export type PantavionJurisdictionDeploymentMode =
  | 'global-default'
  | 'regional-governed'
  | 'sovereign-overlay'
  | 'restricted-review';

export type PantavionJurisdictionStatus =
  | 'active'
  | 'seeded'
  | 'planned';

export interface PantavionJurisdictionComplianceRecord {
  jurisdictionKey: string;
  title: string;
  region: string;
  deploymentMode: PantavionJurisdictionDeploymentMode;
  privacyPosture: 'standard' | 'high' | 'sovereign';
  aiGovernancePosture: 'standard' | 'high' | 'critical';
  paymentPosture: 'standard' | 'regulated' | 'restricted';
  founderReviewRequired: boolean;
  status: PantavionJurisdictionStatus;
  notes: string[];
}

export interface PantavionJurisdictionComplianceSnapshot {
  generatedAt: string;
  jurisdictionCount: number;
  activeCount: number;
  seededCount: number;
  plannedCount: number;
  sovereignOverlayCount: number;
  founderReviewCount: number;
}

function nowIso(): string {
  return new Date().toISOString();
}

function cloneValue<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

const JURISDICTIONS: PantavionJurisdictionComplianceRecord[] = [
  {
    jurisdictionKey: 'global-baseline',
    title: 'Global Baseline',
    region: 'world',
    deploymentMode: 'global-default',
    privacyPosture: 'high',
    aiGovernancePosture: 'high',
    paymentPosture: 'standard',
    founderReviewRequired: false,
    status: 'active',
    notes: [
      'Default global constitutional baseline.',
      'Used when no stricter sovereign overlay applies.',
    ],
  },
  {
    jurisdictionKey: 'european-union',
    title: 'European Union',
    region: 'europe',
    deploymentMode: 'regional-governed',
    privacyPosture: 'sovereign',
    aiGovernancePosture: 'critical',
    paymentPosture: 'regulated',
    founderReviewRequired: true,
    status: 'active',
    notes: [
      'High-governance regional posture.',
      'Strong privacy and institutional compliance sensitivity.',
    ],
  },
  {
    jurisdictionKey: 'united-states',
    title: 'United States',
    region: 'north-america',
    deploymentMode: 'regional-governed',
    privacyPosture: 'high',
    aiGovernancePosture: 'high',
    paymentPosture: 'regulated',
    founderReviewRequired: false,
    status: 'active',
    notes: [
      'High-scale platform market with strong commercial relevance.',
    ],
  },
  {
    jurisdictionKey: 'china',
    title: 'China',
    region: 'asia',
    deploymentMode: 'sovereign-overlay',
    privacyPosture: 'sovereign',
    aiGovernancePosture: 'critical',
    paymentPosture: 'regulated',
    founderReviewRequired: true,
    status: 'seeded',
    notes: [
      'Requires sovereign deployment thinking and strong local governance controls.',
    ],
  },
  {
    jurisdictionKey: 'japan',
    title: 'Japan',
    region: 'asia',
    deploymentMode: 'regional-governed',
    privacyPosture: 'high',
    aiGovernancePosture: 'high',
    paymentPosture: 'regulated',
    founderReviewRequired: false,
    status: 'seeded',
    notes: [
      'Precision, reliability and long-horizon operational discipline market.',
    ],
  },
  {
    jurisdictionKey: 'russia',
    title: 'Russia',
    region: 'eurasia',
    deploymentMode: 'sovereign-overlay',
    privacyPosture: 'sovereign',
    aiGovernancePosture: 'critical',
    paymentPosture: 'restricted',
    founderReviewRequired: true,
    status: 'seeded',
    notes: [
      'Needs resilience-first and sovereignty-first deployment evaluation.',
    ],
  },
  {
    jurisdictionKey: 'india',
    title: 'India',
    region: 'asia',
    deploymentMode: 'regional-governed',
    privacyPosture: 'high',
    aiGovernancePosture: 'high',
    paymentPosture: 'regulated',
    founderReviewRequired: false,
    status: 'seeded',
    notes: [
      'Mass-scale multilingual growth market.',
    ],
  },
  {
    jurisdictionKey: 'south-korea',
    title: 'South Korea',
    region: 'asia',
    deploymentMode: 'regional-governed',
    privacyPosture: 'high',
    aiGovernancePosture: 'high',
    paymentPosture: 'regulated',
    founderReviewRequired: false,
    status: 'seeded',
    notes: [
      'Fast adaptation cycles and advanced digital consumer infrastructure.',
    ],
  },
];

export function listJurisdictionComplianceRecords(): PantavionJurisdictionComplianceRecord[] {
  return JURISDICTIONS.map((item) => cloneValue(item));
}

export function getJurisdictionComplianceSnapshot(): PantavionJurisdictionComplianceSnapshot {
  const list = listJurisdictionComplianceRecords();

  return {
    generatedAt: nowIso(),
    jurisdictionCount: list.length,
    activeCount: list.filter((item) => item.status === 'active').length,
    seededCount: list.filter((item) => item.status === 'seeded').length,
    plannedCount: list.filter((item) => item.status === 'planned').length,
    sovereignOverlayCount: list.filter((item) => item.deploymentMode === 'sovereign-overlay').length,
    founderReviewCount: list.filter((item) => item.founderReviewRequired).length,
  };
}

export default listJurisdictionComplianceRecords;
